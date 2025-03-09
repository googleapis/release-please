// Copyright 2021 Google LLC
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

import {createPullRequest} from 'code-suggester';
import {PullRequest} from './pull-request';
import {Commit} from './commit';

import {Octokit} from '@octokit/rest';
import {request} from '@octokit/request';
import {graphql} from '@octokit/graphql';
import {RequestError} from '@octokit/request-error';
import {
  GitHubAPIError,
  DuplicateReleaseError,
  FileNotFoundError,
  ConfigurationError,
} from './errors';

const MAX_ISSUE_BODY_SIZE = 65536;
const MAX_SLEEP_SECONDS = 20;
export const GH_API_URL = 'https://api.github.com';
export const GH_GRAPHQL_URL = 'https://api.github.com';
type OctokitType = InstanceType<typeof Octokit>;

import {logger as defaultLogger} from './util/logger';
import {Repository} from './repository';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Release} from './release';
import {ROOT_PROJECT_PATH} from './manifest';
import {signoffCommitMessage} from './util/signoff-commit-message';
import {
  RepositoryFileCache,
  GitHubFileContents,
  DEFAULT_FILE_MODE,
  FileNotFoundError as MissingFileError,
} from '@google-automations/git-file-utils';
import {Logger} from 'code-suggester/build/src/types';
import {HttpsProxyAgent} from 'https-proxy-agent';
import {HttpProxyAgent} from 'http-proxy-agent';
import {PullRequestOverflowHandler} from './util/pull-request-overflow-handler';

// Extract some types from the `request` package.
type RequestBuilderType = typeof request;
type DefaultFunctionType = RequestBuilderType['defaults'];
type RequestFunctionType = ReturnType<DefaultFunctionType>;
export interface OctokitAPIs {
  graphql: Function;
  request: RequestFunctionType;
  octokit: OctokitType;
}

export interface GitHubOptions {
  repository: Repository;
  octokitAPIs: OctokitAPIs;
  logger?: Logger;
}

interface ProxyOption {
  host: string;
  port: number;
}

interface GitHubCreateOptions {
  owner: string;
  repo: string;
  defaultBranch?: string;
  apiUrl?: string;
  graphqlUrl?: string;
  octokitAPIs?: OctokitAPIs;
  token?: string;
  logger?: Logger;
  proxy?: ProxyOption;
}

type CommitFilter = (commit: Commit) => boolean;

interface GraphQLCommit {
  sha: string;
  message: string;
  associatedPullRequests: {
    nodes: GraphQLPullRequest[];
  };
}

interface GraphQLPullRequest {
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
  files: {
    nodes: {
      path: string;
    }[];
    pageInfo: {
      hasNextPage: boolean;
    };
  };
}

interface GraphQLRelease {
  name: string;
  tag: {
    name: string;
  };
  tagCommit: {
    oid: string;
  };
  url: string;
  description: string;
  isDraft: boolean;
}

interface CommitHistory {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | undefined;
  };
  data: Commit[];
}

interface PullRequestHistory {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | undefined;
  };
  data: PullRequest[];
}

interface ReleaseHistory {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | undefined;
  };
  data: GitHubRelease[];
}

interface CommitIteratorOptions {
  maxResults?: number;
  backfillFiles?: boolean;
}

interface ReleaseIteratorOptions {
  maxResults?: number;
}

interface TagIteratorOptions {
  maxResults?: number;
}

export interface ReleaseOptions {
  draft?: boolean;
  prerelease?: boolean;
}

export interface GitHubRelease {
  id: number;
  name?: string;
  tagName: string;
  sha: string;
  notes?: string;
  url: string;
  draft?: boolean;
  uploadUrl?: string;
}

export interface GitHubTag {
  name: string;
  sha: string;
}

interface FileDiff {
  readonly mode: '100644' | '100755' | '040000' | '160000' | '120000';
  readonly content: string | null;
  readonly originalContent: string | null;
}
export type ChangeSet = Map<string, FileDiff>;

interface CreatePullRequestOptions {
  fork?: boolean;
  draft?: boolean;
}

export class GitHub {
  readonly repository: Repository;
  private octokit: OctokitType;
  private request: RequestFunctionType;
  private graphql: Function;
  private fileCache: RepositoryFileCache;
  private logger: Logger;

  private constructor(options: GitHubOptions) {
    this.repository = options.repository;
    this.octokit = options.octokitAPIs.octokit;
    this.request = options.octokitAPIs.request;
    this.graphql = options.octokitAPIs.graphql;
    this.fileCache = new RepositoryFileCache(this.octokit, this.repository);
    this.logger = options.logger ?? defaultLogger;
  }

  static createDefaultAgent(baseUrl: string, defaultProxy?: ProxyOption) {
    if (!defaultProxy) {
      return undefined;
    }

    const {host, port} = defaultProxy;
    if (new URL(baseUrl).protocol.replace(':', '') === 'http') {
      return new HttpProxyAgent(`http://${host}:${port}`);
    } else {
      return new HttpsProxyAgent(`https://${host}:${port}`);
    }
  }

