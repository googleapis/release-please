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

import {createPullRequest, Changes} from 'code-suggester';
import {PullRequest} from './pull-request';
import {Commit} from './commit';

import {Octokit} from '@octokit/rest';
import {request} from '@octokit/request';
import {graphql} from '@octokit/graphql';
import {RequestError} from '@octokit/request-error';
import {GitHubAPIError, DuplicateReleaseError} from './errors';

const MAX_ISSUE_BODY_SIZE = 65536;
export const GH_API_URL = 'https://api.github.com';
export const GH_GRAPHQL_URL = 'https://api.github.com';
type OctokitType = InstanceType<typeof Octokit>;

import {logger} from './util/logger';
import {Repository} from './repository';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Release} from './release';
import {ROOT_PROJECT_PATH} from './manifest';
import {signoffCommitMessage} from './util/signoff-commit-message';

// Extract some types from the `request` package.
type RequestBuilderType = typeof request;
type DefaultFunctionType = RequestBuilderType['defaults'];
type RequestFunctionType = ReturnType<DefaultFunctionType>;
type RequestOptionsType = Parameters<DefaultFunctionType>[0];
export interface OctokitAPIs {
  graphql: Function;
  request: RequestFunctionType;
  octokit: OctokitType;
}

export interface GitHubOptions {
  repository: Repository;
  octokitAPIs: OctokitAPIs;
}

interface GitHubCreateOptions {
  owner: string;
  repo: string;
  defaultBranch?: string;
  apiUrl?: string;
  graphqlUrl?: string;
  octokitAPIs?: OctokitAPIs;
  token?: string;
}

export interface GitHubFileContents {
  sha: string;
  content: string;
  parsedContent: string;
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
  name?: string;
  tagName: string;
  sha: string;
  notes?: string;
  url: string;
  draft?: boolean;
}

export interface GitHubTag {
  name: string;
  sha: string;
}

export class GitHub {
  readonly repository: Repository;
  private octokit: OctokitType;
  private request: RequestFunctionType;
  private graphql: Function;

