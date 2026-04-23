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

import {PullRequest} from './pull-request';
import {Commit} from './commit';

import {Octokit} from '@octokit/rest';
import {request} from '@octokit/request';
import {RequestError} from '@octokit/request-error';
import {createPullRequest as suggesterCreatePullRequest} from 'code-suggester';
import {GitHubAPIError, FileNotFoundError} from './errors';

const MAX_ISSUE_BODY_SIZE = 65536;
const MAX_SLEEP_SECONDS = 20;

type OctokitType = InstanceType<typeof Octokit>;

import {logger as defaultLogger} from './util/logger';
import {Repository} from './repository';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Release} from './release';
import {ROOT_PROJECT_PATH} from './manifest';
import {GitHubApi, GitHubCreateOptions} from './github-api';
import {signoffCommitMessage} from './util/signoff-commit-message';
import {
  RepositoryFileCache,
  GitHubFileContents,
  DEFAULT_FILE_MODE,
  FileNotFoundError as MissingFileError,
} from '@google-automations/git-file-utils';
import {Logger} from 'code-suggester/build/src/types';
import {mergeUpdates} from './updaters/composite';
import {
  Scm,
  ScmChangeSet,
  ScmCommitIteratorOptions,
  ScmReleaseIteratorOptions,
  ScmTagIteratorOptions,
  ScmCreatePullRequestOptions,
  ScmReleaseOptions,
  ScmRelease,
  ScmTag,
  ScmUpdatePullRequestOptions,
} from './scm';

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

type CommitFilter = (commit: Commit) => boolean;

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
  fetch?: unknown;
}

interface GraphQLCommit {
  sha: string;
  message: string;
  author?: GraphQLCommitAuthor;
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

interface CommitHistory {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | undefined;
  };
  data: Commit[];
}

type CommitIteratorOptions = ScmCommitIteratorOptions;
type ReleaseIteratorOptions = ScmReleaseIteratorOptions;
type TagIteratorOptions = ScmTagIteratorOptions;

export type ReleaseOptions = ScmReleaseOptions;
export type GitHubRelease = ScmRelease;
export type GitHubTag = ScmTag;
export type ChangeSet = ScmChangeSet;

type CreatePullRequestOptions = ScmCreatePullRequestOptions;

export class GitHub implements Scm {
  readonly repository: Repository;
  private octokit: OctokitType;
  private graphql: Function;
  private fileCache: RepositoryFileCache;
  private logger: Logger;
  private gitHubApi: GitHubApi;

  private constructor(options: GitHubOptions) {
    this.repository = options.repository;
    this.octokit = options.octokitAPIs.octokit;
    this.graphql = options.octokitAPIs.graphql;
    this.fileCache = new RepositoryFileCache(this.octokit, this.repository);
    this.logger = options.logger ?? defaultLogger;
    this.gitHubApi = new GitHubApi({
      repository: this.repository,
      octokitAPIs: options.octokitAPIs,
      logger: this.logger,
    });
  }

  getGitHubApi(): GitHubApi {
    return this.gitHubApi;
  }

  static async create(options: GitHubCreateOptions): Promise<GitHub> {
    const gitHubApi = await GitHubApi.create(options);
    return new GitHub({
      repository: gitHubApi.repository,
      octokitAPIs: gitHubApi.octokitAPIs,
      logger: options.logger,
    });
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
                  author {
                    name
                    email
                    user {
                      login
                    }
                  }
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
      num: options.batchSize ?? 10,
      targetBranch,
      maxFilesChanged: 100, // max is 100
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
        author: graphCommit.author
          ? {
              name: graphCommit.author.name || 'Unknown',
              email: graphCommit.author.email,
              username: graphCommit.author.user?.login,
            }
          : undefined,
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
      const data = resp.data as unknown as {files: {filename: string}[]};
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
    yield* this.gitHubApi.pullRequestIterator(
      targetBranch,
      status,
      maxResults,
      includeFiles
    );
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
    yield* this.gitHubApi.releaseIterator(options);
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
   * @param {PullRequest} pullRequest Pull request data to update
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} message The commit message for the commit
   * @param {Update[]} updates The files to update
   * @param {CreatePullRequestOptions} options The pull request options
   * @throws {GitHubAPIError} on an API error
   */
  async createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: CreatePullRequestOptions
  ): Promise<PullRequest> {
    const changes = await this.buildChangeSet(updates, targetBranch);
    const prNumber = await suggesterCreatePullRequest(this.octokit, changes, {
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
    if (prNumber === 0) {
      this.logger.warn(
        'no code changes detected, skipping pull request creation'
      );
      return {
        headBranchName: pullRequest.headBranchName,
        baseBranchName: targetBranch,
        number: 0,
        title: pullRequest.title,
        body: pullRequest.body,
        labels: pullRequest.labels,
        files: [],
      };
    }
    return await this.getPullRequest(prNumber);
  }

  /**
   * Fetch a pull request given the pull number
   * @param {number} number The pull request number
   * @returns {PullRequest}
   */
  async getPullRequest(number: number): Promise<PullRequest> {
    return await this.gitHubApi.getPullRequest(number);
  }

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
  async updatePullRequest(
    number: number,
    releasePullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: ScmUpdatePullRequestOptions
  ): Promise<PullRequest> {
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
    const prNumber = await suggesterCreatePullRequest(this.octokit, changes, {
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
    return this.gitHubApi.updatePullRequest(number, title, body);
  }

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
    // Sometimes multiple updates are proposed for the same file,
    // such as when the manifest file is additionally changed by the
    // node-workspace plugin. We need to merge these updates.
    const mergedUpdates = mergeUpdates(updates);
    const changes = new Map();
    for (const update of mergedUpdates) {
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
  async createRelease(
    release: Release,
    options: ReleaseOptions = {}
  ): Promise<GitHubRelease> {
    return await this.gitHubApi.createRelease(release, options);
  }

  /**
   * Makes a comment on a issue/pull request.
   *
   * @param {string} comment - The body of the comment to post.
   * @param {number} number - The issue or pull request number.
   * @throws {GitHubAPIError} on an API error
   */
  async commentOnIssue(comment: string, number: number): Promise<string> {
    return await this.gitHubApi.commentOnIssue(comment, number);
  }

  /**
   * Removes labels from an issue/pull request.
   *
   * @param {string[]} labels The labels to remove.
   * @param {number} number The issue/pull request number.
   */
  async removeIssueLabels(labels: string[], number: number): Promise<void> {
    return await this.gitHubApi.removeIssueLabels(labels, number);
  }

  /**
   * Adds label to an issue/pull request.
   *
   * @param {string[]} labels The labels to add.
   * @param {number} number The issue/pull request number.
   */
  async addIssueLabels(labels: string[], number: number): Promise<void> {
    return await this.gitHubApi.addIssueLabels(labels, number);
  }

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
    return await this.gitHubApi.generateReleaseNotes(
      tagName,
      targetCommitish,
      previousTag
    );
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
    return await this.gitHubApi.createFileOnNewBranch(
      filename,
      contents,
      newBranchName,
      baseBranchName
    );
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
