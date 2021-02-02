// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {createPullRequest, Changes} from 'code-suggester';

import {Octokit} from '@octokit/rest';
import {request} from '@octokit/request';
import {graphql} from '@octokit/graphql';
// The return types for responses have not yet been exposed in the
// @octokit/* libraries, we explicitly define the types below to work
// around this,. See: https://github.com/octokit/rest.js/issues/1624
// https://github.com/octokit/types.ts/issues/25.
import {PromiseValue} from 'type-fest';
import {EndpointOptions, OctokitResponse} from '@octokit/types';
type OctokitType = InstanceType<typeof Octokit>;
type PullsListResponseItems = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['pulls']['list']>
>['data'];
type PullsListResponseItem = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['pulls']['get']>
>['data'];
type GitRefResponse = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['git']['getRef']>
>['data'];
type GitGetTreeResponse = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['git']['getTree']>
>['data'];
type IssuesListResponseItem = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['issues']['get']>
>['data'];
type FileSearchResponse = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['search']['code']>
>['data'];
// see: PromiseValue<
//  ReturnType<InstanceType<typeof Octokit>['repos']['createRelease']>
// >['data'];
export type ReleaseCreateResponse = {
  tag_name: string;
  draft: boolean;
  html_url: string;
  upload_url: string;
};

type ReposListTagsResponseItems = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['tags']['list']>
>['data'];

// Extract some types from the `request` package.
type RequestBuilderType = typeof request;
type DefaultFunctionType = RequestBuilderType['defaults'];
type RequestFunctionType = ReturnType<DefaultFunctionType>;
type RequestOptionsType = Parameters<DefaultFunctionType>[0];

type MergedPullRequestFilter = (filter: MergedGitHubPR) => boolean;

import chalk = require('chalk');
import * as semver from 'semver';

import {checkpoint, CheckpointType} from './util/checkpoint';
import {
  Commit,
  CommitsResponse,
  graphqlToCommits,
  PREdge,
} from './graphql-to-commits';
import {Update} from './updaters/update';
import {BranchName} from './util/branch-name';

export interface OctokitAPIs {
  graphql: Function;
  request: RequestFunctionType;
  octokit: OctokitType;
}

interface GitHubOptions {
  defaultBranch?: string;
  token?: string;
  owner: string;
  repo: string;
  apiUrl?: string;
  proxyKey?: string;
  octokitAPIs?: OctokitAPIs;
}

export interface GitHubTag {
  name: string;
  sha: string;
  version: string;
}

export interface GitHubFileContents {
  sha: string;
  content: string;
  parsedContent: string;
}

export interface GitHubPR {
  branch: string;
  fork: boolean;
  version: string;
  title: string;
  body: string;
  sha: string;
  updates: Update[];
  labels: string[];
}

export interface MergedGitHubPR {
  sha: string;
  number: number;
  baseRefName: string;
  headRefName: string;
  labels: string[];
  title: string;
  body: string;
}

let probotMode = false;

export class GitHub {
  defaultBranch?: string;
  octokit: OctokitType;
  request: RequestFunctionType;
  graphql: Function;
  token: string | undefined;
  owner: string;
  repo: string;
  apiUrl: string;
  proxyKey?: string;

  constructor(options: GitHubOptions) {
    this.defaultBranch = options.defaultBranch;
    this.token = options.token;
    this.owner = options.owner;
    this.repo = options.repo;
    this.apiUrl = options.apiUrl || 'https://api.github.com';
    this.proxyKey = options.proxyKey;

    if (options.octokitAPIs === undefined) {
      this.octokit = new Octokit({
        baseUrl: options.apiUrl,
        auth: this.token,
      });
      const defaults: RequestOptionsType = {
        baseUrl: this.apiUrl,
        headers: {
          'user-agent': `release-please/${
            require('../../package.json').version
          }`,
          // some proxies do not require the token prefix.
          Authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
        },
      };
      this.request = request.defaults(defaults);
      this.graphql = graphql;
    } else {
      // for the benefit of probot applications, we allow a configured instance
      // of octokit to be passed in as a parameter.
      probotMode = true;
      this.octokit = options.octokitAPIs.octokit;
      this.request = options.octokitAPIs.request;
      this.graphql = options.octokitAPIs.graphql;
    }
  }