  private constructor(options: GitHubOptions) {
    this.repository = options.repository;
    this.octokit = options.octokitAPIs.octokit;
    this.request = options.octokitAPIs.request;
    this.graphql = options.octokitAPIs.graphql;
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
    logger.debug(
      `Fetching merge commits on branch ${targetBranch} with cursor: ${cursor}`
    );
    const response = await this.graphqlRequest({
      query: `query pullRequestsSince($owner: String!, $repo: String!, $num: Int!, $maxFilesChanged: Int, $targetBranch: String!, $cursor: String) {
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
      }`,
      cursor,
      owner: this.repository.owner,
      repo: this.repository.repo,
      num: 25,
      targetBranch,
      maxFilesChanged: 64,
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
    const commitData: Commit[] = [];
    for (const graphCommit of commits) {
      const commit: Commit = {
        sha: graphCommit.sha,
        message: graphCommit.message,
      };
      const pullRequest = graphCommit.associatedPullRequests.nodes.find(pr => {
        return pr.mergeCommit && pr.mergeCommit.oid === graphCommit.sha;
      });
      if (pullRequest) {
        const files = pullRequest.files.nodes.map(node => node.path);
        commit.pullRequest = {
          sha: commit.sha,
          number: pullRequest.number,
          baseBranchName: pullRequest.baseRefName,
          headBranchName: pullRequest.headRefName,
          title: pullRequest.title,
          body: pullRequest.body,
          labels: pullRequest.labels.nodes.map(node => node.name),
          files,
        };
        // We cannot directly fetch files on commits via graphql, only provide file
        // information for commits with associated pull requests
        commit.files = files;
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
    logger.debug(`Backfilling file list for commit: ${sha}`);
    const resp = await this.octokit.repos.getCommit({
      owner: this.repository.owner,
      repo: this.repository.repo,
      ref: sha,
    });
    const files = resp.data.files || [];
    return files.map(file => file.filename!).filter(filename => !!filename);
  });

  private graphqlRequest = wrapAsync(
    async (
      opts: {
        [key: string]: string | number | null | undefined;
      },
      maxRetries = 1
    ) => {
      while (maxRetries >= 0) {
        try {
          return await this.graphql(opts);
        } catch (err) {
          if (err.status !== 502) {
            throw err;
          }
        }
        maxRetries -= 1;
      }
    }
  );

  /**
   * Iterate through merged pull requests with a max number of results scanned.
   *
   * @param {number} maxResults maxResults - Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {PullRequest}
   * @throws {GitHubAPIError} on an API error
   */
  async *pullRequestIterator(
    targetBranch: string,
    status: 'OPEN' | 'CLOSED' | 'MERGED' = 'MERGED',
    maxResults: number = Number.MAX_SAFE_INTEGER
  ) {
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
    logger.debug(
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
    if (!response.repository.pullRequests) {
      logger.warn(
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
          labels: (pullRequest.labels.nodes || []).map(l => l.name),
          title: pullRequest.title,
          body: pullRequest.body + '',
          files: pullRequest.files.nodes.map(node => node.path),
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
      if (!response.pageInfo.hasNextPage) {
        break;
      }
      cursor = response.pageInfo.endCursor;
    }
  }

  private async releaseGraphQL(
    cursor?: string
  ): Promise<ReleaseHistory | null> {
    logger.debug(`Fetching releases with cursor ${cursor}`);
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
      logger.warn('Could not find releases.');
      return null;
    }
    const releases = response.repository.releases.nodes as GraphQLRelease[];
    return {
      pageInfo: response.repository.releases.pageInfo,
      data: releases
        .filter(release => !!release.tagCommit)
        .map(release => {
          if (!release.tag || !release.tagCommit) {
            logger.debug(release);
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
      this.octokit.rest.repos.listTags,
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
      ref = isBranch ? fullyQualifyBranchRef(ref) : ref;
      const options: RequestOptionsType = {
        owner: this.repository.owner,
        repo: this.repository.repo,
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
  getFileContentsWithDataAPI = wrapAsync(
    async (path: string, branch: string): Promise<GitHubFileContents> => {
      const repoTree = await this.octokit.git.getTree({
        owner: this.repository.owner,
        repo: this.repository.repo,
        tree_sha: branch,
      });

      const blobDescriptor = repoTree.data.tree.find(
        tree => tree.path === path
      );
      if (!blobDescriptor) {
        throw new Error(`Could not find requested path: ${path}`);
      }

      const resp = await this.octokit.git.getBlob({
        owner: this.repository.owner,
        repo: this.repository.repo,
        file_sha: blobDescriptor.sha!,
      });

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
   * Fetch the contents of a file
   *
   * @param {string} path The path to the file in the repository
   * @param {string} branch The branch to fetch from
   * @returns {GitHubFileContents}
   * @throws {GitHubAPIError} on other API errors
   */
  async getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    logger.debug(`Fetching ${path} from branch ${branch}`);
    try {
      return await this.getFileContentsWithSimpleAPI(path, branch);
    } catch (err) {
      if (err.status === 403) {
        return await this.getFileContentsWithDataAPI(path, branch);
      }
      throw err;
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
      logger.debug(
        `finding files by filename: ${filename}, ref: ${ref}, prefix: ${prefix}`
      );
      const response = await this.octokit.git.getTree({
        owner: this.repository.owner,
        repo: this.repository.repo,
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
            (!prefix || path.startsWith(`${prefix}/`))
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
   * Open a pull request
   *
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
    }
  ): Promise<PullRequest> {
    let message = releasePullRequest.title.toString();
    if (options?.signoffUser) {
      message = signoffCommitMessage(message, options.signoffUser);
    }
    return await this.createPullRequest(
      {
        headBranchName: releasePullRequest.headRefName,
        baseBranchName: targetBranch,
        number: -1,
        title: releasePullRequest.title.toString(),
        body: releasePullRequest.body.toString().slice(0, MAX_ISSUE_BODY_SIZE),
        labels: releasePullRequest.labels,
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

  createPullRequest = wrapAsync(
    async (
      pullRequest: PullRequest,
      targetBranch: string,
      message: string,
      updates: Update[],
      options?: {
        fork?: boolean;
        draft?: boolean;
      }
    ): Promise<PullRequest> => {
      //  Update the files for the release if not already supplied
      const changes = await this.getChangeSet(updates, targetBranch);
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
        logger: logger,
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
   * @param {}
   */
  updatePullRequest = wrapAsync(
    async (
      number: number,
      releasePullRequest: ReleasePullRequest,
      targetBranch: string,
      options?: {
        signoffUser?: string;
        fork?: boolean;
      }
    ): Promise<PullRequest> => {
      //  Update the files for the release if not already supplied
      const changes = await this.getChangeSet(
        releasePullRequest.updates,
        targetBranch
      );
      let message = releasePullRequest.title.toString();
      if (options?.signoffUser) {
        message = signoffCommitMessage(message, options.signoffUser);
      }
      const title = releasePullRequest.title.toString();
      const body = releasePullRequest.body
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
        logger: logger,
        draft: releasePullRequest.draft,
      });
      if (prNumber !== number) {
        logger.warn(
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
  private async getChangeSet(
    updates: Update[],
    defaultBranch: string
  ): Promise<Changes> {
    const changes = new Map();
    for (const update of updates) {
      let content;
      try {
        if (update.cachedFileContents) {
          // we already loaded the file contents earlier, let's not
          // hit GitHub again.
          content = {data: update.cachedFileContents};
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
        if (!update.createIfMissing) {
          logger.warn(`file ${update.path} did not exist`);
          continue;
        }
      }
      const contentText = content
        ? Buffer.from(content.data.content, 'base64').toString('utf8')
        : undefined;
      const updatedContent = update.updater.updateContent(contentText);
      if (updatedContent) {
        changes.set(update.path, {
          content: updatedContent,
          mode: '100644',
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
      const response = await this.octokit.git.getTree({
        owner: this.repository.owner,
        repo: this.repository.repo,
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
            (!prefix || path.startsWith(`${prefix}/`))
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
        sha: release.sha,
        draft: !!options.draft,
        prerelease: !!options.prerelease,
      });
      return {
        name: resp.data.name || undefined,
        tagName: resp.data.tag_name,
        sha: resp.data.target_commitish,
        notes: resp.data.body_text,
        url: resp.data.html_url,
        draft: resp.data.draft,
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
      logger.debug(
        `adding comment to https://github.com/${this.repository.owner}/${this.repository.repo}/issue/${number}`
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
      logger.debug(`removing labels: ${labels} from issue/pull ${number}`);
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
      logger.debug(`adding labels: ${labels} from issue/pull ${number}`);
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
}

// Takes a potentially unqualified branch name, and turns it
// into a fully qualified ref.
//
// e.g. main -> refs/heads/main
function fullyQualifyBranchRef(refName: string): string {
  let final = refName;
  if (final.indexOf('/') < 0) {
    final = `refs/heads/${final}`;
  }

  return final;
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
        errorHandler(e);
      }
      if (e instanceof RequestError) {
        throw new GitHubAPIError(e);
      }
      throw e;
    }
  };
};
