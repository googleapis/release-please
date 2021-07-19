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
import {logger} from './util/logger';

import {Octokit} from '@octokit/rest';
import {request} from '@octokit/request';
import {graphql} from '@octokit/graphql';
import {Endpoints, EndpointOptions, OctokitResponse} from '@octokit/types';
import {RequestError} from '@octokit/request-error';
// The return types for responses have not yet been exposed in the
// @octokit/* libraries, we explicitly define the types below to work
// around this,. See: https://github.com/octokit/rest.js/issues/1624
// https://github.com/octokit/types.ts/issues/25.
import {PromiseValue} from 'type-fest';
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
type CreateIssueCommentResponse = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['issues']['createComment']>
>['data'];
// see: PromiseValue<
//  ReturnType<InstanceType<typeof Octokit>['repos']['createRelease']>
// >['data'];
type CommitsListResponse =
  Endpoints['GET /repos/{owner}/{repo}/commits']['response'];
type CommitGetResponse =
  Endpoints['GET /repos/{owner}/{repo}/commits/{ref}']['response'];
export type ReleaseCreateResponse = {
  name: string;
  tag_name: string;
  draft: boolean;
  html_url: string;
  upload_url: string;
  body: string;
};
type ReposListTagsResponseItems = {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  zipball_url: string;
  tarball_url: string;
  node_id: string;
};
function isReposListResponse(arg: unknown): arg is ReposListTagsResponseItems {
  return typeof arg === 'object' && Object.hasOwnProperty.call(arg, 'name');
}

// Extract some types from the `request` package.
type RequestBuilderType = typeof request;
type DefaultFunctionType = RequestBuilderType['defaults'];
type RequestFunctionType = ReturnType<DefaultFunctionType>;
type RequestOptionsType = Parameters<DefaultFunctionType>[0];

type MergedPullRequestFilter = (filter: MergedGitHubPR) => boolean;
type CommitFilter = (
  commit: Commit,
  pullRequest: MergedGitHubPR | undefined
) => boolean;

import chalk = require('chalk');
import * as semver from 'semver';

import {
  Commit,
  CommitsResponse,
  graphqlToCommits,
  PREdge,
} from './graphql-to-commits';
import {Update} from './updaters/update';
import {BranchName} from './util/branch-name';
import {RELEASE_PLEASE, GH_API_URL} from './constants';
import {GitHubConstructorOptions} from '.';
import {DuplicateReleaseError, GitHubAPIError, AuthError} from './errors';

export interface OctokitAPIs {
  graphql: Function;
  request: RequestFunctionType;
  octokit: OctokitType;
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
  title: string;
  body: string;
  updates: Update[];
  labels: string[];
  changes?: Changes;
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

interface CommitWithPullRequest {
  commit: Commit;
  pullRequest?: MergedGitHubPR;
}

interface PullRequestHistory {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | undefined;
  };
  data: CommitWithPullRequest[];
}

interface GraphQLCommit {
  sha: string;
  message: string;
  associatedPullRequests: {
    nodes: {
      number: number;
      title: string;
      body: string;
      baseRefName: string;
      headRefName: string;
      labels: {
        nodes: {
          name: string;
        }[];
      };
      mergeCommit?: {
        oid: string;
      };
    }[];
  };
}

export interface MergedGitHubPRWithFiles extends MergedGitHubPR {
  files: string[];
}

// GraphQL reponse types
export interface Repository<T> {
  repository: T;
}

interface Nodes<T> {
  nodes: T[];
}

export interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

interface PullRequestNode {
  title: string;
  body: string;
  number: number;
  mergeCommit: {oid: string};
  files: {pageInfo: PageInfo} & Nodes<{path: string}>;
  labels: Nodes<{name: string}>;
}

export interface PullRequests {
  pullRequests: Nodes<PullRequestNode>;
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
  fork: boolean;
  repositoryDefaultBranch?: string;