  private async graphqlRequest(_opts: {
    [key: string]: string | number | null | undefined;
  }) {
    let opts = Object.assign({}, _opts);
    if (!probotMode) {
      opts = Object.assign(opts, {
        url: `${this.apiUrl}/graphql${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        headers: {
          authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
          'content-type': 'application/vnd.github.v3+json',
        },
      });
    }
    return this.graphql(opts);
  }

  private decoratePaginateOpts(opts: EndpointOptions): EndpointOptions {
    if (probotMode) {
      return opts;
    } else {
      return Object.assign(opts, {
        headers: {
          Authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
        },
      });
    }
  }

  async commitsSinceSha(
    sha: string | undefined,
    perPage = 100,
    labels = false,
    path: string | null = null
  ): Promise<Commit[]> {
    const commits: Commit[] = [];
    const method = labels ? 'commitsWithLabels' : 'commitsWithFiles';

    let cursor;
    for (;;) {
      const commitsResponse: CommitsResponse = await this[method](
        cursor,
        perPage,
        path
      );
      for (let i = 0, commit: Commit; i < commitsResponse.commits.length; i++) {
        commit = commitsResponse.commits[i];
        if (commit.sha === sha) {
          return commits;
        } else {
          commits.push(commit);
        }
      }
      if (commitsResponse.hasNextPage === false || !commitsResponse.endCursor) {
        return commits;
      } else {
        cursor = commitsResponse.endCursor;
      }
    }
  }

  private async commitsWithFiles(
    cursor: string | undefined = undefined,
    perPage = 32,
    path: string | null = null,
    maxFilesChanged = 64,
    retries = 0
  ): Promise<CommitsResponse> {
    const baseBranch = await this.getDefaultBranch();

    // The GitHub v3 API does not offer an elegant way to fetch commits
    // in conjucntion with the path that they modify. We lean on the graphql
    // API for this one task, fetching commits in descending chronological
    // order along with the file paths attached to them.
    try {
      const response = await this.graphqlRequest({
        query: `query commitsWithFiles($cursor: String, $owner: String!, $repo: String!, $baseRef: String!, $perPage: Int, $maxFilesChanged: Int, $path: String) {
          repository(owner: $owner, name: $repo) {
            ref(qualifiedName: $baseRef) {
              target {
                ... on Commit {
                  history(first: $perPage, after: $cursor, path: $path) {
                    edges {
                      node {
                        ... on Commit {
                          message
                          oid
                          associatedPullRequests(first: 1) {
                            edges {
                              node {
                                ... on PullRequest {
                                  number
                                  mergeCommit {
                                    oid
                                  }
                                  files(first: $maxFilesChanged) {
                                    edges {
                                      node {
                                        path
                                      }
                                    }
                                    pageInfo {
                                      endCursor
                                      hasNextPage
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                  }
                }
              }
            }
          }
        }`,
        cursor,
        maxFilesChanged,
        owner: this.owner,
        path,
        perPage,
        repo: this.repo,
        baseRef: `refs/heads/${baseBranch}`,
      });
      return graphqlToCommits(this, response);
    } catch (err) {
      if (err.status === 502 && retries < 3) {
        // GraphQL sometimes returns a 502 on the first request,
        // this seems to relate to a cache being warmed and the
        // second request generally works.
        return this.commitsWithFiles(
          cursor,
          perPage,
          path,
          maxFilesChanged,
          retries++
        );
      } else {
        throw err;
      }
    }
  }

  private async commitsWithLabels(
    cursor: string | undefined = undefined,
    perPage = 32,
    path: string | null = null,
    maxLabels = 16,
    retries = 0
  ): Promise<CommitsResponse> {
    const baseBranch = await this.getDefaultBranch();
    try {
      const response = await this.graphqlRequest({
        query: `query commitsWithLabels($cursor: String, $owner: String!, $repo: String!, $baseRef: String!, $perPage: Int, $maxLabels: Int, $path: String) {
          repository(owner: $owner, name: $repo) {
            ref(qualifiedName: $baseRef) {
              target {
                ... on Commit {
                  history(first: $perPage, after: $cursor, path: $path) {
                    edges {
                      node {
                        ... on Commit {
                          message
                          oid
                          associatedPullRequests(first: 1) {
                            edges {
                              node {
                                ... on PullRequest {
                                  number
                                  mergeCommit {
                                    oid
                                  }
                                  labels(first: $maxLabels) {
                                    edges {
                                      node {
                                        name
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                  }
                }
              }
            }
          }
        }`,
        cursor,
        maxLabels,
        owner: this.owner,
        path,
        perPage,
        repo: this.repo,
        baseRef: `refs/heads/${baseBranch}`,
      });
      return graphqlToCommits(this, response);
    } catch (err) {
      if (err.status === 502 && retries < 3) {
        // GraphQL sometimes returns a 502 on the first request,
        // this seems to relate to a cache being warmed and the
        // second request generally works.
        return this.commitsWithLabels(
          cursor,
          perPage,
          path,
          maxLabels,
          retries++
        );
      } else {
        throw err;
      }
    }
  }

  async pullRequestFiles(
    num: number,
    cursor: string,
    maxFilesChanged = 100
  ): Promise<PREdge> {
    // Used to handle the edge-case in which a PR has more than 100
    // modified files attached to it.
    const response = await this.graphqlRequest({
      query: `query pullRequestFiles($cursor: String, $owner: String!, $repo: String!, $maxFilesChanged: Int, $num: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $num) {
              number
              files(first: $maxFilesChanged, after: $cursor) {
                edges {
                  node {
                    path
                  }
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
          }
        }`,
      cursor,
      maxFilesChanged,
      owner: this.owner,
      repo: this.repo,
      num,
    });
    return {node: response.repository.pullRequest} as PREdge;
  }

  async getTagSha(name: string): Promise<string> {
    const refResponse = (await this.request(
      `GET /repos/:owner/:repo/git/refs/tags/:name${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        name,
      }
    )) as {data: GitRefResponse};
    return refResponse.data.object.sha;
  }

  // This looks for the most recent matching release tag on
  // the branch we're configured for.
  async latestTag(
    prefix?: string,
    preRelease = false
  ): Promise<GitHubTag | undefined> {
    const pull = await this.findMergedReleasePR([], prefix, preRelease);
    if (!pull) return await this.latestTagFallback(prefix, preRelease);

    // FIXME: this assumes that the version is in the branch name
    const branchName = BranchName.parse(pull.headRefName)!;
    const version = branchName.getVersion()!;
    const normalizedVersion = semver.valid(version)!;

    const tag = {
      name: `v${normalizedVersion}`,
      sha: pull.sha,
      version: normalizedVersion,
    } as GitHubTag;
    return tag;
  }

  // If we can't find a release branch (a common cause of this, as an example
  // is that we might be dealing with the first relese), use the last semver
  // tag that's available on the repository:
  // TODO: it would be good to not need to maintain this logic, and the
  // logic that introspects version based on the prior release PR.
  async latestTagFallback(prefix?: string, preRelease = false) {
    const tags: {[version: string]: GitHubTag} = await this.allTags(prefix);
    const versions = Object.keys(tags).filter(t => {
      // remove any pre-releases from the list:
      return preRelease || !t.includes('-');
    });
    // no tags have been created yet.
    if (versions.length === 0) return undefined;

    // We use a slightly modified version of semver's sorting algorithm, which
    // prefixes the numeric part of a pre-release with '0's, so that
    // 010 is greater than > 002.
    versions.sort((v1, v2) => {
      if (v1.includes('-')) {
        const [prefix, suffix] = v1.split('-');
        v1 = prefix + '-' + suffix.replace(/[a-zA-Z.]/, '').padStart(6, '0');
      }
      if (v2.includes('-')) {
        const [prefix, suffix] = v2.split('-');
        v2 = prefix + '-' + suffix.replace(/[a-zA-Z.]/, '').padStart(6, '0');
      }
      return semver.rcompare(v1, v2);
    });
    return {
      name: tags[versions[0]].name,
      sha: tags[versions[0]].sha,
      version: tags[versions[0]].version,
    };
  }

  private async allTags(
    prefix?: string
  ): Promise<{[version: string]: GitHubTag}> {
    // If we've fallen back to using allTags, support "-", "@", and "/" as a
    // suffix separating the library name from the version #. This allows
    // a repository to be seamlessly be migrated from a tool like lerna:
    const prefixes: string[] = [];
    if (prefix) {
      prefix = prefix.substring(0, prefix.length - 1);
      for (const suffix of ['-', '@', '/']) {
        prefixes.push(`${prefix}${suffix}`);
      }
    }
    const tags: {[version: string]: GitHubTag} = {};
    for await (const response of this.octokit.paginate.iterator(
      this.decoratePaginateOpts({
        method: 'GET',
        url: `/repos/${this.owner}/${this.repo}/tags?per_page=100${
          this.proxyKey ? `&key=${this.proxyKey}` : ''
        }`,
      })
    )) {
      response.data.forEach((data: ReposListTagsResponseItems) => {
        // For monorepos, a prefix can be provided, indicating that only tags
        // matching the prefix should be returned:
        let version = data.name;
        if (prefix) {
          let match = false;
          for (prefix of prefixes) {
            if (data.name.startsWith(prefix)) {
              version = data.name.replace(prefix, '');
              match = true;
            }
          }
          if (!match) return;
        }
        if ((version = semver.valid(version))) {
          tags[version] = {sha: data.commit.sha, name: data.name, version};
        }
      });
    }
    return tags;
  }

  /**
   * Return a list of merged pull requests. The list is not guaranteed to be sorted
   * by merged_at, but is generally most recent first.
   *
   * @param {string} targetBranch - Base branch of the pull request. Defaults to
   *   the configured default branch.
   * @param {number} page - Page of results. Defaults to 1.
   * @param {number} perPage - Number of results per page. Defaults to 100.
   * @returns {MergedGitHubPR[]} - List of merged pull requests
   */
  async findMergedPullRequests(
    targetBranch?: string,
    page = 1,
    perPage = 100
  ): Promise<MergedGitHubPR[]> {
    if (!targetBranch) {
      targetBranch = await this.getDefaultBranch();
    }
    // TODO: is sorting by updated better?
    const pullsResponse = (await this.request(
      `GET /repos/:owner/:repo/pulls?state=closed&per_page=${perPage}&page=${page}&base=${targetBranch}&sort=created&direction=desc`,
      {
        owner: this.owner,
        repo: this.repo,
      }
    )) as {data: PullsListResponseItems};

    // TODO: distinguish between no more pages and a full page of
    // closed, non-merged pull requests. At page size of 100, this unlikely
    // to matter

    if (!pullsResponse.data) {
      return [];
    }

    return (
      pullsResponse.data
        // only return merged pull requests
        .filter(pull => {
          return !!pull.merged_at;
        })
        .map(pull => {
          const labels = pull.labels
            ? pull.labels.map(l => {
                return l.name + '';
              })
            : [];
          return {
            sha: pull.merge_commit_sha!, // already filtered non-merged
            number: pull.number,
            baseRefName: pull.base.ref,
            headRefName: pull.head.ref,
            labels,
            title: pull.title,
            body: pull.body + '',
          };
        })
    );
  }

  /**
   * Helper to find the first merged pull request that matches the
   * given criteria. The helper will paginate over all pull requests
   * merged into the specified target branch.
   *
   * @param {string} targetBranch - Base branch of the pull request
   * @param {MergedPullRequestFilter} filter - Callback function that
   *   returns whether a pull request matches certain criteria
   * @returns {MergedGitHubPR | undefined} - Returns the first matching
   *   pull request, or `undefined` if no matching pull request found.
   */
  async findMergedPullRequest(
    targetBranch: string,
    filter: MergedPullRequestFilter
  ): Promise<MergedGitHubPR | undefined> {
    let page = 1;
    let mergedPullRequests = await this.findMergedPullRequests(
      targetBranch,
      page
    );
    while (mergedPullRequests.length > 0) {
      const found = mergedPullRequests.find(filter);
      if (found) {
        return found;
      }
      page += 1;
      mergedPullRequests = await this.findMergedPullRequests(
        targetBranch,
        page
      );
    }
    return undefined;
  }

  // The default matcher will rule out pre-releases.
  // TODO: make this handle more than 100 results using async iterator.
  async findMergedReleasePR(
    labels: string[],
    branchPrefix: string | undefined = undefined,
    preRelease = true
  ): Promise<MergedGitHubPR | undefined> {
    const baseBranch = await this.getDefaultBranch();

    branchPrefix = branchPrefix?.endsWith('-')
      ? branchPrefix.replace(/-$/, '')
      : branchPrefix;
    return await this.findMergedPullRequest(
      baseBranch,
      (mergedPullRequest: MergedGitHubPR) => {
        // If labels specified, ensure the pull request has all the specified labels
        if (
          labels.length > 0 &&
          !this.hasAllLabels(labels, mergedPullRequest.labels)
        ) {
          return false;
        }

        const branchName = BranchName.parse(mergedPullRequest.headRefName);
        if (!branchName) {
          return false;
        }

        // If branchPrefix is specified, ensure it is found in the branch name.
        // If branchPrefix is not specified, component should also be undefined.
        if (branchName.getComponent() !== branchPrefix) {
          return false;
        }

        // In this implementation we expect to have a release version
        const version = branchName.getVersion();
        if (!version) {
          return false;
        }

        // What's left by now should just be the version string.
        // Check for pre-releases if needed.
        if (!preRelease && version.indexOf('-') >= 0) {
          return false;
        }

        // Make sure we did get a valid semver.
        const normalizedVersion = semver.valid(version);
        if (!normalizedVersion) {
          return false;
        }

        return true;
      }
    );
  }

  private hasAllLabels(labelsA: string[], labelsB: string[]) {
    let hasAll = true;
    labelsA.forEach(label => {
      if (labelsB.indexOf(label) === -1) hasAll = false;
    });
    return hasAll;
  }

  async findOpenReleasePRs(
    labels: string[],
    perPage = 100
  ): Promise<PullsListResponseItems> {
    const baseLabel = await this.getBaseLabel();

    const openReleasePRs: PullsListResponseItems = [];
    const pullsResponse = (await this.request(
      `GET /repos/:owner/:repo/pulls?state=open&per_page=${perPage}${
        this.proxyKey ? `&key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
      }
    )) as {data: PullsListResponseItems};
    for (const pull of pullsResponse.data) {
      // Verify that this PR was based against our base branch of interest.
      if (!pull.base || pull.base.label !== baseLabel) continue;

      let hasAllLabels = false;
      const observedLabels = pull.labels.map(l => l.name);
      for (const expectedLabel of labels) {
        if (observedLabels.includes(expectedLabel)) {
          hasAllLabels = true;
        } else {
          hasAllLabels = false;
          break;
        }
      }
      if (hasAllLabels) openReleasePRs.push(pull);
    }
    return openReleasePRs;
  }

  async addLabels(labels: string[], pr: number) {
    checkpoint(
      `adding label ${chalk.green(labels.join(','))} to https://github.com/${
        this.owner
      }/${this.repo}/pull/${pr}`,
      CheckpointType.Success
    );
    return this.request(
      `POST /repos/:owner/:repo/issues/:issue_number/labels${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        issue_number: pr,
        labels,
      }
    );
  }

  async findExistingReleaseIssue(
    title: string,
    labels: string[]
  ): Promise<IssuesListResponseItem | undefined> {
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.decoratePaginateOpts({
          method: 'GET',
          url: `/repos/${this.owner}/${this.repo}/issues?labels=${labels.join(
            ','
          )}${this.proxyKey ? `&key=${this.proxyKey}` : ''}`,
          per_page: 100,
        })
      )) {
        for (let i = 0; response.data[i] !== undefined; i++) {
          const issue = response.data[i] as IssuesListResponseItem;
          if (issue.title.indexOf(title) !== -1 && issue.state === 'open') {
            return issue;
          }
        }
      }
    } catch (err) {
      if (err.status === 404) {
        // the most likely cause of a 404 during this step is actually
        // that the user does not have access to the repo:
        throw new AuthError();
      } else {
        throw err;
      }
    }
    return undefined;
  }

  async openPR(options: GitHubPR): Promise<number | undefined> {
    const defaultBranch = await this.getDefaultBranch();

    // check if there's an existing PR, so that we can opt to update it
    // rather than creating a new PR.
    const refName = `refs/heads/${options.branch}`;
    let openReleasePR: PullsListResponseItem | undefined;
    const releasePRCandidates = await this.findOpenReleasePRs(options.labels);
    for (const releasePR of releasePRCandidates) {
      if (refName && refName.includes(releasePR.head.ref)) {
        openReleasePR = releasePR as PullsListResponseItem;
        break;
      }
    }

    // Short-circuit if there have been no changes to the pull-request body.
    if (openReleasePR && openReleasePR.body === options.body) {
      checkpoint(
        `PR https://github.com/${this.owner}/${this.repo}/pull/${openReleasePR.number} remained the same`,
        CheckpointType.Failure
      );
      return undefined;
    }

    //  Actually update the files for the release:
    const changes = await this.getChangeSet(options.updates, defaultBranch);
    const prNumber = await createPullRequest(
      this.octokit,
      changes,
      {
        upstreamOwner: this.owner,
        upstreamRepo: this.repo,
        title: options.title,
        branch: options.branch,
        description: options.body,
        primary: defaultBranch,
        force: true,
        fork: options.fork,
        message: options.title,
      },
      {level: 'error'}
    );

    // If a release PR was already open, update the title and body:
    if (openReleasePR) {
      checkpoint(
        `update pull-request #${openReleasePR.number}: ${chalk.yellow(
          options.title
        )}`,
        CheckpointType.Success
      );
      await this.request(
        `PATCH /repos/:owner/:repo/pulls/:pull_number${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        {
          pull_number: openReleasePR.number,
          owner: this.owner,
          repo: this.repo,
          title: options.title,
          body: options.body,
          state: 'open',
        }
      );
      return openReleasePR.number;
    } else {
      return prNumber;
    }
  }

  private async getChangeSet(
    updates: Update[],
    defaultBranch: string
  ): Promise<Changes> {
    const changes = new Map();
    for (const update of updates) {
      let content;
      try {
        if (update.contents) {
          // we already loaded the file contents earlier, let's not
          // hit GitHub again.
          content = {data: update.contents};
        } else {
          const fileContent = await this.getFileContentsOnBranch(
            update.path,
            defaultBranch
          );
          content = {data: fileContent};
        }
      } catch (err) {
        if (err.status !== 404) throw err;
        // if the file is missing and create = false, just continue
        // to the next update, otherwise create the file.
        if (!update.create) {
          checkpoint(
            `file ${chalk.green(update.path)} did not exist`,
            CheckpointType.Failure
          );
          continue;
        }
      }
      const contentText = content
        ? Buffer.from(content.data.content, 'base64').toString('utf8')
        : undefined;
      const updatedContent = update.updateContent(contentText);
      if (updatedContent) {
        changes.set(update.path, {
          content: updatedContent,
          mode: '100644',
        });
      }
    }
    return changes;
  }

  // The base label is basically the default branch, attached to the owner.
  private async getBaseLabel(): Promise<string> {
    const baseBranch = await this.getDefaultBranch();
    return `${this.owner}:${baseBranch}`;
  }

  async getDefaultBranch(): Promise<string> {
    if (this.defaultBranch) {
      return this.defaultBranch;
    }
    const {data} = await this.octokit.repos.get({
      repo: this.repo,
      owner: this.owner,
      headers: {
        Authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
      },
    });
    this.defaultBranch = (data as {default_branch: string}).default_branch;
    return this.defaultBranch as string;
  }

  async closePR(prNumber: number) {
    await this.request(
      `PATCH /repos/:owner/:repo/pulls/:pull_number${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        state: 'closed',
      }
    );
  }

  // Takes a potentially unqualified branch name, and turns it
  // into a fully qualified ref.
  //
  // e.g. main -> refs/heads/main
  static qualifyRef(refName: string): string {
    let final = refName;
    if (final.indexOf('/') < 0) {
      final = `refs/heads/${final}`;
    }

    return final;
  }

  async getFileContentsWithSimpleAPI(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    const ref = GitHub.qualifyRef(branch);
    const options: RequestOptionsType = {
      owner: this.owner,
      repo: this.repo,
      path,
    };
    if (ref) options.ref = ref;
    const resp = await this.request(
      `GET /repos/:owner/:repo/contents/:path${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      options
    );
    return {
      parsedContent: Buffer.from(resp.data.content, 'base64').toString('utf8'),
      content: resp.data.content,
      sha: resp.data.sha,
    };
  }

  async getFileContentsWithDataAPI(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    const options: RequestOptionsType = {
      owner: this.owner,
      repo: this.repo,
      branch,
    };
    const repoTree: OctokitResponse<GitGetTreeResponse> = await this.request(
      `GET /repos/:owner/:repo/git/trees/:branch${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      options
    );

    const blobDescriptor = repoTree.data.tree.find(tree => tree.path === path);
    if (!blobDescriptor) {
      throw new Error(`Could not find requested path: ${path}`);
    }

    const resp = await this.request(
      `GET /repos/:owner/:repo/git/blobs/:sha${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        sha: blobDescriptor.sha,
      }
    );

    return {
      parsedContent: Buffer.from(resp.data.content, 'base64').toString('utf8'),
      content: resp.data.content,
      sha: resp.data.sha,
    };
  }

  async getFileContents(path: string): Promise<GitHubFileContents> {
    return await this.getFileContentsOnBranch(
      path,
      await this.getDefaultBranch()
    );
  }

  async getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    try {
      return await this.getFileContentsWithSimpleAPI(path, branch);
    } catch (err) {
      if (err.status === 403) {
        return await this.getFileContentsWithDataAPI(path, branch);
      }
      throw err;
    }
  }

  async createRelease(
    packageName: string,
    tagName: string,
    sha: string,
    releaseNotes: string,
    draft: boolean
  ): Promise<ReleaseCreateResponse> {
    checkpoint(`creating release ${tagName}`, CheckpointType.Success);
    return (
      await this.request(
        `POST /repos/:owner/:repo/releases${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        {
          owner: this.owner,
          repo: this.repo,
          tag_name: tagName,
          target_commitish: sha,
          body: releaseNotes,
          name: `${packageName} ${tagName}`,
          draft: draft,
        }
      )
    ).data;
  }

  async removeLabels(labels: string[], prNumber: number) {
    for (let i = 0, label; i < labels.length; i++) {
      label = labels[i];
      checkpoint(
        `removing label ${chalk.green(label)} from ${chalk.green(
          '' + prNumber
        )}`,
        CheckpointType.Success
      );
      await this.request(
        `DELETE /repos/:owner/:repo/issues/:issue_number/labels/:name${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        {
          owner: this.owner,
          repo: this.repo,
          issue_number: prNumber,
          name: label,
        }
      );
    }
  }

  normalizePrefix(prefix: string) {
    return prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '');
  }

  /**
   * Returns a list of paths to all files with a given name.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param filename The name of the file to find
   * @param ref Git reference to search files in
   * @param prefix Optional path prefix used to filter results
   */
  async findFilesByFilenameAndRef(
    filename: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    if (prefix) {
      prefix = this.normalizePrefix(prefix);
    }
    const response: {
      data: GitGetTreeResponse;
    } = await this.octokit.git.getTree({
      owner: this.owner,
      repo: this.repo,
      tree_sha: ref,
      recursive: 'true',
    });
    return response.data.tree
      .filter(file => {
        const path = file.path;
        return (
          path &&
          // match the filename
          path.endsWith(filename) &&
          // match the prefix if provided
          (!prefix || path.startsWith(prefix))
        );
      })
      .map(file => {
        let path = file.path!;
        // strip the prefix if provided
        if (prefix) {
          const pfix = new RegExp(`^${prefix}[/\\\\]`);
          path = path.replace(pfix, '');
        }
        return path;
      });
  }
  /**
   * Returns a list of paths to all files with a given name.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param filename The name of the file to find
   * @param prefix Optional path prefix used to filter results
   */
  async findFilesByFilename(
    filename: string,
    prefix?: string
  ): Promise<string[]> {
    return this.findFilesByFilenameAndRef(
      filename,
      await this.getDefaultBranch(),
      prefix
    );
  }

  /**
   * Returns a list of paths to all files with a given file
   * extension.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param extension The file extension used to filter results.
   *   Example: `js`, `java`
   * @param ref Git reference to search files in
   * @param prefix Optional path prefix used to filter results
   */
  async findFilesByExtensionAndRef(
    extension: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    if (prefix) {
      prefix = this.normalizePrefix(prefix);
    }
    const response: {
      data: GitGetTreeResponse;
    } = await this.octokit.git.getTree({
      owner: this.owner,
      repo: this.repo,
      tree_sha: ref,
      recursive: 'true',
    });
    return response.data.tree
      .filter(file => {
        const path = file.path;
        return (
          path &&
          // match the file extension
          path.endsWith(`.${extension}`) &&
          // match the prefix if provided
          (!prefix || path.startsWith(prefix))
        );
      })
      .map(file => {
        let path = file.path!;
        // strip the prefix if provided
        if (prefix) {
          const pfix = new RegExp(`^${prefix}[/\\\\]`);
          path = path.replace(pfix, '');
        }
        return path;
      });
  }

  /**
   * Returns a list of paths to all files with a given file
   * extension.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param extension The file extension used to filter results.
   *   Example: `js`, `java`
   * @param prefix Optional path prefix used to filter results
   */
  async findFilesByExtension(
    extension: string,
    prefix?: string
  ): Promise<string[]> {
    return this.findFilesByExtensionAndRef(
      extension,
      await this.getDefaultBranch(),
      prefix
    );
  }
}

class AuthError extends Error {
  status: number;

  constructor() {
    super('unauthorized');
    this.status = 401;
  }
}