  /**
   * Build a new GitHub client with auto-detected default branch.
   *
   * @param {GitHubCreateOptions} options Configuration options
   * @param {string} options.owner The repository owner.
   * @param {string} options.repo The repository name.
   * @param {string} options.defaultBranch Optional. The repository's default branch.
   *   Defaults to the value fetched via the API.
   * @param {string} options.apiUrl Optional. The base url of the GitHub API.
   * @param {string} options.graphqlUrl Optional. The base url of the GraphQL API.
   * @param {OctokitAPISs} options.octokitAPIs Optional. Override the internal
   *   client instances with a pre-authenticated instance.
   * @param {string} token Optional. A GitHub API token used for authentication.
   */
  static async create(options: GitHubCreateOptions): Promise<GitHub> {
    const apiUrl = options.apiUrl ?? GH_API_URL;
    const graphqlUrl = options.graphqlUrl ?? GH_GRAPHQL_URL;
    const releasePleaseVersion = require('../../package.json').version;
    const apis = options.octokitAPIs ?? {
      octokit: new Octokit({
        baseUrl: apiUrl,
        auth: options.token,
        request: {
          agent: this.createDefaultAgent(apiUrl, options.proxy),
        },
      }),
      request: request.defaults({
        baseUrl: apiUrl,
        headers: {
          'user-agent': `release-please/${releasePleaseVersion}`,
          Authorization: `token ${options.token}`,
        },
      }),
      graphql: graphql.defaults({
        baseUrl: graphqlUrl,
        request: {
          agent: this.createDefaultAgent(graphqlUrl, options.proxy),
        },
        headers: {
          'user-agent': `release-please/${releasePleaseVersion}`,
          Authorization: `token ${options.token}`,
          'content-type': 'application/vnd.github.v3+json',
        },
      }),
    };
    const opts = {
      repository: {
        owner: options.owner,
        repo: options.repo,
        defaultBranch:
          options.defaultBranch ??
          (await GitHub.defaultBranch(
            options.owner,
            options.repo,
            apis.octokit
          )),
      },
      octokitAPIs: apis,
      logger: options.logger,
    };
    return new GitHub(opts);
  }

  /**
   * Returns the default branch for a given repository.
   *
   * @param {string} owner The GitHub repository owner
   * @param {string} repo The GitHub repository name
   * @param {OctokitType} octokit An authenticated octokit instance
   * @returns {string} Name of the default branch
   */
  static async defaultBranch(
    owner: string,
    repo: string,
    octokit: OctokitType
  ): Promise<string> {
    const {data} = await octokit.repos.get({
      repo,
      owner,
    });
    return data.default_branch;
  }

  /**
   * Returns the list of commits to the default branch after the provided filter
   * query has been satified.
   *
   * @param {string} targetBranch Target branch of commit
   * @param {CommitFilter} filter Callback function that returns whether a
   *   commit/pull request matches certain criteria
   * @param {CommitIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @param {boolean} options.backfillFiles If set, use the REST API for
   *   fetching the list of touched files in this commit. Defaults to `false`.
   * @returns {Commit[]} List of commits to current branch
   * @throws {GitHubAPIError} on an API error
   */
  async commitsSince(
    targetBranch: string,
    filter: CommitFilter,
    options: CommitIteratorOptions = {}
  ): Promise<Commit[]> {
    const commits: Commit[] = [];
    const generator = this.mergeCommitIterator(targetBranch, options);
    for await (const commit of generator) {
      if (filter(commit)) {
        break;
      }
      commits.push(commit);
    }
    return commits;
  }