  constructor(options: GitHubConstructorOptions) {
    this.defaultBranch = options.defaultBranch;
    this.token = options.token;
    this.owner = options.owner;
    this.repo = options.repo;
    this.fork = !!options.fork;
    this.apiUrl = options.apiUrl || GH_API_URL;

    if (options.octokitAPIs === undefined) {
      this.octokit = new Octokit({
        baseUrl: options.apiUrl,
        auth: this.token,
      });
      const defaults: RequestOptionsType = {
        baseUrl: this.apiUrl,
        headers: {
          'user-agent': `${RELEASE_PLEASE}/${
            require('../../package.json').version
          }`,
          Authorization: `token ${this.token}`,
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

  private async makeGraphqlRequest(_opts: {
    [key: string]: string | number | null | undefined;
  }) {
    let opts = Object.assign({}, _opts);
    if (!probotMode) {
      opts = Object.assign(opts, {
        url: `${this.apiUrl}/graphql`,
        headers: {
          authorization: `token ${this.token}`,
          'content-type': 'application/vnd.github.v3+json',
        },
      });
    }
    return this.graphql(opts);
  }

  private graphqlRequest = wrapAsync(
    async (
      opts: {
        [key: string]: string | number | null | undefined;
      },
      maxRetries = 1
    ) => {
      while (maxRetries >= 0) {
        try {
          return await this.makeGraphqlRequest(opts);
        } catch (err) {
          if (err.status !== 502) {
            throw err;
          }
        }
        maxRetries -= 1;
      }
    }
  );

  private decoratePaginateOpts(opts: EndpointOptions): EndpointOptions {
    if (probotMode) {
      return opts;
    } else {
      return Object.assign(opts, {
        headers: {
          Authorization: `token ${this.token}`,
        },
      });
    }
  }

  /**
   * Returns the list of commits since a given SHA on the target branch
   *
   * @param {string} sha SHA of the base commit or undefined for all commits
   * @param {string} path If provided, limit to commits that affect the provided path
   * @param {number} per_page Pagination option. Defaults to 100
   * @returns {Commit[]} List of commits
   * @throws {GitHubAPIError} on an API error
   */
  commitsSinceShaRest = wrapAsync(
    async (sha?: string, path?: string, per_page = 100): Promise<Commit[]> => {
      let page = 1;
      let found = false;
      const baseBranch = await this.getDefaultBranch();
      const commits: [string | null, string][] = [];
      while (!found) {
        const response = await this.request(
          'GET /repos/{owner}/{repo}/commits{?sha,page,per_page,path}',
          {
            owner: this.owner,
            repo: this.repo,
            sha: baseBranch,
            page,
            per_page,
            path,
          }
        );
        for (const commit of (response as CommitsListResponse).data) {
          if (commit.sha === sha) {
            found = true;
            break;
          }
          // skip merge commits
          if (commit.parents.length === 2) {
            continue;
          }
          commits.push([commit.sha, commit.commit.message]);
        }
        page++;
      }
      const ret = [];
      for (const [ref, message] of commits) {
        const files = [];
        let page = 1;
        let moreFiles = true;
        while (moreFiles) {
          // the "Get Commit" resource is a bit of an outlier in terms of GitHub's
          // normal pagination: https://git.io/JmVZq
          // The behavior is to return an object representing the commit, a
          // property of which is an array of files. GitHub will return as many
          // associated files as there are, up to a limit of 300, on the initial
          // request. If there are more associated files, it will send "Links"
          // headers to get the next set. There is a total limit of 3000
          // files returned per commit.
          // In practice, the links headers are just the same resourceID plus a
          // "page=N" query parameter with "page=1" being the initial set.
          //
          // TODO: it is more robust to follow the link.next headers (in case
          // GitHub ever changes the pattern) OR use ocktokit pagination for this
          // endpoint when https://git.io/JmVll is addressed.
          const response = (await this.request(
            'GET /repos/{owner}/{repo}/commits/{ref}{?page}',
            {owner: this.owner, repo: this.repo, ref, page}
          )) as CommitGetResponse;
          const commitFiles = response.data.files;
          if (!commitFiles) {
            moreFiles = false;
            break;
          }
          files.push(...commitFiles.map(f => f.filename ?? ''));
          // < 300 files means we hit the end
          // page === 10 means we're at 3000 and that's the limit GH is gonna
          // cough up anyway.
          if (commitFiles.length < 300 || page === 10) {
            moreFiles = false;
            break;
          }
          page++;
        }
        ret.push({sha: ref, message, files});
      }
      return ret;
    }
  );

  /**
   * Returns the list of commits since a given SHA on the target branch
   *
   * Note: Commit.files only for commits from PRs.
   *
   * @param {string|undefined} sha SHA of the base commit or undefined for all commits
   * @param {number} perPage Pagination option. Defaults to 100
   * @param {boolean} labels Whether or not to return labels. Defaults to false
   * @param {string|null} path If provided, limit to commits that affect the provided path
   * @returns {Commit[]} List of commits
   * @throws {GitHubAPIError} on an API error
   */
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
    maxFilesChanged = 64
  ): Promise<CommitsResponse> {
    const baseBranch = await this.getDefaultBranch();

    // The GitHub v3 API does not offer an elegant way to fetch commits
    // in conjucntion with the path that they modify. We lean on the graphql
    // API for this one task, fetching commits in descending chronological
    // order along with the file paths attached to them.
    const response = await this.graphqlRequest(
      {
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
      },
      3
    );
    return graphqlToCommits(this, response);
  }

  private async commitsWithLabels(
    cursor: string | undefined = undefined,
    perPage = 32,
    path: string | null = null,
    maxLabels = 16
  ): Promise<CommitsResponse> {
    const baseBranch = await this.getDefaultBranch();
    const response = await this.graphqlRequest(
      {
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
      },
      3
    );
    return graphqlToCommits(this, response);
  }

  /**
   * Return the pull request files
   *
   * @param {number} num Pull request number
   * @param {string} cursor Pagination cursor
   * @param {number} maxFilesChanged Number of files to return per page
   * @return {PREdge}
   * @throws {GitHubAPIError} on an API error
   */
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

  /**
   * Find the SHA of the commit at the provided tag.
   *
   * @param {string} name Tag name
   * @returns {string} The SHA of the commit
   * @throws {GitHubAPIError} on an API error
   */
  getTagSha = wrapAsync(async (name: string): Promise<string> => {
    const refResponse = (await this.request(
      'GET /repos/:owner/:repo/git/refs/tags/:name',
      {
        owner: this.owner,
        repo: this.repo,
        name,
      }
    )) as {data: GitRefResponse};
    return refResponse.data.object.sha;
  });

  /**
   * Find the "last" merged PR given a headBranch. "last" here means
   * the most recently created. Includes all associated files.
   *
   * @param {string} headBranch - e.g. "release-please/branches/main"
   * @returns {MergedGitHubPRWithFiles} - if found, otherwise undefined.
   * @throws {GitHubAPIError} on an API error
   */
  async lastMergedPRByHeadBranch(
    headBranch: string
  ): Promise<MergedGitHubPRWithFiles | undefined> {
    const baseBranch = await this.getDefaultBranch();
    const response: Repository<PullRequests> = await this.graphqlRequest({
      query: `query lastMergedPRByHeadBranch($owner: String!, $repo: String!, $baseBranch: String!, $headBranch: String!) {
          repository(owner: $owner, name: $repo) {
            pullRequests(baseRefName: $baseBranch, states: MERGED, orderBy: {field: CREATED_AT, direction: DESC}, first: 1, headRefName: $headBranch) {
            nodes {
              title
              body
              number
              mergeCommit {
                oid
              }
              files(first: 100) {
                nodes {
                  path
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
              labels(first: 10) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }`,
      owner: this.owner,
      repo: this.repo,
      baseBranch,
      headBranch,
    });
    let result: MergedGitHubPRWithFiles | undefined = undefined;
    const pr = response.repository.pullRequests.nodes[0];
    if (pr) {
      const files = pr.files.nodes.map(({path}) => path);
      let hasMoreFiles = pr.files.pageInfo.hasNextPage;
      let cursor = pr.files.pageInfo.endCursor;
      while (hasMoreFiles) {
        const next = await this.pullRequestFiles(pr.number, cursor);
        const nextFiles = next.node.files.edges.map(fe => fe.node.path);
        files.push(...nextFiles);
        cursor = next.node.files.pageInfo.endCursor;
        hasMoreFiles = next.node.files.pageInfo.hasNextPage;
      }
      result = {
        sha: pr.mergeCommit.oid,
        title: pr.title,
        body: pr.body,
        number: pr.number,
        baseRefName: baseBranch,
        headRefName: headBranch,
        files,
        labels: pr.labels.nodes.map(({name}) => name),
      };
    }
    return result;
  }

  /**
   * If we can't find a release branch (a common cause of this, as an example
   * is that we might be dealing with the first relese), use the last semver
   * tag that's available on the repository:
   *
   * TODO: it would be good to not need to maintain this logic, and the
   * logic that introspects version based on the prior release PR.
   *
   * @param {string} prefix If provided, filter the tags with this prefix
   * @param {boolean} preRelease Whether or not to include pre-releases
   * @return {GitHubTag|undefined}
   * @throws {GitHubAPIError} on an API error   *
   */
  async latestTagFallback(
    prefix?: string,
    preRelease = false
  ): Promise<GitHubTag | undefined> {
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

  private allTags = wrapAsync(
    async (
      prefix?: string
    ): Promise<{
      [version: string]: GitHubTag;
    }> => {
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
          url: `/repos/${this.owner}/${this.repo}/tags?per_page=100`,
        })
      )) {
        response.data.forEach(data => {
          // For monorepos, a prefix can be provided, indicating that only tags
          // matching the prefix should be returned:
          if (!isReposListResponse(data)) return;
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
          if (semver.valid(version)) {
            version = semver.valid(version) as string;
            tags[version] = {sha: data.commit.sha, name: data.name, version};
          }
        });
      }
      return tags;
    }
  );

