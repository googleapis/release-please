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
import {EndpointOptions} from '@octokit/types';
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
type ReposListTagsResponseItems = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['tags']['list']>
>['data'];
type IssuesListResponseItem = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['issues']['get']>
>['data'];
type FileSearchResponse = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['search']['code']>
>['data'];
export type ReleaseCreateResponse = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['repos']['createRelease']>
>['data'];

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

const VERSION_FROM_BRANCH_RE = /^.*:release-(.*)$/;

export interface OctokitAPIs {
  graphql: Function;
  request: Function;
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

export interface GitHubReleasePR {
  number: number;
  version: string;
  sha: string;
  normalizedVersion: string;
}

export interface GitHubFileContents {
  sha: string;
  content: string;
  parsedContent: string;
}

interface GitHubPR {
  branch: string;
  fork: boolean;
  version: string;
  title: string;
  body: string;
  sha: string;
  updates: Update[];
  labels: string[];
}

interface FileSearchResponseFile {
  path: string;
}

let probotMode = false;

export class GitHub {
  defaultBranch?: string;
  octokit: OctokitType;
  request: Function;
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
      const defaults: {[key: string]: string | object} = {
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
    const baseBranch = await this.getDefaultBranch(this.owner, this.repo);

    // The GitHub v3 API does not offer an elegant way to fetch commits
    // in conjucntion with the path that they modify. We lean on the graphql
    // API for this one task, fetching commits in descending chronological
    // order along with the file paths attached to them.
    try {
      const response = await this.graphqlRequest({
        query: `query commitsWithFiles($cursor: String, $owner: String!, $repo: String!, $baseBranch: String!, $perPage: Int, $maxFilesChanged: Int, $path: String) {
          repository(owner: $owner, name: $repo) {
            refs(first: 1, refPrefix: "refs/heads/", query: $baseBranch) {
              edges {
                node {
                  target {
                    ... on Commit {
                      history(first: $perPage, after: $cursor, path: $path) {
                        edges{
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
            }
          }
        }`,
        cursor,
        maxFilesChanged,
        owner: this.owner,
        path,
        perPage,
        repo: this.repo,
        baseBranch,
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
    const baseBranch = await this.getDefaultBranch(this.owner, this.repo);
    try {
      const response = await this.graphqlRequest({
        query: `query commitsWithLabels($cursor: String, $owner: String!, $repo: String!, $baseBranch: String!, $perPage: Int, $maxLabels: Int, $path: String) {
          repository(owner: $owner, name: $repo) {
            refs(first: 1, refPrefix: "refs/heads/", query: $baseBranch) {
              edges {
                node {
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
            }
          }
        }`,
        cursor,
        maxLabels,
        owner: this.owner,
        path,
        perPage,
        repo: this.repo,
        baseBranch,
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
    let regexpString = prefix || '';
    if (!preRelease) regexpString = `^${regexpString}[^-]*$`;

    const regexp = regexpString ? new RegExp(regexpString) : null;

    const pull = await this.findMergedReleasePR([], 100, regexp);
    if (!pull) return undefined;

    const tag = {
      name: `v${pull.normalizedVersion}`,
      sha: pull.sha,
      version: pull.normalizedVersion,
    } as GitHubTag;

    return tag;
  }

  // The default matcher will rule out pre-releases.
  async findMergedReleasePR(
    labels: string[],
    perPage = 100,
    matcher: RegExp | null = /[^-]*/
  ): Promise<GitHubReleasePR | undefined> {
    const baseLabel = await this.getBaseLabel(this.owner, this.repo);

    const pullsResponse = (await this.request(
      `GET /repos/:owner/:repo/pulls?state=closed&per_page=${perPage}${
        this.proxyKey ? `&key=${this.proxyKey}` : ''
      }&sort=updated&direction=desc`,
      {
        owner: this.owner,
        repo: this.repo,
      }
    )) as {data: PullsListResponseItems};
    for (let i = 0, pull; i < pullsResponse.data.length; i++) {
      pull = pullsResponse.data[i];
      if (
        labels.length === 0 ||
        this.hasAllLabels(
          labels,
          pull.labels.map(l => l.name)
        )
      ) {
        // it's expected that a release PR will have a
        // HEAD matching the format repo:release-v1.0.0.
        if (!pull.head) continue;

        // Verify that this PR was based against our base branch of interest.
        if (!pull.base || pull.base.label !== baseLabel) continue;

        const match = pull.head.label.match(VERSION_FROM_BRANCH_RE);
        if (!match || !pull.merged_at) continue;

        // Make sure we did get a valid semver.
        const version = match[1];
        const normalizedVersion = semver.valid(version);
        if (!normalizedVersion) continue;

        // Does its name match any passed matcher?
        if (matcher && !matcher.test(normalizedVersion)) continue;

        return {
          number: pull.number,
          sha: pull.merge_commit_sha,
          version,
          normalizedVersion,
        } as GitHubReleasePR;
      }
    }
    return undefined;
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
    const baseLabel = await this.getBaseLabel(this.owner, this.repo);

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

  async openPR(options: GitHubPR): Promise<number> {
    let refName = await this.refByBranchName(options.branch);
    let openReleasePR: PullsListResponseItem | undefined;

    // If the branch exists, we delete it and create a new branch
    // with the same name; this results in the existing PR being closed.
    if (!refName) {
      refName = `refs/heads/${options.branch}`;
    }

    // check if there's an existing PR, so that we can opt to update it
    // rather than creating a new PR.
    const releasePRCandidates = await this.findOpenReleasePRs(options.labels);
    for (const releasePR of releasePRCandidates) {
      if (refName && refName.includes(releasePR.head.ref)) {
        openReleasePR = releasePR as PullsListResponseItem;
        break;
      }
    }

    // short-circuit of there have been no changes to the
    // pull-request body.
    if (openReleasePR && openReleasePR.body === options.body) {
      checkpoint(
        `PR https://github.com/${this.owner}/${this.repo}/pull/${openReleasePR.number} remained the same`,
        CheckpointType.Failure
      );
      return 0;
    }

    //  Actually update the files for the release:
    const changes = await this.getChangeSet(options.updates, refName);
    const prNumber = await createPullRequest(
      this.octokit,
      changes,
      {
        upstreamOwner: this.owner,
        upstreamRepo: this.repo,
        title: options.title,
        branch: options.branch,
        description: options.body,
        primary: refName,
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
    refName: string
  ): Promise<Changes> {
    const changes = new Map();
    for (const update of updates) {
      // merge ends here
      let content;
      try {
        if (update.contents) {
          // we already loaded the file contents earlier, let's not
          // hit GitHub again.
          content = {data: update.contents};
        } else {
          const fileContent = await this.getFileContents(update.path, refName);
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
  private async getBaseLabel(owner: string, repo: string): Promise<string> {
    const baseBranch = await this.getDefaultBranch(owner, repo);
    return `${owner}:${baseBranch}`;
  }

  private async refByBranchName(branch: string): Promise<string | undefined> {
    let ref;
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.decoratePaginateOpts({
          method: 'GET',
          url: `/repos/${this.owner}/${this.repo}/git/refs?per_page=100${
            this.proxyKey ? `&key=${this.proxyKey}` : ''
          }`,
          headers: {
            Authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
          },
        })
      )) {
        const resp = response as {data: GitRefResponse[]};
        for (let i = 0, r; resp.data[i] !== undefined; i++) {
          r = resp.data[i];
          const refRe = new RegExp(`/${branch}$`);
          if (r.ref.match(refRe)) {
            ref = r.ref;
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

    return ref;
  }

  private async getDefaultBranch(owner: string, repo: string): Promise<string> {
    if (this.defaultBranch) {
      return this.defaultBranch;
    }
    const {data} = await this.octokit.repos.get({
      repo,
      owner,
      headers: {
        Authorization: `${this.proxyKey ? '' : 'token '}${this.token}`,
      },
    });
    this.defaultBranch = data.default_branch;
    return this.defaultBranch;
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

  async getFileContentsWithSimpleAPI(
    path: string,
    refName: string | undefined
  ): Promise<GitHubFileContents> {
    const options: any = {
      owner: this.owner,
      repo: this.repo,
      path,
    };
    if (refName) options.ref = refName;
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
    refName: string | undefined
  ): Promise<GitHubFileContents> {
    const repoTree = await this.request(
      `GET /repos/:owner/:repo/git/trees/:branch${
        this.proxyKey ? `?key=${this.proxyKey}` : ''
      }`,
      {
        owner: this.owner,
        repo: this.repo,
        ref: refName,
      }
    );

    const blobDescriptor = repoTree.data.tree.find(
      (tree: any) => tree.path === path
    );

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

  async getFileContents(
    path: string,
    refName: string | undefined = undefined
  ): Promise<GitHubFileContents> {
    try {
      return await this.getFileContentsWithSimpleAPI(path, refName);
    } catch (err) {
      if (err.status === 403) {
        return await this.getFileContentsWithDataAPI(path, refName);
      }
      throw err;
    }
  }

  async createRelease(
    packageName: string,
    version: string,
    sha: string,
    releaseNotes: string
  ): Promise<ReleaseCreateResponse> {
    checkpoint(`creating release ${version}`, CheckpointType.Success);
    return (
      await this.request(
        `POST /repos/:owner/:repo/releases${
          this.proxyKey ? `?key=${this.proxyKey}` : ''
        }`,
        {
          owner: this.owner,
          repo: this.repo,
          tag_name: version,
          target_commitish: sha,
          body: releaseNotes,
          name: `${packageName} ${version}`,
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

  async findFilesByFilename(filename: string): Promise<string[]> {
    const response: {data: FileSearchResponse} = await this.octokit.search.code(
      {
        q: `filename:${filename}+repo:${this.owner}/${this.repo}`,
      }
    );
    return response.data.items.map(file => {
      return file.path;
    });
  }
}

class AuthError extends Error {
  status: number;

  constructor() {
    super('unauthorized');
    this.status = 401;
  }
}