  /**
   * Iterate through commit history with a max number of results scanned.
   *
   * @param {string} targetBranch target branch of commit
   * @param {CommitIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @param {boolean} options.backfillFiles If set, use the REST API for
   *   fetching the list of touched files in this commit. Defaults to `false`.
   * @yields {Commit}
   * @throws {GitHubAPIError} on an API error
   */
  async *mergeCommitIterator(
    targetBranch: string,
    options: CommitIteratorOptions = {}
  ) {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    let cursor: string | undefined = undefined;
    let results = 0;
    while (results < maxResults) {
      const response: CommitHistory | null = await this.mergeCommitsGraphQL(
        targetBranch,
        cursor,
        options
      );
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

  private async mergeCommitsGraphQL(
    targetBranch: string,
    cursor?: string,
    options: CommitIteratorOptions = {}
  ): Promise<CommitHistory | null> {
    this.logger.debug(
      `Fetching merge commits on branch ${targetBranch} with cursor: ${cursor}`
    );
    const query = `query pullRequestsSince($owner: String!, $repo: String!, $num: Int!, $maxFilesChanged: Int, $targetBranch: String!, $cursor: String) {
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
                      files(first: $maxFilesChanged) {
                        nodes {
                          path
                        }
                        pageInfo {
                          endCursor
                          hasNextPage
                        }
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
    }`;
    const params = {
      cursor,
      owner: this.repository.owner,
      repo: this.repository.repo,
      num: 25,
      targetBranch,
      maxFilesChanged: 50, // max is 100
    };
    const response = await this.graphqlRequest({
      query,
      ...params,
    });

    if (!response) {
      this.logger.warn(
        `Did not receive a response for query: ${query}`,
        params
      );
      return null;
    }

    // if the branch does exist, return null
    if (!response.repository?.ref) {
      this.logger.warn(
        `Could not find commits for branch ${targetBranch} - it likely does not exist.`
      );
      return null;
    }
    const history = response.repository.ref.target.history;
    const commits = (history.nodes || []) as GraphQLCommit[];
    // Count the number of pull requests associated with each merge commit. This is
    // used in the next step to make sure we only find pull requests with a
    // merge commit that contain 1 merged commit.
    const mergeCommitCount: Record<string, number> = {};
    for (const commit of commits) {
      for (const pr of commit.associatedPullRequests.nodes) {
        if (pr.mergeCommit?.oid) {
          mergeCommitCount[pr.mergeCommit.oid] ??= 0;
          mergeCommitCount[pr.mergeCommit.oid]++;
        }
      }
    }
    const commitData: Commit[] = [];
    for (const graphCommit of commits) {
      const commit: Commit = {
        sha: graphCommit.sha,
        message: graphCommit.message,
      };
      const mergePullRequest = graphCommit.associatedPullRequests.nodes.find(
        pr => {
          return (
            // Only match the pull request with a merge commit if there is a
            // single merged commit in the PR. This means merge commits and squash
            // merges will be matched, but rebase merged PRs will only be matched
            // if they contain a single commit. This is so PRs that are rebased
            // and merged will have ßSfiles backfilled from each commit instead of
            // the whole PR.
            pr.mergeCommit &&
            pr.mergeCommit.oid === graphCommit.sha &&
            mergeCommitCount[pr.mergeCommit.oid] === 1
          );
        }
      );
      const pullRequest =
        mergePullRequest || graphCommit.associatedPullRequests.nodes[0];
      if (pullRequest) {
        commit.pullRequest = {
          sha: commit.sha,
          number: pullRequest.number,
          baseBranchName: pullRequest.baseRefName,
          headBranchName: pullRequest.headRefName,
          mergeCommitOid: pullRequest.mergeCommit?.oid,
          title: pullRequest.title,
          body: pullRequest.body,
          labels: pullRequest.labels.nodes.map(node => node.name),
          files: (pullRequest.files?.nodes || []).map(node => node.path),
        };
      }
      if (mergePullRequest) {
        if (
          mergePullRequest.files?.pageInfo?.hasNextPage &&
          options.backfillFiles
        ) {
          this.logger.info(
            `PR #${mergePullRequest.number} has many files, backfilling`
          );
          commit.files = await this.getCommitFiles(graphCommit.sha);
        } else {
          // We cannot directly fetch files on commits via graphql, only provide file
          // information for commits with associated pull requests
          commit.files = (mergePullRequest.files?.nodes || []).map(
            node => node.path
          );
        }
      } else if (options.backfillFiles) {
        // In this case, there is no squashed merge commit. This could be a simple
        // merge commit, a rebase merge commit, or a direct commit to the branch.
        // Fallback to fetching the list of commits from the REST API. In the future
        // we can perhaps lazy load these.
        commit.files = await this.getCommitFiles(graphCommit.sha);
      }
      commitData.push(commit);
    }
    return {
      pageInfo: history.pageInfo,
      data: commitData,
    };
  }

  /**
   * Get the list of file paths modified in a given commit.
   *
   * @param {string} sha The commit SHA
   * @returns {string[]} File paths
   * @throws {GitHubAPIError} on an API error
   */
  getCommitFiles = wrapAsync(async (sha: string): Promise<string[]> => {
    this.logger.debug(`Backfilling file list for commit: ${sha}`);
    const files: string[] = [];
    for await (const resp of this.octokit.paginate.iterator(
      'GET /repos/{owner}/{repo}/commits/{ref}',
      {
        owner: this.repository.owner,
        repo: this.repository.repo,
        ref: sha,
      }
    )) {
      // Paginate plugin doesn't have types for listing files on a commit
      const data = resp.data as any as {files: {filename: string}[]};
      for (const f of data.files || []) {
        if (f.filename) {
          files.push(f.filename);
        }
      }
    }
    if (files.length >= 3000) {
      this.logger.warn(
        `Found ${files.length} files. This may not include all the files.`
      );
    } else {
      this.logger.debug(`Found ${files.length} files`);
    }
    return files;
  });

  private graphqlRequest = wrapAsync(
    async (
      opts: {
        [key: string]: string | number | null | undefined;
      },
      options?: {
        maxRetries?: number;
      }
    ) => {
      let maxRetries = options?.maxRetries ?? 5;
      let seconds = 1;
      while (maxRetries >= 0) {
        try {
          const response = await this.graphql(opts);
          if (response) {
            return response;
          }
          this.logger.trace('no GraphQL response, retrying');
        } catch (err) {
          if ((err as GitHubAPIError).status !== 502) {
            throw err;
          }
          if (maxRetries === 0) {
            this.logger.warn('ran out of retries and response is required');
            throw err;
          }
          this.logger.info(
            `received 502 error, ${maxRetries} attempts remaining`
          );
        }
        maxRetries -= 1;
        if (maxRetries >= 0) {
          this.logger.trace(`sleeping ${seconds} seconds`);
          await sleepInMs(1000 * seconds);
          seconds = Math.min(seconds * 2, MAX_SLEEP_SECONDS);
        }
      }
      this.logger.trace('ran out of retries');
      return undefined;
    }
  );

  /**
   * Iterate through merged pull requests with a max number of results scanned.
   *
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} status The status of the pull request
   * @param {number} maxResults Limit the number of results searched. Defaults to
   *   unlimited.
   * @param {boolean} includeFiles Whether to fetch the list of files included in
   *   the pull request. Defaults to `true`.
   * @yields {PullRequest}
   * @throws {GitHubAPIError} on an API error
   */
  async *pullRequestIterator(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER,
    includeFiles = true
  ): AsyncGenerator<PullRequest, void, void> {
    const generator = includeFiles
      ? this.pullRequestIteratorWithFiles(targetBranch, status, maxResults)
      : this.pullRequestIteratorWithoutFiles(targetBranch, status, maxResults);
    for await (const pullRequest of generator) {
      yield pullRequest;
    }
  }

  /**
   * Helper implementation of pullRequestIterator that includes files via
   * the graphQL API.
   *
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} status The status of the pull request
   * @param {number} maxResults Limit the number of results searched
   */
  private async *pullRequestIteratorWithFiles(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER
  ): AsyncGenerator<PullRequest, void, void> {
    let cursor: string | undefined = undefined;
    let results = 0;
    while (results < maxResults) {
      const response: PullRequestHistory | null =
        await this.pullRequestsGraphQL(targetBranch, status, cursor);
      // no response usually means we ran out of results
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

  /**
   * Helper implementation of pullRequestIterator that excludes files
   * via the REST API.
   *
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} status The status of the pull request
   * @param {number} maxResults Limit the number of results searched
   */
  private async *pullRequestIteratorWithoutFiles(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER
  ): AsyncGenerator<PullRequest, void, void> {
    const statusMap: Record<string, 'open' | 'closed'> = {
      OPEN: 'open',
      CLOSED: 'closed',
      MERGED: 'closed',
    };
    let results = 0;
    for await (const {data: pulls} of this.octokit.paginate.iterator(
      'GET /repos/{owner}/{repo}/pulls',
      {
        state: statusMap[status],
        owner: this.repository.owner,
        repo: this.repository.repo,
        base: targetBranch,
        sort: 'updated',
        direction: 'desc',
      }
    )) {
      for (const pull of pulls) {
        // The REST API does not have an option for "merged"
        // pull requests - they are closed with a `merged_at` timestamp
        if (status !== 'MERGED' || pull.merged_at) {
          results += 1;
          yield {
            headBranchName: pull.head.ref,
            baseBranchName: pull.base.ref,
            number: pull.number,
            title: pull.title,
            body: pull.body || '',
            labels: pull.labels.map(label => label.name),
            files: [],
            sha: pull.merge_commit_sha || undefined,
          };
          if (results >= maxResults) {
            break;
          }
        }
      }

      if (results >= maxResults) {
        break;
      }
    }
  }

  /**
   * Return a list of merged pull requests. The list is not guaranteed to be sorted
   * by merged_at, but is generally most recent first.
   *
   * @param {string} targetBranch - Base branch of the pull request. Defaults to
   *   the configured default branch.
   * @param {number} page - Page of results. Defaults to 1.
   * @param {number} perPage - Number of results per page. Defaults to 100.
   * @returns {PullRequestHistory | null} - List of merged pull requests
   * @throws {GitHubAPIError} on an API error
   */
  private async pullRequestsGraphQL(
    targetBranch: string,
    states: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    cursor?: string
  ): Promise<PullRequestHistory | null> {
    this.logger.debug(
      `Fetching ${states} pull requests on branch ${targetBranch} with cursor ${cursor}`
    );
    const response = await this.graphqlRequest({
      query: `query mergedPullRequests($owner: String!, $repo: String!, $num: Int!, $maxFilesChanged: Int, $targetBranch: String!, $states: [PullRequestState!], $cursor: String) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: $num, after: $cursor, baseRefName: $targetBranch, states: $states, orderBy: {field: CREATED_AT, direction: DESC}) {
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
              files(first: $maxFilesChanged) {
                nodes {
                  path
                }
                pageInfo {
                  endCursor
                  hasNextPage
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }`,
      cursor,
      owner: this.repository.owner,
      repo: this.repository.repo,
      num: 25,
      targetBranch,
      states,
      maxFilesChanged: 64,
    });
    if (!response?.repository?.pullRequests) {
      this.logger.warn(
        `Could not find merged pull requests for branch ${targetBranch} - it likely does not exist.`
      );
      return null;
    }
    const pullRequests = (response.repository.pullRequests.nodes ||
      []) as GraphQLPullRequest[];
    return {
      pageInfo: response.repository.pullRequests.pageInfo,
      data: pullRequests.map(pullRequest => {
        return {
          sha: pullRequest.mergeCommit?.oid, // already filtered non-merged
          number: pullRequest.number,
          baseBranchName: pullRequest.baseRefName,
          headBranchName: pullRequest.headRefName,
          labels: (pullRequest.labels?.nodes || []).map(l => l.name),
          title: pullRequest.title,
          body: pullRequest.body + '',
          files: (pullRequest.files?.nodes || []).map(node => node.path),
        };
      }),
    };
  }

  /**
   * Iterate through releases with a max number of results scanned.
   *
   * @param {ReleaseIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {GitHubRelease}
   * @throws {GitHubAPIError} on an API error
   */
  async *releaseIterator(options: ReleaseIteratorOptions = {}) {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    let results = 0;
    let cursor: string | undefined = undefined;
    while (true) {
      const response: ReleaseHistory | null = await this.releaseGraphQL(cursor);
      if (!response) {
        break;
      }
      for (let i = 0; i < response.data.length; i++) {
        if ((results += 1) > maxResults) {
          break;
        }
        yield response.data[i];
      }
      if (results > maxResults || !response.pageInfo.hasNextPage) {
        break;
      }
      cursor = response.pageInfo.endCursor;
    }
  }

  private async releaseGraphQL(
    cursor?: string
  ): Promise<ReleaseHistory | null> {
    this.logger.debug(`Fetching releases with cursor ${cursor}`);
    const response = await this.graphqlRequest({
      query: `query releases($owner: String!, $repo: String!, $num: Int!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          releases(first: $num, after: $cursor, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              name
              tag {
                name
              }
              tagCommit {
                oid
              }
              url
              description
              isDraft
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }`,
      cursor,
      owner: this.repository.owner,
      repo: this.repository.repo,
      num: 25,
    });
    if (!response.repository.releases.nodes.length) {
      this.logger.warn('Could not find releases.');
      return null;
    }
    const releases = response.repository.releases.nodes as GraphQLRelease[];
    return {
      pageInfo: response.repository.releases.pageInfo,
      data: releases
        .filter(release => !!release.tagCommit)
        .map(release => {
          if (!release.tag || !release.tagCommit) {
            this.logger.debug(release);
          }
          return {
            name: release.name || undefined,
            tagName: release.tag ? release.tag.name : 'unknown',
            sha: release.tagCommit.oid,
            notes: release.description,
            url: release.url,
            draft: release.isDraft,
          } as GitHubRelease;
        }),
    } as ReleaseHistory;
  }

  /**
   * Iterate through tags with a max number of results scanned.
   *
   * @param {TagIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {GitHubTag}
   * @throws {GitHubAPIError} on an API error
   */
  async *tagIterator(options: TagIteratorOptions = {}) {
    const maxResults = options.maxResults || Number.MAX_SAFE_INTEGER;
    let results = 0;
    for await (const response of this.octokit.paginate.iterator(
      'GET /repos/{owner}/{repo}/tags',
      {
        owner: this.repository.owner,
        repo: this.repository.repo,
      }
    )) {
      for (const tag of response.data) {
        if ((results += 1) > maxResults) {
          break;
        }
        yield {
          name: tag.name,
          sha: tag.commit.sha,
        };
      }
      if (results > maxResults) break;
    }
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
      this.repository.defaultBranch
    );
  }

  /**
   * Fetch the contents of a file
   *
   * @param {string} path The path to the file in the repository
   * @param {string} branch The branch to fetch from
   * @returns {GitHubFileContents}
   * @throws {FileNotFoundError} if the file cannot be found
   * @throws {GitHubAPIError} on other API errors
   */
  async getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    this.logger.debug(`Fetching ${path} from branch ${branch}`);
    try {
      return await this.fileCache.getFileContents(path, branch);
    } catch (e) {
      if (e instanceof MissingFileError) {
        throw new FileNotFoundError(path);
      }
      throw e;
    }
  }

  async getFileJson<T>(path: string, branch: string): Promise<T> {
    const content = await this.getFileContentsOnBranch(path, branch);
    return JSON.parse(content.parsedContent);
  }

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
      this.repository.defaultBranch,
      prefix
    );
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
        prefix = normalizePrefix(prefix);
      }
      this.logger.debug(
        `finding files by filename: ${filename}, ref: ${ref}, prefix: ${prefix}`
      );
      return await this.fileCache.findFilesByFilename(filename, ref, prefix);
    }
  );

  /**
   * Returns a list of paths to all files matching a glob pattern.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param glob The glob to match
   * @param prefix Optional path prefix used to filter results
   * @returns {string[]} List of file paths
   * @throws {GitHubAPIError} on an API error
   */
  async findFilesByGlob(glob: string, prefix?: string): Promise<string[]> {
    return this.findFilesByGlobAndRef(
      glob,
      this.repository.defaultBranch,
      prefix
    );
  }
  /**
   * Returns a list of paths to all files matching a glob pattern.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param glob The glob to match
   * @param ref Git reference to search files in
   * @param prefix Optional path prefix used to filter results
   * @throws {GitHubAPIError} on an API error
   */
  findFilesByGlobAndRef = wrapAsync(
    async (glob: string, ref: string, prefix?: string): Promise<string[]> => {
      if (prefix) {
        prefix = normalizePrefix(prefix);
      }
      this.logger.debug(
        `finding files by glob: ${glob}, ref: ${ref}, prefix: ${prefix}`
      );
      return await this.fileCache.findFilesByGlob(glob, ref, prefix);
    }
  );

  /**
   * Open a pull request
   *
   * @deprecated This logic is handled by the Manifest class now as it
   *   can be more complicated if the release notes are too big
   * @param {ReleasePullRequest} releasePullRequest Pull request data to update
   * @param {string} targetBranch The base branch of the pull request
   * @param {GitHubPR} options The pull request options
   * @throws {GitHubAPIError} on an API error
   */
  async createReleasePullRequest(
    releasePullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: {
      signoffUser?: string;
      fork?: boolean;
      skipLabeling?: boolean;
    }
  ): Promise<PullRequest> {
    let message = releasePullRequest.title.toString();
    if (options?.signoffUser) {
      message = signoffCommitMessage(message, options.signoffUser);
    }
    const pullRequestLabels: string[] = options?.skipLabeling
      ? []
      : releasePullRequest.labels;
    return await this.createPullRequest(
      {
        headBranchName: releasePullRequest.headRefName,
        baseBranchName: targetBranch,
        number: -1,
        title: releasePullRequest.title.toString(),
        body: releasePullRequest.body.toString().slice(0, MAX_ISSUE_BODY_SIZE),
        labels: pullRequestLabels,
        files: [],
      },
      targetBranch,
      message,
      releasePullRequest.updates,
      {
        fork: options?.fork,
        draft: releasePullRequest.draft,
      }
    );
  }

  /**
   * Open a pull request
   *
   * @param {PullRequest} pullRequest Pull request data to update
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} message The commit message for the commit
   * @param {Update[]} updates The files to update
   * @param {CreatePullRequestOptions} options The pull request options
   * @throws {GitHubAPIError} on an API error
   */
  createPullRequest = wrapAsync(
    async (
      pullRequest: PullRequest,
      targetBranch: string,
      message: string,
      updates: Update[],
      options?: CreatePullRequestOptions
    ): Promise<PullRequest> => {
      //  Update the files for the release if not already supplied
      const changes = await this.buildChangeSet(updates, targetBranch);
      const prNumber = await createPullRequest(this.octokit, changes, {
        upstreamOwner: this.repository.owner,
        upstreamRepo: this.repository.repo,
        title: pullRequest.title,
        branch: pullRequest.headBranchName,
        description: pullRequest.body,
        primary: targetBranch,
        force: true,
        fork: !!options?.fork,
        message,
        logger: this.logger,
        draft: !!options?.draft,
        labels: pullRequest.labels,
      });
      return await this.getPullRequest(prNumber);
    }
  );

  /**
   * Fetch a pull request given the pull number
   * @param {number} number The pull request number
   * @returns {PullRequest}
   */
  getPullRequest = wrapAsync(async (number: number): Promise<PullRequest> => {
    const response = await this.octokit.pulls.get({
      owner: this.repository.owner,
      repo: this.repository.repo,
      pull_number: number,
    });
    return {
      headBranchName: response.data.head.ref,
      baseBranchName: response.data.base.ref,
      number: response.data.number,
      title: response.data.title,
      body: response.data.body || '',
      files: [],
      labels: response.data.labels
        .map(label => label.name)
        .filter(name => !!name) as string[],
    };
  });

  /**
   * Update a pull request's title and body.
   * @param {number} number The pull request number
   * @param {ReleasePullRequest} releasePullRequest Pull request data to update
   * @param {string} targetBranch The target branch of the pull request
   * @param {string} options.signoffUser Optional. Commit signoff message
   * @param {boolean} options.fork Optional. Whether to open the pull request from
   *   a fork or not. Defaults to `false`
   * @param {PullRequestOverflowHandler} options.pullRequestOverflowHandler Optional.
   *   Handles extra large pull request body messages.
   */
  updatePullRequest = wrapAsync(
    async (
      number: number,
      releasePullRequest: ReleasePullRequest,
      targetBranch: string,
      options?: {
        signoffUser?: string;
        fork?: boolean;
        pullRequestOverflowHandler?: PullRequestOverflowHandler;
      }
    ): Promise<PullRequest> => {
      //  Update the files for the release if not already supplied
      const changes = await this.buildChangeSet(
        releasePullRequest.updates,
        targetBranch
      );
      let message = releasePullRequest.title.toString();
      if (options?.signoffUser) {
        message = signoffCommitMessage(message, options.signoffUser);
      }
      const title = releasePullRequest.title.toString();
      const body = (
        options?.pullRequestOverflowHandler
          ? await options.pullRequestOverflowHandler.handleOverflow(
              releasePullRequest
            )
          : releasePullRequest.body
      )
        .toString()
        .slice(0, MAX_ISSUE_BODY_SIZE);
      const prNumber = await createPullRequest(this.octokit, changes, {
        upstreamOwner: this.repository.owner,
        upstreamRepo: this.repository.repo,
        title,
        branch: releasePullRequest.headRefName,
        description: body,
        primary: targetBranch,
        force: true,
        fork: options?.fork === false ? false : true,
        message,
        logger: this.logger,
        draft: releasePullRequest.draft,
      });
      if (prNumber !== number) {
        this.logger.warn(
          `updated code for ${prNumber}, but update requested for ${number}`
        );
      }
      const response = await this.octokit.pulls.update({
        owner: this.repository.owner,
        repo: this.repository.repo,
        pull_number: number,
        title: releasePullRequest.title.toString(),
        body,
        state: 'open',
      });
      return {
        headBranchName: response.data.head.ref,
        baseBranchName: response.data.base.ref,
        number: response.data.number,
        title: response.data.title,
        body: response.data.body || '',
        files: [],
        labels: response.data.labels
          .map(label => label.name)
          .filter(name => !!name) as string[],
      };
    }
  );

  /**
   * Given a set of proposed updates, build a changeset to suggest.
   *
   * @param {Update[]} updates The proposed updates
   * @param {string} defaultBranch The target branch
   * @return {Changes} The changeset to suggest.
   * @throws {GitHubAPIError} on an API error
   */
  async buildChangeSet(
    updates: Update[],
    defaultBranch: string
  ): Promise<ChangeSet> {
    const changes = new Map();
    for (const update of updates) {
      let content: GitHubFileContents | undefined;
      try {
        content = await this.getFileContentsOnBranch(
          update.path,
          defaultBranch
        );
      } catch (err) {
        if (!(err instanceof FileNotFoundError)) throw err;
        // if the file is missing and create = false, just continue
        // to the next update, otherwise create the file.
        if (!update.createIfMissing) {
          this.logger.warn(`file ${update.path} did not exist`);
          continue;
        }
      }
      const contentText = content
        ? Buffer.from(content.content, 'base64').toString('utf8')
        : undefined;
      const updatedContent = update.updater.updateContent(
        contentText,
        this.logger
      );
      if (updatedContent) {
        changes.set(update.path, {
          content: updatedContent,
          originalContent: content?.parsedContent || null,
          mode: content?.mode || DEFAULT_FILE_MODE,
        });
      }
    }
    return changes;
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
        prefix = normalizePrefix(prefix);
      }
      return this.fileCache.findFilesByExtension(extension, ref, prefix);
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
      this.repository.defaultBranch,
      prefix
    );
  }

  /**
   * Create a GitHub release
   *
   * @param {Release} release Release parameters
   * @param {ReleaseOptions} options Release option parameters
   * @throws {DuplicateReleaseError} if the release tag already exists
   * @throws {GitHubAPIError} on other API errors
   */
  createRelease = wrapAsync(
    async (
      release: Release,
      options: ReleaseOptions = {}
    ): Promise<GitHubRelease> => {
      const resp = await this.octokit.repos.createRelease({
        name: release.name,
        owner: this.repository.owner,
        repo: this.repository.repo,
        tag_name: release.tag.toString(),
        body: release.notes,
        draft: !!options.draft,
        prerelease: !!options.prerelease,
        target_commitish: release.sha,
      });
      return {
        id: resp.data.id,
        name: resp.data.name || undefined,
        tagName: resp.data.tag_name,
        sha: resp.data.target_commitish,
        notes:
          resp.data.body_text ||
          resp.data.body ||
          resp.data.body_html ||
          undefined,
        url: resp.data.html_url,
        draft: resp.data.draft,
        uploadUrl: resp.data.upload_url,
      };
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
   * Makes a comment on a issue/pull request.
   *
   * @param {string} comment - The body of the comment to post.
   * @param {number} number - The issue or pull request number.
   * @throws {GitHubAPIError} on an API error
   */
  commentOnIssue = wrapAsync(
    async (comment: string, number: number): Promise<string> => {
      this.logger.debug(
        `adding comment to https://github.com/${this.repository.owner}/${this.repository.repo}/issues/${number}`
      );
      const resp = await this.octokit.issues.createComment({
        owner: this.repository.owner,
        repo: this.repository.repo,
        issue_number: number,
        body: comment,
      });
      return resp.data.html_url;
    }
  );

  /**
   * Removes labels from an issue/pull request.
   *
   * @param {string[]} labels The labels to remove.
   * @param {number} number The issue/pull request number.
   */
  removeIssueLabels = wrapAsync(
    async (labels: string[], number: number): Promise<void> => {
      if (labels.length === 0) {
        return;
      }
      this.logger.debug(`removing labels: ${labels} from issue/pull ${number}`);
      await Promise.all(
        labels.map(label =>
          this.octokit.issues.removeLabel({
            owner: this.repository.owner,
            repo: this.repository.repo,
            issue_number: number,
            name: label,
          })
        )
      );
    }
  );

  /**
   * Adds label to an issue/pull request.
   *
   * @param {string[]} labels The labels to add.
   * @param {number} number The issue/pull request number.
   */
  addIssueLabels = wrapAsync(
    async (labels: string[], number: number): Promise<void> => {
      if (labels.length === 0) {
        return;
      }
      this.logger.debug(`adding labels: ${labels} from issue/pull ${number}`);
      await this.octokit.issues.addLabels({
        owner: this.repository.owner,
        repo: this.repository.repo,
        issue_number: number,
        labels,
      });
    }
  );

  /**
   * Generate release notes from GitHub at tag
   * @param {string} tagName Name of new release tag
   * @param {string} targetCommitish Target commitish for new tag
   * @param {string} previousTag Optional. Name of previous tag to analyze commits since
   */
  async generateReleaseNotes(
    tagName: string,
    targetCommitish: string,
    previousTag?: string
  ): Promise<string> {
    const resp = await this.octokit.repos.generateReleaseNotes({
      owner: this.repository.owner,
      repo: this.repository.repo,
      tag_name: tagName,
      previous_tag_name: previousTag,
      target_commitish: targetCommitish,
    });
    return resp.data.body;
  }

  /**
   * Create a single file on a new branch based on an existing
   * branch. This will force-push to that branch.
   * @param {string} filename Filename with path in the repository
   * @param {string} contents Contents of the file
   * @param {string} newBranchName Name of the new branch
   * @param {string} baseBranchName Name of the base branch (where
   *   new branch is forked from)
   * @returns {string} HTML URL of the new file
   */
  async createFileOnNewBranch(
    filename: string,
    contents: string,
    newBranchName: string,
    baseBranchName: string
  ): Promise<string> {
    // create or update new branch to match base branch
    await this.forkBranch(newBranchName, baseBranchName);

    // use the single file upload API
    const {
      data: {content},
    } = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.repository.owner,
      repo: this.repository.repo,
      path: filename,
      // contents need to be base64 encoded
      content: Buffer.from(contents, 'binary').toString('base64'),
      message: 'Saving release notes',
      branch: newBranchName,
    });

    if (!content?.html_url) {
      throw new Error(
        `Failed to write to file: ${filename} on branch: ${newBranchName}`
      );
    }

    return content.html_url;
  }

  /**
   * Helper to fetch the SHA of a branch
   * @param {string} branchName The name of the branch
   * @return {string | undefined} Returns the SHA of the branch
   *   or undefined if it can't be found.
   */
  private async getBranchSha(branchName: string): Promise<string | undefined> {
    this.logger.debug(`Looking up SHA for branch: ${branchName}`);
    try {
      const {
        data: {
          object: {sha},
        },
      } = await this.octokit.git.getRef({
        owner: this.repository.owner,
        repo: this.repository.repo,
        ref: `heads/${branchName}`,
      });
      this.logger.debug(`SHA for branch: ${sha}`);
      return sha;
    } catch (e) {
      if (e instanceof RequestError && e.status === 404) {
        this.logger.debug(`Branch: ${branchName} does not exist`);
        return undefined;
      }
      throw e;
    }
  }

  /**
   * Helper to fork a branch from an existing branch. Uses `force` so
   * it will overwrite the contents of `targetBranchName` to match
   * the current contents of `baseBranchName`.
   *
   * @param {string} targetBranchName The name of the new forked branch
   * @param {string} baseBranchName The base branch from which to fork.
   * @returns {string} The branch SHA
   * @throws {ConfigurationError} if the base branch cannot be found.
   */
  private async forkBranch(
    targetBranchName: string,
    baseBranchName: string
  ): Promise<string> {
    const baseBranchSha = await this.getBranchSha(baseBranchName);
    if (!baseBranchSha) {
      // this is highly unlikely to be thrown as we will have
      // already attempted to read from the branch
      throw new ConfigurationError(
        `Unable to find base branch: ${baseBranchName}`,
        'core',
        `${this.repository.owner}/${this.repository.repo}`
      );
    }
    // see if newBranchName exists
    if (await this.getBranchSha(targetBranchName)) {
      // branch already exists, update it to the match the base branch
      const branchSha = await this.updateBranchSha(
        targetBranchName,
        baseBranchSha
      );
      this.logger.debug(
        `Updated ${targetBranchName} to match ${baseBranchName} at ${branchSha}`
      );
      return branchSha;
    } else {
      // branch does not exist, create a new branch from the base branch
      const branchSha = await this.createNewBranch(
        targetBranchName,
        baseBranchSha
      );
      this.logger.debug(
        `Forked ${targetBranchName} from ${baseBranchName} at ${branchSha}`
      );
      return branchSha;
    }
  }

  /**
   * Helper to create a new branch from a given SHA.
   * @param {string} branchName The new branch name
   * @param {string} branchSha The SHA of the branch
   * @returns {string} The SHA of the new branch
   */
  private async createNewBranch(
    branchName: string,
    branchSha: string
  ): Promise<string> {
    this.logger.debug(`Creating new branch: ${branchName} at ${branchSha}`);
    const {
      data: {
        object: {sha},
      },
    } = await this.octokit.git.createRef({
      owner: this.repository.owner,
      repo: this.repository.repo,
      ref: `refs/heads/${branchName}`,
      sha: branchSha,
    });
    this.logger.debug(`New branch: ${branchName} at ${sha}`);
    return sha;
  }

  private async updateBranchSha(
    branchName: string,
    branchSha: string
  ): Promise<string> {
    this.logger.debug(`Updating branch ${branchName} to ${branchSha}`);
    const {
      data: {
        object: {sha},
      },
    } = await this.octokit.git.updateRef({
      owner: this.repository.owner,
      repo: this.repository.repo,
      ref: `heads/${branchName}`,
      sha: branchSha,
      force: true,
    });
    this.logger.debug(`Updated branch: ${branchName} to ${sha}`);
    return sha;
  }
}

/**
 * Normalize a provided prefix by removing leading and trailing
 * slashes.
 *
 * @param prefix String to normalize
 */
function normalizePrefix(prefix: string) {
  const normalized = prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '');
  if (normalized === ROOT_PROJECT_PATH) {
    return '';
  }
  return normalized;
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
        errorHandler(e as GitHubAPIError);
      }
      if (e instanceof RequestError) {
        throw new GitHubAPIError(e);
      }
      throw e;
    }
  };
};

export const sleepInMs = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));