  private async mergeCommitsGraphQL(
    cursor?: string
  ): Promise<PullRequestHistory | null> {
    const targetBranch = await this.getDefaultBranch();
    const response = await this.graphqlRequest({
      query: `query pullRequestsSince($owner: String!, $repo: String!, $num: Int!, $targetBranch: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          ref(qualifiedName: $targetBranch) {
            target {
              ... on Commit {
                history(first: $num, after: $cursor) {
                  nodes {
                    associatedPullRequests(first: 10) {
                      nodes {
                        number
                        title
                        baseRefName
                        headRefName
                        labels(first: 10) {
                          nodes {
                            name
                          }
                        }
                        body
                        mergeCommit {
                          oid
                        }
                      }
                    }
                    sha: oid
                    message
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            }
          }
        }
      }`,
      cursor,
      owner: this.owner,
      repo: this.repo,
      num: 25,
      targetBranch,
    });

    // if the branch does exist, return null
    if (!response.repository.ref) {
      logger.warn(
        `Could not find commits for branch ${targetBranch} - it likely does not exist.`
      );
      return null;
    }
    const history = response.repository.ref.target.history;
    const commits = (history.nodes || []) as GraphQLCommit[];
    return {
      pageInfo: history.pageInfo,
      data: commits.map(graphCommit => {
        const commit = {
          sha: graphCommit.sha,
          message: graphCommit.message,
          files: [] as string[],
        };
        const pullRequest = graphCommit.associatedPullRequests.nodes.find(
          pr => {
            return pr.mergeCommit && pr.mergeCommit.oid === graphCommit.sha;
          }
        );
        if (pullRequest) {
          return {
            commit,
            pullRequest: {
              sha: commit.sha,
              number: pullRequest.number,
              baseRefName: pullRequest.baseRefName,
              headRefName: pullRequest.headRefName,
              title: pullRequest.title,
              body: pullRequest.body,
              labels: pullRequest.labels.nodes.map(node => node.name),
            },
          };
        }
        return {
          commit,
        };
      }),
    };
  }

  /**
   * Search through commit history to find the latest commit that matches to
   * provided filter.
   *
   * @param {CommitFilter} filter - Callback function that returns whether a
   *   commit/pull request matches certain criteria
   * @param {number} maxResults - Limit the number of results searched.
   *   Defaults to unlimited.
   * @returns {CommitWithPullRequest}
   * @throws {GitHubAPIError} on an API error
   */
  async findMergeCommit(
    filter: CommitFilter,
    maxResults: number = Number.MAX_SAFE_INTEGER
  ): Promise<CommitWithPullRequest | undefined> {
    const generator = this.mergeCommitIterator(maxResults);
    for await (const commitWithPullRequest of generator) {
      if (
        filter(commitWithPullRequest.commit, commitWithPullRequest.pullRequest)
      ) {
        return commitWithPullRequest;
      }
    }
    return undefined;
  }

  /**
   * Iterate through commit history with a max number of results scanned.
   *
   * @param maxResults {number} maxResults - Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {CommitWithPullRequest}
   * @throws {GitHubAPIError} on an API error
   */
  async *mergeCommitIterator(maxResults: number = Number.MAX_SAFE_INTEGER) {
    let cursor: string | undefined = undefined;
    let results = 0;
    while (results < maxResults) {
      const response: PullRequestHistory | null =
        await this.mergeCommitsGraphQL(cursor);
      // no response usually means that the branch can't be found
      if (!response) {
        break;
      }
      for (let i = 0; i < response.data.length; i++) {
        results += 1;
        yield response.data[i];
      }
      if (!response.pageInfo.hasNextPage) {
        break;
      }
      cursor = response.pageInfo.endCursor;
    }
  }

  async *mergedPullRequestIterator(
    branch: string,
    maxResults: number = Number.MAX_SAFE_INTEGER
  ) {
    let page = 1;
    const results = 0;
    while (results < maxResults) {
      const pullRequests = await this.findMergedPullRequests(branch, page);
      // no response usually means we ran out of results
      if (pullRequests.length === 0) {
        break;
      }
      for (let i = 0; i < pullRequests.length; i++) {
        yield pullRequests[i];
      }
      page += 1;
    }
  }

  /**
   * Returns the list of commits to the default branch after the provided filter
   * query has been satified.
   *
   * @param {CommitFilter} filter - Callback function that returns whether a
   *   commit/pull request matches certain criteria
   * @param {number} maxResults - Limit the number of results searched.
   *   Defaults to unlimited.
   * @returns {Commit[]} - List of commits to current branch
   * @throws {GitHubAPIError} on an API error
   */
  async commitsSince(
    filter: CommitFilter,
    maxResults: number = Number.MAX_SAFE_INTEGER
  ): Promise<Commit[]> {
    const commits: Commit[] = [];
    const generator = this.mergeCommitIterator(maxResults);
    for await (const commitWithPullRequest of generator) {
      if (
        filter(commitWithPullRequest.commit, commitWithPullRequest.pullRequest)
      ) {
        break;
      }
      commits.push(commitWithPullRequest.commit);
    }
    return commits;
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
   * @throws {GitHubAPIError} on an API error
   */
  findMergedPullRequests = wrapAsync(
    async (
      targetBranch?: string,
      page = 1,
      perPage = 100
    ): Promise<MergedGitHubPR[]> => {
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
  );

  /**
   * Helper to find the first merged pull request that matches the
   * given criteria. The helper will paginate over all pull requests
   * merged into the specified target branch.
   *
   * @param {string} targetBranch - Base branch of the pull request
   * @param {MergedPullRequestFilter} filter - Callback function that
   *   returns whether a pull request matches certain criteria
   * @param {number} maxResults - Limit the number of results searched.
   *   Defaults to unlimited.
   * @returns {MergedGitHubPR | undefined} - Returns the first matching
   *   pull request, or `undefined` if no matching pull request found.
   * @throws {GitHubAPIError} on an API error
   */
  async findMergedPullRequest(
    targetBranch: string,
    filter: MergedPullRequestFilter,
    maxResults: number = Number.MAX_SAFE_INTEGER
  ): Promise<MergedGitHubPR | undefined> {
    const generator = this.mergedPullRequestIterator(targetBranch, maxResults);
    for await (const mergedPullRequest of generator) {
      if (filter(mergedPullRequest)) {
        return mergedPullRequest;
      }
    }
    return undefined;
  }

  /**
   * Find the last merged pull request that targeted the default
   * branch and looks like a release PR.
   *
   * Note: The default matcher will rule out pre-releases.
   *
   * @param {string[]} labels - If provided, ensure that the pull
   *   request has all of the specified labels
   * @param {string|undefined} branchPrefix - If provided, limit
   *   release pull requests that contain the specified component
   * @param {boolean} preRelease - Whether to include pre-release
   *   versions in the response. Defaults to true.
   * @param {number} maxResults - Limit the number of results searched.
   *   Defaults to unlimited.
   * @returns {MergedGitHubPR|undefined}
   * @throws {GitHubAPIError} on an API error
   */
  async findMergedReleasePR(
    labels: string[],
    branchPrefix: string | undefined = undefined,
    preRelease = true,
    maxResults: number = Number.MAX_SAFE_INTEGER
  ): Promise<MergedGitHubPR | undefined> {
    branchPrefix = branchPrefix?.endsWith('-')
      ? branchPrefix.replace(/-$/, '')
      : branchPrefix;

    const targetBranch = await this.getDefaultBranch();
    const mergedReleasePullRequest = await this.findMergedPullRequest(
      targetBranch,
      mergedPullRequest => {
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
      },
      maxResults
    );

    return mergedReleasePullRequest;
  }

  private hasAllLabels(labelsA: string[], labelsB: string[]) {
    let hasAll = true;
    labelsA.forEach(label => {
      if (labelsB.indexOf(label) === -1) hasAll = false;
    });
    return hasAll;
  }

  /**
   * Find open pull requests with matching labels.
   *
   * @param {string[]} labels List of labels to match
   * @param {number} perPage Optional. Defaults to 100
   * @return {PullsListResponseItems} Pull requests
   * @throws {GitHubAPIError} on an API error
   */
  async findOpenReleasePRs(
    labels: string[],
    perPage = 100
  ): Promise<PullsListResponseItems> {
    const baseLabel = await this.getBaseLabel();

    const openReleasePRs: PullsListResponseItems = [];
    const pullsResponse = (await this.request(
      `GET /repos/:owner/:repo/pulls?state=open&per_page=${perPage}`,
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

  /**
   * Add labels to an issue or pull request
   *
   * @param {string[]} labels List of labels to add
   * @param {number} pr Issue or pull request number
   * @return {boolean} Whether or not the labels were added
   * @throws {GitHubAPIError} on an API error
   */
  async addLabels(labels: string[], pr: number): Promise<boolean> {
    // If the PR is being created from a fork, it will not have permission
    // to add and remove labels from the PR:
    if (this.fork) {
      logger.warn(
        'release labels were not added, due to PR being created from fork'
      );
      return false;
    }

    logger.info(
      `adding label ${chalk.green(labels.join(','))} to https://github.com/${
        this.owner
      }/${this.repo}/pull/${pr}`
    );
    await this.request('POST /repos/:owner/:repo/issues/:issue_number/labels', {
      owner: this.owner,
      repo: this.repo,
      issue_number: pr,
      labels,
    });
    return true;
  }

  /**
   * Find an existing release pull request with a matching title and labels
   *
   * @param {string} title Substring to match against the issue title
   * @param {string[]} labels List of labels to match the issues
   * @return {IssuesListResponseItem|undefined}
   * @throws {AuthError} if the user is not authenticated to make this request
   * @throws {GitHubAPIError} on other API errors
   */
  findExistingReleaseIssue = wrapAsync(
    async (
      title: string,
      labels: string[]
    ): Promise<IssuesListResponseItem | undefined> => {
      for await (const response of this.octokit.paginate.iterator(
        this.decoratePaginateOpts({
          method: 'GET',
          url: `/repos/${this.owner}/${this.repo}/issues?labels=${labels.join(
            ','
          )}`,
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
      return undefined;
    },
    e => {
      if (e instanceof RequestError && e.status === 404) {
        // the most likely cause of a 404 during this step is actually
        // that the user does not have access to the repo:
        throw new AuthError(e);
      }
    }
  );

  /**
   * Open a pull request
   *
   * @param {GitHubPR} options The pull request options
   * @throws {GitHubAPIError} on an API error
   */
  openPR = wrapAsync(async (options: GitHubPR): Promise<number | undefined> => {
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
      logger.info(
        `PR https://github.com/${this.owner}/${this.repo}/pull/${openReleasePR.number} remained the same`
      );
      return undefined;
    }

    //  Update the files for the release if not already supplied
    const changes =
      options.changes ??
      (await this.getChangeSet(options.updates, defaultBranch));
    const prNumber = await createPullRequest(this.octokit, changes, {
      upstreamOwner: this.owner,
      upstreamRepo: this.repo,
      title: options.title,
      branch: options.branch,
      description: options.body,
      primary: defaultBranch,
      force: true,
      fork: this.fork,
      message: options.title,
      logger: logger,
    });

    // If a release PR was already open, update the title and body:
    if (openReleasePR) {
      logger.info(
        `update pull-request #${openReleasePR.number}: ${chalk.yellow(
          options.title
        )}`
      );
      await this.request('PATCH /repos/:owner/:repo/pulls/:pull_number', {
        pull_number: openReleasePR.number,
        owner: this.owner,
        repo: this.repo,
        title: options.title,
        body: options.body,
        state: 'open',
      });
      return openReleasePR.number;
    } else {
      return prNumber;
    }
  });

  /**
   * Given a set of proposed updates, build a changeset to suggest.
   *
   * @param {Update[]} updates The proposed updates
   * @param {string} defaultBranch The target branch
   * @return {Changes} The changeset to suggest.
   * @throws {GitHubAPIError} on an API error
   */
  async getChangeSet(
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
          logger.warn(`file ${chalk.green(update.path)} did not exist`);
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

  /**
   * Returns the branch we are targetting for releases. Defaults
   * to the repository's default/primary branch.
   *
   * @returns {string}
   * @throws {GitHubAPIError} on an API error
   */
  async getDefaultBranch(): Promise<string> {
    if (!this.defaultBranch) {
      this.defaultBranch = await this.getRepositoryDefaultBranch();
    }
    return this.defaultBranch;
  }

  /**
   * Returns the repository's default/primary branch.
   *
   * @returns {string}
   * @throws {GitHubAPIError} on an API error
   */
  getRepositoryDefaultBranch = wrapAsync(async (): Promise<string> => {
    if (this.repositoryDefaultBranch) {
      return this.repositoryDefaultBranch;
    }

    const {data} = await this.octokit.repos.get({
      repo: this.repo,
      owner: this.owner,
      headers: {
        Authorization: `token ${this.token}`,
      },
    });
    this.repositoryDefaultBranch = (
      data as {
        default_branch: string;
      }
    ).default_branch;
    return this.repositoryDefaultBranch as string;
  });

  /**
   * Close a pull request
   *
   * @param {number} prNumber The pull request number
   * @returns {boolean} Whether the request was attempts
   * @throws {GitHubAPIError} on an API error
   */
  closePR = wrapAsync(async (prNumber: number): Promise<boolean> => {
    if (this.fork) return false;

    await this.request('PATCH /repos/:owner/:repo/pulls/:pull_number', {
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      state: 'closed',
    });
    return true;
  });

  // Takes a potentially unqualified branch name, and turns it
  // into a fully qualified ref.
  //
  // e.g. main -> refs/heads/main
  static fullyQualifyBranchRef(refName: string): string {
    let final = refName;
    if (final.indexOf('/') < 0) {
      final = `refs/heads/${final}`;
    }

    return final;
  }

  /**
   * Fetch the contents of a file with the Contents API
   *
   * @param {string} path The path to the file in the repository
   * @param {string} branch The branch to fetch from
   * @returns {GitHubFileContents}
   * @throws {GitHubAPIError} on other API errors
   */
  getFileContentsWithSimpleAPI = wrapAsync(
    async (
      path: string,
      ref: string,
      isBranch = true
    ): Promise<GitHubFileContents> => {
      ref = isBranch ? GitHub.fullyQualifyBranchRef(ref) : ref;
      const options: RequestOptionsType = {
        owner: this.owner,
        repo: this.repo,
        path,
        ref,
      };
      const resp = await this.request(
        'GET /repos/:owner/:repo/contents/:path',
        options
      );
      return {
        parsedContent: Buffer.from(resp.data.content, 'base64').toString(
          'utf8'
        ),
        content: resp.data.content,
        sha: resp.data.sha,
      };
    }
  );

  /**
   * Fetch the contents of a file using the Git data API
   *
   * @param {string} path The path to the file in the repository
   * @param {string} branch The branch to fetch from
   * @returns {GitHubFileContents}
   * @throws {GitHubAPIError} on other API errors
   */
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
      'GET /repos/:owner/:repo/git/trees/:branch',
      options
    );

    const blobDescriptor = repoTree.data.tree.find(tree => tree.path === path);
    if (!blobDescriptor) {
      throw new Error(`Could not find requested path: ${path}`);
    }

    const resp = await this.request('GET /repos/:owner/:repo/git/blobs/:sha', {
      owner: this.owner,
      repo: this.repo,
      sha: blobDescriptor.sha,
    });

    return {
      parsedContent: Buffer.from(resp.data.content, 'base64').toString('utf8'),
      content: resp.data.content,
      sha: resp.data.sha,
    };
  }

  /**
   * Fetch the contents of a file from the configured branch
   *
   * @param {string} path The path to the file in the repository
   * @returns {GitHubFileContents}
   * @throws {GitHubAPIError} on other API errors
   */
  async getFileContents(path: string): Promise<GitHubFileContents> {
    return await this.getFileContentsOnBranch(
      path,
      await this.getDefaultBranch()
    );
  }

  /**
   * Fetch the contents of a file
   *
   * @param {string} path The path to the file in the repository
   * @param {string} branch The branch to fetch from
   * @returns {GitHubFileContents}
   * @throws {GitHubAPIError} on other API errors
   */
  getFileContentsOnBranch = wrapAsync(
    async (path: string, branch: string): Promise<GitHubFileContents> => {
      try {
        return await this.getFileContentsWithSimpleAPI(path, branch);
      } catch (err) {
        if (err.status === 403) {
          return await this.getFileContentsWithDataAPI(path, branch);
        }
        throw err;
      }
    }
  );

  /**
   * Create a GitHub release
   *
   * @param {string} packageName name of the package
   * @param {string} tagName tag to create
   * @param {string} sha SHA of commit to tag at
   * @param {string} releaseNotes Notes to add to release
   * @param {boolean} draft Whether or not to create the release as a draft
   * @throws {DuplicateReleaseError} if the release tag already exists
   * @throws {GitHubAPIError} on other API errors
   */
  createRelease = wrapAsync(
    async (
      packageName: string,
      tagName: string,
      sha: string,
      releaseNotes: string,
      draft: boolean
    ): Promise<ReleaseCreateResponse> => {
      logger.info(`creating release ${tagName}`);
      const name = packageName ? `${packageName} ${tagName}` : tagName;
      return (
        await this.request('POST /repos/:owner/:repo/releases', {
          owner: this.owner,
          repo: this.repo,
          tag_name: tagName,
          target_commitish: sha,
          body: releaseNotes,
          name,
          draft: draft,
        })
      ).data;
    },
    e => {
      if (e instanceof RequestError) {
        if (
          e.status === 422 &&
          GitHubAPIError.parseErrors(e).some(error => {
            return error.code === 'already_exists';
          })
        ) {
          throw new DuplicateReleaseError(e, 'tagName');
        }
      }
    }
  );

  /**
   * Remove labels from an issue or pull request
   *
   * @param {string[]} labels The names of the labels to remove
   * @param {number} prNumber The issue or pull request number
   * @return {boolean} Whether or not the request was attempted
   * @throws {GitHubAPIError} on an API error
   */
  removeLabels = wrapAsync(
    async (labels: string[], prNumber: number): Promise<boolean> => {
      if (this.fork) return false;

      for (let i = 0, label; i < labels.length; i++) {
        label = labels[i];
        logger.info(
          `removing label ${chalk.green(label)} from ${chalk.green(
            '' + prNumber
          )}`
        );
        await this.request(
          'DELETE /repos/:owner/:repo/issues/:issue_number/labels/:name',
          {
            owner: this.owner,
            repo: this.repo,
            issue_number: prNumber,
            name: label,
          }
        );
      }
      return true;
    }
  );

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
   * @throws {GitHubAPIError} on an API error
   */
  findFilesByFilenameAndRef = wrapAsync(
    async (
      filename: string,
      ref: string,
      prefix?: string
    ): Promise<string[]> => {
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
  );

  /**
   * Returns a list of paths to all files with a given name.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param filename The name of the file to find
   * @param prefix Optional path prefix used to filter results
   * @returns {string[]} List of file paths
   * @throws {GitHubAPIError} on an API error
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
   * @returns {string[]} List of file paths
   * @throws {GitHubAPIError} on an API error
   */
  findFilesByExtensionAndRef = wrapAsync(
    async (
      extension: string,
      ref: string,
      prefix?: string
    ): Promise<string[]> => {
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
  );

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
   * @returns {string[]} List of file paths
   * @throws {GitHubAPIError} on an API error
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

  /**
   * Makes a comment on a issue/pull request.
   *
   * @param {string} comment - The body of the comment to post.
   * @param {number} number - The issue or pull request number.
   * @throws {GitHubAPIError} on an API error
   */
  commentOnIssue = wrapAsync(
    async (
      comment: string,
      number: number
    ): Promise<CreateIssueCommentResponse> => {
      logger.info(
        `adding comment to https://github.com/${this.owner}/${this.repo}/issue/${number}`
      );
      return (
        await this.request(
          'POST /repos/:owner/:repo/issues/:issue_number/comments',
          {
            owner: this.owner,
            repo: this.repo,
            issue_number: number,
            body: comment,
          }
        )
      ).data;
    }
  );
}

/**
 * Wrap an async method with error handling
 *
 * @param fn Async function that can throw Errors
 * @param errorHandler An optional error handler for rethrowing custom exceptions
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const wrapAsync = <T extends Array<any>, V>(
  fn: (...args: T) => Promise<V>,
  errorHandler?: (e: Error) => void
) => {
  return async (...args: T): Promise<V> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (errorHandler) {
        errorHandler(e);
      }
      if (e instanceof RequestError) {
        throw new GitHubAPIError(e);
      }
      throw e;
    }
  };
};
