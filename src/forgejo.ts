// Copyright 2026 Google LLC
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

import * as path from 'path';
import {request} from '@octokit/request';
import {RequestError} from '@octokit/request-error';
import {
  GitHubFileContents,
  DEFAULT_FILE_MODE,
} from '@google-automations/git-file-utils';
import {
  Scm,
  ScmChangeSet,
  ScmCommitIteratorOptions,
  ScmCreatePullRequestOptions,
  ScmFileDiff,
  ScmRelease,
  ScmReleaseIteratorOptions,
  ScmReleaseOptions,
  ScmTag,
  ScmTagIteratorOptions,
  ScmUpdatePullRequestOptions,
} from './scm';
import {Repository} from './repository';
import {Commit} from './commit';
import {PullRequest} from './pull-request';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Release} from './release';
import {
  ConfigurationError,
  DuplicateReleaseError,
  FileNotFoundError,
  GitHubAPIError,
} from './errors';
import {MAX_ISSUE_BODY_SIZE, wrapAsync} from './github-api';
import {mergeUpdates} from './updaters/composite';
import {signoffCommitMessage} from './util/signoff-commit-message';
import {Logger, logger as defaultLogger} from './util/logger';
import {globToRegex, normalizePathPrefix, relativizePaths} from './util/glob';

type RequestFunction = typeof request;

export const FORGEJO_API_PATH = '/api/v1';
// Page size used if the instance's `[api].MAX_RESPONSE_ITEMS` can't be read
// (50 is Forgejo's default).
const DEFAULT_PAGE_SIZE = 50;
// Number of concurrent "pull request for commit" lookups, unless overridden
// by the `commit-batch-size` option.
const DEFAULT_PULL_REQUEST_LOOKUP_BATCH_SIZE = 10;
const DEFAULT_LABEL_COLOR = '#ededed';
// First Forgejo version supporting `force_overwrite_new_branch`.
const MIN_FORGEJO_VERSION = 16;
// Forgejo has no draft flag: a title prefix listed in
// `[repository.pull-request].WORK_IN_PROGRESS_PREFIXES` marks a pull request
// as draft ("work in progress"), which prevents merging it. `WIP:` and
// `[WIP]` are Forgejo's defaults.
export const DEFAULT_WORK_IN_PROGRESS_PREFIX = 'WIP:';
const DEFAULT_WORK_IN_PROGRESS_PREFIXES = ['WIP:', '[WIP]'];

export interface ForgejoCreateOptions {
  owner: string;
  repo: string;
  /** Forgejo API base URL, e.g. `https://git.example.com/api/v1` */
  apiUrl: string;
  token?: string;
  defaultBranch?: string;
  /**
   * Title prefix marking draft pull requests. Must be one of the instance's
   * `WORK_IN_PROGRESS_PREFIXES`. Defaults to `WIP:`.
   */
  workInProgressPrefix?: string;
  logger?: Logger;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch?: any;
}

export interface ForgejoOptions {
  repository: Repository;
  request: RequestFunction;
  webUrl: string;
  workInProgressPrefix?: string;
  logger?: Logger;
}

interface ForgejoUser {
  login: string;
}

interface ForgejoLabel {
  id: number;
  name: string;
}

interface ForgejoBranchInfo {
  // the branch name
  label?: string;
  // the branch name, or `refs/pull/<index>/head` once the branch is deleted
  ref: string;
  sha?: string;
  repo_id?: number;
}

interface ForgejoPullRequest {
  number: number;
  title: string;
  body?: string | null;
  state: string;
  merged: boolean;
  merge_commit_sha?: string | null;
  head: ForgejoBranchInfo;
  base: ForgejoBranchInfo;
  labels?: ForgejoLabel[] | null;
  html_url: string;
  // true if the title has a work in progress prefix
  draft?: boolean;
}

interface ForgejoCommit {
  sha: string;
  commit: {
    message: string;
    author?: {
      name?: string;
      email?: string;
    } | null;
  };
  author?: ForgejoUser | null;
  files?: {filename: string}[] | null;
}

interface ForgejoRelease {
  id: number;
  name?: string | null;
  tag_name: string;
  target_commitish: string;
  body?: string | null;
  html_url: string;
  upload_url?: string;
  draft: boolean;
}

interface ForgejoTag {
  name: string;
  commit: {
    sha: string;
  };
}

interface ForgejoContents {
  type: string;
  content?: string | null;
  sha: string;
}

interface ForgejoTreeEntry {
  path: string;
  type: string;
  mode: string;
  sha: string;
}

interface ForgejoTree {
  tree?: ForgejoTreeEntry[] | null;
  truncated?: boolean;
}

interface ForgejoFilesResponse {
  files?: ({html_url?: string} | null)[] | null;
}

interface ChangeFileOperation {
  operation: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
  sha?: string;
}

interface ResponseLike<T> {
  data: T;
  headers: Record<string, string | number | undefined>;
}

/**
 * Forgejo implements the Scm interface using the Forgejo REST API
 * (`/api/v1`). Requires Forgejo v16 or newer to update existing release
 * pull request branches.
 */
export class Forgejo implements Scm {
  readonly repository: Repository;
  readonly webUrl: string;
  private request: RequestFunction;
  private logger: Logger;
  private fileCache = new Map<string, GitHubFileContents>();
  private treeCache = new Map<string, ForgejoTreeEntry[]>();
  private tagShaCache = new Map<string, string | undefined>();
  private labelCache?: Map<string, number>;
  private pageSize?: Promise<number>;
  private workInProgressPrefix: string;
  private workInProgressRegex: RegExp;

  constructor(options: ForgejoOptions) {
    this.repository = options.repository;
    this.request = options.request;
    this.webUrl = options.webUrl;
    this.logger = options.logger ?? defaultLogger;
    this.workInProgressPrefix =
      options.workInProgressPrefix?.trim() || DEFAULT_WORK_IN_PROGRESS_PREFIX;
    this.workInProgressRegex = new RegExp(
      `^\\s*(?:${[
        this.workInProgressPrefix,
        ...DEFAULT_WORK_IN_PROGRESS_PREFIXES,
      ]
        .map(escapeRegExp)
        .join('|')})\\s*`,
      'i'
    );
  }

  static async create(options: ForgejoCreateOptions): Promise<Forgejo> {
    const apiUrl = options.apiUrl.replace(/\/+$/, '');
    const releasePleaseVersion = require('../../package.json').version;
    const headers: Record<string, string> = {
      'user-agent': `release-please/${releasePleaseVersion}`,
    };
    if (options.token) {
      headers.authorization = `token ${options.token}`;
    }
    const forgejoRequest = request.defaults({
      baseUrl: apiUrl,
      headers,
      request: {fetch: options.fetch},
    });
    const defaultBranch =
      options.defaultBranch ??
      (await Forgejo.defaultBranch(
        options.owner,
        options.repo,
        forgejoRequest
      ));
    return new Forgejo({
      repository: {
        owner: options.owner,
        repo: options.repo,
        defaultBranch,
      },
      request: forgejoRequest,
      webUrl: Forgejo.webUrlFromApiUrl(apiUrl),
      workInProgressPrefix: options.workInProgressPrefix,
      logger: options.logger,
    });
  }

  static async defaultBranch(
    owner: string,
    repo: string,
    forgejoRequest: RequestFunction
  ): Promise<string> {
    const {data} = await forgejoRequest(
      `GET /repos/${encodePath(owner)}/${encodePath(repo)}`
    );
    return data.default_branch;
  }

  /**
   * Derive the web URL of the instance from its API URL.
   * @param {string} apiUrl The API URL, e.g. `https://git.example.com/api/v1`
   * @returns {string} The web URL, e.g. `https://git.example.com`
   */
  static webUrlFromApiUrl(apiUrl: string): string {
    return apiUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  }

  private repoPath(...segments: string[]): string {
    return [
      '/repos',
      encodePath(this.repository.owner),
      encodePath(this.repository.repo),
      ...segments,
    ].join('/');
  }

  private async call<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    route: string,
    params: Record<string, unknown> = {}
  ): Promise<ResponseLike<T>> {
    const response = await this.request(`${method} ${route}`, params);
    return {
      data: response.data as T,
      headers: response.headers as ResponseLike<T>['headers'],
    };
  }

  /**
   * The maximum page size of the instance (`[api].MAX_RESPONSE_ITEMS`).
   */
  private getPageSize(): Promise<number> {
    this.pageSize ??= this.call<{max_response_items?: number}>(
      'GET',
      '/settings/api'
    ).then(
      ({data}) =>
        data.max_response_items && data.max_response_items > 0
          ? data.max_response_items
          : DEFAULT_PAGE_SIZE,
      e => {
        this.logger.debug(`Unable to read Forgejo API settings: ${e}`);
        return DEFAULT_PAGE_SIZE;
      }
    );
    return this.pageSize;
  }

  /**
   * Iterate over all items of a paginated list endpoint.
   */
  private async *paginate<T>(
    route: string,
    params: Record<string, unknown> = {}
  ): AsyncGenerator<T, void, void> {
    const limit = await this.getPageSize();
    for (let page = 1; ; page++) {
      const {data, headers} = await this.call<T[]>('GET', route, {
        ...params,
        page,
        limit,
      });
      if (!data || data.length === 0) {
        return;
      }
      for (const item of data) {
        yield item;
      }
      if (`${headers['x-hasmore']}` === 'false') {
        return;
      }
      if (headers.link !== undefined && !`${headers.link}`.includes('"next"')) {
        return;
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
   * Fetch the contents of a file
   *
   * @param {string} path The path to the file in the repository
   * @param {string} branch The branch to fetch from
   * @returns {GitHubFileContents}
   * @throws {FileNotFoundError} if the file cannot be found
   * @throws {GitHubAPIError} on other API errors
   */
  getFileContentsOnBranch = wrapAsync(
    async (path: string, branch: string): Promise<GitHubFileContents> => {
      const cacheKey = fileCacheKey(branch, path);
      const cached = this.fileCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      this.logger.debug(`Fetching ${path} from branch ${branch}`);
      let data: ForgejoContents | ForgejoContents[];
      try {
        ({data} = await this.call<ForgejoContents | ForgejoContents[]>(
          'GET',
          this.repoPath('contents', encodePath(path)),
          {ref: branch}
        ));
      } catch (e) {
        if (e instanceof RequestError && e.status === 404) {
          throw new FileNotFoundError(path);
        }
        throw e;
      }
      if (Array.isArray(data) || data.type !== 'file') {
        throw new FileNotFoundError(path);
      }
      const buffer =
        typeof data.content === 'string'
          ? Buffer.from(data.content, 'base64')
          : await this.getRawFile(path, branch);
      const contents: GitHubFileContents = {
        sha: data.sha,
        mode: DEFAULT_FILE_MODE,
        content: buffer.toString('base64'),
        parsedContent: buffer.toString('utf8'),
      };
      this.fileCache.set(cacheKey, contents);
      return contents;
    }
  );

  private async getRawFile(path: string, branch: string): Promise<Buffer> {
    const {data} = await this.call<string | ArrayBuffer>(
      'GET',
      this.repoPath('raw', encodePath(path)),
      {ref: branch}
    );
    return typeof data === 'string'
      ? Buffer.from(data, 'utf8')
      : Buffer.from(data as ArrayBuffer);
  }

  async getFileJson<T>(path: string, branch: string): Promise<T> {
    const content = await this.getFileContentsOnBranch(path, branch);
    return JSON.parse(content.parsedContent);
  }

  /**
   * Resolve a git reference (branch, tag or SHA) to a commit SHA.
   */
  private async resolveCommitSha(ref: string): Promise<string> {
    const {data} = await this.call<ForgejoCommit[]>(
      'GET',
      this.repoPath('commits'),
      {sha: ref, limit: 1, stat: false, verification: false, files: false}
    );
    if (!data?.length) {
      throw new FileNotFoundError(ref);
    }
    return data[0].sha;
  }

  /**
   * List all entries of the recursive git tree at the given reference.
   */
  private async listTree(ref: string): Promise<ForgejoTreeEntry[]> {
    const sha = await this.resolveCommitSha(ref);
    const cached = this.treeCache.get(sha);
    if (cached) {
      return cached;
    }
    const entries: ForgejoTreeEntry[] = [];
    for (let page = 1; ; page++) {
      const {data} = await this.call<ForgejoTree>(
        'GET',
        this.repoPath('git', 'trees', sha),
        {recursive: true, page}
      );
      const tree = data.tree ?? [];
      entries.push(...tree.filter(entry => entry.type !== 'commit'));
      if (!data.truncated || tree.length === 0) {
        break;
      }
    }
    this.treeCache.set(sha, entries);
    return entries;
  }

  private async findPaths(
    ref: string,
    prefix: string | undefined,
    predicate: (entry: ForgejoTreeEntry) => boolean
  ): Promise<string[]> {
    const entries = await this.listTree(ref);
    const paths = entries.filter(predicate).map(entry => entry.path);
    return relativizePaths(paths, normalizePathPrefix(prefix));
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
    async (filename: string, ref: string, prefix?: string) => {
      this.logger.debug(
        `finding files by filename: ${filename}, ref: ${ref}, prefix: ${prefix}`
      );
      return this.findPaths(
        ref,
        prefix,
        entry =>
          entry.type === 'blob' && path.posix.basename(entry.path) === filename
      );
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
   * Returns a list of paths to all files (and directories) matching a
   * glob pattern. The glob is matched relative to the prefix.
   *
   * @param glob The glob to match
   * @param ref Git reference to search files in
   * @param prefix Optional path prefix used to filter results
   * @throws {GitHubAPIError} on an API error
   */
  findFilesByGlobAndRef = wrapAsync(
    async (glob: string, ref: string, prefix?: string) => {
      this.logger.debug(
        `finding files by glob: ${glob}, ref: ${ref}, prefix: ${prefix}`
      );
      const regex = globToRegex(glob);
      const paths = await this.findPaths(
        ref,
        prefix,
        entry => entry.type === 'blob' || entry.type === 'tree'
      );
      return paths.filter(p => regex.test(p));
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
   * Returns a list of paths to all files with a given file
   * extension.
   *
   * @param extension The file extension used to filter results.
   *   Example: `js`, `java`
   * @param ref Git reference to search files in
   * @param prefix Optional path prefix used to filter results
   * @returns {string[]} List of file paths
   * @throws {GitHubAPIError} on an API error
   */
  findFilesByExtensionAndRef = wrapAsync(
    async (extension: string, ref: string, prefix?: string) => {
      this.logger.debug(
        `finding files by extension: ${extension}, ref: ${ref}, prefix: ${prefix}`
      );
      return this.findPaths(
        ref,
        prefix,
        entry => entry.type === 'blob' && entry.path.endsWith(`.${extension}`)
      );
    }
  );

  /**
   * Returns the list of commits to the default branch after the provided filter
   * query has been satified.
   *
   * @param {string} targetBranch Target branch of commit
   * @param {CommitFilter} filter Callback function that returns whether a
   *   commit/pull request matches certain criteria
   * @param {CommitIteratorOptions} options Query options
   * @returns {Commit[]} List of commits to current branch
   * @throws {GitHubAPIError} on an API error
   */
  async commitsSince(
    targetBranch: string,
    filter: (commit: Commit) => boolean,
    options: ScmCommitIteratorOptions = {}
  ): Promise<Commit[]> {
    const commits: Commit[] = [];
    for await (const commit of this.mergeCommitIterator(
      targetBranch,
      options
    )) {
      if (filter(commit)) {
        break;
      }
      commits.push(commit);
    }
    return commits;
  }

  /**
   * Iterate through commit history with a max number of results scanned.
   * Each commit is associated with the pull request whose merge commit it
   * is (merge and squash merges; for rebase merges only the last commit).
   *
   * @param {string} targetBranch target branch of commit
   * @param {CommitIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @param {boolean} options.backfillFiles If set, fetch the list of touched
   *   files for each commit.
   * @yields {Commit}
   * @throws {GitHubAPIError} on an API error
   */
  async *mergeCommitIterator(
    targetBranch: string,
    options: ScmCommitIteratorOptions = {}
  ): AsyncGenerator<Commit, void, void> {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    const includeFiles = !!options.backfillFiles;
    this.logger.debug(`Fetching commits on branch ${targetBranch}`);
    const commits = this.paginate<ForgejoCommit>(this.repoPath('commits'), {
      sha: targetBranch,
      stat: false,
      verification: false,
      files: includeFiles,
    });
    let results = 0;
    try {
      for await (const batch of chunk(
        commits,
        Math.min(
          options.batchSize ?? DEFAULT_PULL_REQUEST_LOOKUP_BATCH_SIZE,
          maxResults
        )
      )) {
        const converted = await Promise.all(
          batch
            .slice(0, maxResults - results)
            .map(commit => this.toCommit(commit, includeFiles))
        );
        for (const commit of converted) {
          results += 1;
          yield commit;
        }
        if (results >= maxResults) {
          return;
        }
      }
    } catch (e) {
      if (e instanceof RequestError) {
        if (e.status === 404 || e.status === 409) {
          this.logger.warn(
            `Could not find commits for branch ${targetBranch} - it likely does not exist.`
          );
          return;
        }
        throw new GitHubAPIError(e);
      }
      throw e;
    }
  }

  private async toCommit(
    data: ForgejoCommit,
    includeFiles: boolean
  ): Promise<Commit> {
    const commit: Commit = {
      sha: data.sha,
      message: data.commit.message.replace(/\s+$/, ''),
      author: data.commit.author
        ? {
            name: data.commit.author.name || 'Unknown',
            email: data.commit.author.email,
            username: data.author?.login,
          }
        : undefined,
    };
    if (includeFiles) {
      commit.files = (data.files ?? []).map(file => file.filename);
    }
    const pullRequest = await this.getCommitPullRequest(data.sha);
    if (pullRequest) {
      commit.pullRequest = {
        ...this.toPullRequest(pullRequest, commit.files ?? []),
        sha: data.sha,
        mergeCommitOid: pullRequest.merge_commit_sha || undefined,
      };
    }
    return commit;
  }

  /**
   * Find the pull request whose merge commit is the given commit.
   */
  private async getCommitPullRequest(
    sha: string
  ): Promise<ForgejoPullRequest | undefined> {
    try {
      const {data} = await this.call<ForgejoPullRequest>(
        'GET',
        this.repoPath('commits', encodePath(sha), 'pull')
      );
      return data;
    } catch (e) {
      if (e instanceof RequestError && e.status === 404) {
        return undefined;
      }
      throw e;
    }
  }

  private toPullRequest(
    pullRequest: ForgejoPullRequest,
    files: string[] = []
  ): PullRequest {
    return {
      headBranchName: branchName(pullRequest.head),
      baseBranchName: branchName(pullRequest.base),
      number: pullRequest.number,
      // strip the draft marker so that release-please can parse the title
      title: pullRequest.draft
        ? pullRequest.title.replace(this.workInProgressRegex, '')
        : pullRequest.title,
      body: pullRequest.body || '',
      labels: (pullRequest.labels ?? [])
        .map(label => label.name)
        .filter(name => !!name),
      files,
      sha: pullRequest.merge_commit_sha || undefined,
    };
  }

  /**
   * Iterate through pull requests with a max number of results scanned.
   *
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} status The status of the pull request. Defaults to 'MERGED'.
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
    let results = 0;
    for await (const pullRequest of this.paginate<ForgejoPullRequest>(
      this.repoPath('pulls'),
      {
        state: status === 'OPEN' ? 'open' : 'closed',
        base: targetBranch,
        sort: 'recentupdate',
      }
    )) {
      if (branchName(pullRequest.base) !== targetBranch) {
        continue;
      }
      // closed pull requests include merged ones - only keep merged ones
      // when requested
      if (status === 'MERGED' && !pullRequest.merged) {
        continue;
      }
      const files = includeFiles
        ? await this.getPullRequestFiles(pullRequest.number)
        : [];
      results += 1;
      yield this.toPullRequest(pullRequest, files);
      if (results >= maxResults) {
        return;
      }
    }
  }

  private async getPullRequestFiles(number: number): Promise<string[]> {
    const files: string[] = [];
    for await (const file of this.paginate<{filename: string}>(
      this.repoPath('pulls', `${number}`, 'files')
    )) {
      files.push(file.filename);
    }
    return files;
  }

  /**
   * Iterate through releases with a max number of results scanned. Releases
   * without an existing tag (e.g. drafts) are skipped.
   *
   * @param {ReleaseIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {ScmRelease}
   * @throws {GitHubAPIError} on an API error
   */
  async *releaseIterator(
    options: ScmReleaseIteratorOptions = {}
  ): AsyncGenerator<ScmRelease, void, void> {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    let results = 0;
    for await (const release of this.paginate<ForgejoRelease>(
      this.repoPath('releases')
    )) {
      const sha = await this.getTagSha(release.tag_name);
      if (!sha) {
        this.logger.debug(
          `Skipping release ${release.tag_name}: tag does not exist`
        );
        continue;
      }
      results += 1;
      yield {
        ...this.toRelease(release),
        sha,
      };
      if (results >= maxResults) {
        return;
      }
    }
  }

  private toRelease(release: ForgejoRelease): ScmRelease {
    return {
      id: release.id,
      name: release.name || undefined,
      tagName: release.tag_name,
      sha: release.target_commitish,
      notes: release.body || undefined,
      url: release.html_url,
      draft: release.draft,
      uploadUrl: release.upload_url,
    };
  }

  private async getTagSha(tagName: string): Promise<string | undefined> {
    if (this.tagShaCache.has(tagName)) {
      return this.tagShaCache.get(tagName);
    }
    let sha: string | undefined;
    try {
      const {data} = await this.call<ForgejoTag>(
        'GET',
        this.repoPath('tags', encodePath(tagName))
      );
      sha = data.commit?.sha;
    } catch (e) {
      if (!(e instanceof RequestError && e.status === 404)) {
        throw e;
      }
    }
    this.tagShaCache.set(tagName, sha);
    return sha;
  }

  /**
   * Iterate through tags with a max number of results scanned.
   *
   * @param {TagIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {ScmTag}
   * @throws {GitHubAPIError} on an API error
   */
  async *tagIterator(
    options: ScmTagIteratorOptions = {}
  ): AsyncGenerator<ScmTag, void, void> {
    const maxResults = options.maxResults ?? Number.MAX_SAFE_INTEGER;
    let results = 0;
    for await (const tag of this.paginate<ForgejoTag>(this.repoPath('tags'))) {
      this.tagShaCache.set(tag.name, tag.commit.sha);
      results += 1;
      yield {name: tag.name, sha: tag.commit.sha};
      if (results >= maxResults) {
        return;
      }
    }
  }

  /**
   * Open a pull request. The head branch is (re)created from the target
   * branch with a single commit containing all updates.
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
      options?: ScmCreatePullRequestOptions
    ): Promise<PullRequest> => {
      if (options?.fork) {
        this.logger.warn(
          'Forgejo: opening pull requests from forks is not supported'
        );
      }
      const {operations} = await this.buildFileOperations(
        updates,
        targetBranch
      );
      if (operations.length === 0) {
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
      await this.commitFiles(
        operations,
        targetBranch,
        pullRequest.headBranchName,
        message
      );
      const number = await this.openPullRequest(
        pullRequest.headBranchName,
        targetBranch,
        pullRequest.title,
        pullRequest.body,
        !!options?.draft
      );
      await this.addIssueLabels(pullRequest.labels, number);
      return await this.getPullRequest(number);
    }
  );

  /**
   * Find an open pull request for the head branch or open a new one.
   * Draft pull requests are opened with a work in progress title prefix.
   * @returns {number} The pull request number
   */
  private async openPullRequest(
    headBranchName: string,
    baseBranchName: string,
    title: string,
    body: string,
    draft: boolean
  ): Promise<number> {
    const existing = await this.findOpenPullRequest(
      headBranchName,
      baseBranchName
    );
    if (existing) {
      this.logger.info(
        `Found existing pull request for branch ${headBranchName}: ${existing.html_url}`
      );
      return existing.number;
    }
    try {
      const {data} = await this.call<ForgejoPullRequest>(
        'POST',
        this.repoPath('pulls'),
        {
          head: headBranchName,
          base: baseBranchName,
          title: draft ? `${this.workInProgressPrefix} ${title}` : title,
          body,
        }
      );
      this.logger.info(
        `Successfully opened pull request available at url: ${data.html_url}.`
      );
      if (draft && data.draft === false) {
        this.logger.warn(
          `Forgejo did not mark pull request ${
            data.number
          } as draft. ${this.workInProgressHint()}`
        );
      }
      return data.number;
    } catch (e) {
      if (e instanceof RequestError && e.status === 409) {
        const conflicting = await this.findOpenPullRequest(
          headBranchName,
          baseBranchName
        );
        if (conflicting) {
          return conflicting.number;
        }
      }
      throw e;
    }
  }

  private async findOpenPullRequest(
    headBranchName: string,
    baseBranchName: string
  ): Promise<ForgejoPullRequest | undefined> {
    for await (const pullRequest of this.paginate<ForgejoPullRequest>(
      this.repoPath('pulls'),
      {state: 'open', base: baseBranchName}
    )) {
      if (
        branchName(pullRequest.head) === headBranchName &&
        branchName(pullRequest.base) === baseBranchName &&
        (pullRequest.head.repo_id === undefined ||
          pullRequest.head.repo_id === pullRequest.base.repo_id)
      ) {
        return pullRequest;
      }
    }
    return undefined;
  }

  private workInProgressHint(): string {
    return `The instance's [repository.pull-request].WORK_IN_PROGRESS_PREFIXES must include "${this.workInProgressPrefix}", or set --wip-prefix (action input: wip-prefix) to one of them.`;
  }

  /**
   * Fetch a pull request given the pull number
   * @param {number} number The pull request number
   * @returns {PullRequest}
   */
  getPullRequest = wrapAsync(async (number: number): Promise<PullRequest> => {
    const {data} = await this.call<ForgejoPullRequest>(
      'GET',
      this.repoPath('pulls', `${number}`)
    );
    return this.toPullRequest(data);
  });

  /**
   * Update a pull request's code, title and body.
   * @param {number} number The pull request number
   * @param {ReleasePullRequest} releasePullRequest Pull request data to update
   * @param {string} targetBranch The target branch of the pull request
   * @param {string} options.signoffUser Optional. Commit signoff message
   * @param {PullRequestOverflowHandler} options.pullRequestOverflowHandler Optional.
   *   Handles extra large pull request body messages.
   */
  updatePullRequest = wrapAsync(
    async (
      number: number,
      releasePullRequest: ReleasePullRequest,
      targetBranch: string,
      options?: ScmUpdatePullRequestOptions
    ): Promise<PullRequest> => {
      if (options?.fork) {
        this.logger.warn(
          'Forgejo: opening pull requests from forks is not supported'
        );
      }
      const {operations} = await this.buildFileOperations(
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
      if (operations.length > 0) {
        await this.commitFiles(
          operations,
          targetBranch,
          releasePullRequest.headRefName,
          message
        );
      } else {
        this.logger.warn(
          `no code changes detected, not updating branch ${releasePullRequest.headRefName}`
        );
      }
      // Keep the draft state: a pull request marked as ready (work in
      // progress prefix removed) stays ready, a draft keeps its prefix.
      const {data: current} = await this.call<ForgejoPullRequest>(
        'GET',
        this.repoPath('pulls', `${number}`)
      );
      const workInProgressPrefix = current.draft
        ? current.title.match(this.workInProgressRegex)?.[0] ??
          `${this.workInProgressPrefix} `
        : '';
      const {data} = await this.call<ForgejoPullRequest>(
        'PATCH',
        this.repoPath('pulls', `${number}`),
        {title: `${workInProgressPrefix}${title}`, body, state: 'open'}
      );
      if (current.draft && data.draft === false) {
        this.logger.warn(
          `Pull request ${number} is no longer a draft. ${this.workInProgressHint()}`
        );
      }
      return this.toPullRequest(data);
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
  ): Promise<ScmChangeSet> {
    return (await this.buildFileOperations(updates, defaultBranch)).changes;
  }

  /**
   * Build the changeset and the equivalent Forgejo file operations. Updates
   * that do not change a file's content are not included as operations.
   */
  private async buildFileOperations(
    updates: Update[],
    branch: string
  ): Promise<{changes: ScmChangeSet; operations: ChangeFileOperation[]}> {
    // Sometimes multiple updates are proposed for the same file,
    // such as when the manifest file is additionally changed by the
    // node-workspace plugin. We need to merge these updates.
    const mergedUpdates = mergeUpdates(updates);
    const changes: ScmChangeSet = new Map();
    const operations: ChangeFileOperation[] = [];
    for (const update of mergedUpdates) {
      let content: GitHubFileContents | undefined;
      try {
        content = await this.getFileContentsOnBranch(update.path, branch);
      } catch (err) {
        if (!(err instanceof FileNotFoundError)) throw err;
        // if the file is missing and create = false, just continue
        // to the next update, otherwise create the file.
        if (!update.createIfMissing) {
          this.logger.warn(`file ${update.path} did not exist`);
          continue;
        }
      }
      const updatedContent = update.updater.updateContent(
        content?.parsedContent,
        this.logger
      );
      if (!updatedContent) {
        continue;
      }
      changes.set(update.path, {
        content: updatedContent,
        originalContent: content?.parsedContent ?? null,
        mode: (content?.mode || DEFAULT_FILE_MODE) as ScmFileDiff['mode'],
      });
      if (content && updatedContent === content.parsedContent) {
        continue;
      }
      operations.push({
        operation: content ? 'update' : 'create',
        path: update.path,
        content: Buffer.from(updatedContent, 'utf8').toString('base64'),
        sha: content?.sha,
      });
    }
    return {changes, operations};
  }

  /**
   * Create a single commit with all file operations on `headBranchName`,
   * (re)creating it from `baseBranchName`. An existing head branch is
   * force-overwritten.
   */
  private async commitFiles(
    operations: ChangeFileOperation[],
    baseBranchName: string,
    headBranchName: string,
    message: string
  ): Promise<ForgejoFilesResponse> {
    this.logger.debug(
      `Committing ${operations.length} file(s) to ${headBranchName} based on ${baseBranchName}`
    );
    try {
      const {data} = await this.call<ForgejoFilesResponse>(
        'POST',
        this.repoPath('contents'),
        {
          branch: baseBranchName,
          new_branch: headBranchName,
          force_overwrite_new_branch: true,
          message,
          files: operations,
        }
      );
      this.invalidateBranchCache(headBranchName);
      return data;
    } catch (e) {
      if (e instanceof RequestError && e.status === 422) {
        const version = await this.getServerMajorVersion();
        if (version !== undefined && version < MIN_FORGEJO_VERSION) {
          throw new ConfigurationError(
            `Forgejo v${version} cannot overwrite the existing branch ${headBranchName}. Forgejo v${MIN_FORGEJO_VERSION} or newer is required.`,
            'core',
            `${this.repository.owner}/${this.repository.repo}`
          );
        }
      }
      throw e;
    }
  }

  private invalidateBranchCache(branch: string) {
    const prefix = fileCacheKey(branch, '');
    for (const key of [...this.fileCache.keys()]) {
      if (key.startsWith(prefix)) {
        this.fileCache.delete(key);
      }
    }
  }

  private async getServerMajorVersion(): Promise<number | undefined> {
    try {
      const {data} = await this.call<{version: string}>('GET', '/version');
      const major = parseInt(data.version, 10);
      return isNaN(major) ? undefined : major;
    } catch (e) {
      this.logger.debug(`Unable to determine Forgejo version: ${e}`);
      return undefined;
    }
  }

  /**
   * Create a release
   *
   * @param {Release} release Release parameters
   * @param {ReleaseOptions} options Release option parameters
   * @throws {DuplicateReleaseError} if the release tag already exists
   * @throws {GitHubAPIError} on other API errors
   */
  createRelease = wrapAsync(
    async (
      release: Release,
      options: ScmReleaseOptions = {}
    ): Promise<ScmRelease> => {
      const tagName = release.tag.toString();
      if (options.forceTag) {
        try {
          await this.call('POST', this.repoPath('tags'), {
            tag_name: tagName,
            target: release.sha,
          });
        } catch (e) {
          // ignore if tag already exists
          if (
            e instanceof RequestError &&
            (e.status === 409 || e.status === 422)
          ) {
            this.logger.debug(
              `Tag ${tagName} already exists, skipping tag creation`
            );
          } else {
            throw e;
          }
        }
      }
      try {
        const {data} = await this.call<ForgejoRelease>(
          'POST',
          this.repoPath('releases'),
          {
            tag_name: tagName,
            target_commitish: release.sha,
            name: release.name,
            body: release.notes,
            draft: !!options.draft,
            prerelease: !!options.prerelease,
          }
        );
        return this.toRelease(data);
      } catch (e) {
        if (e instanceof RequestError && e.status === 409) {
          throw new DuplicateReleaseError(e, tagName);
        }
        throw e;
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
      this.logger.debug(`adding comment to issue/pull ${number}`);
      const {data} = await this.call<{html_url: string}>(
        'POST',
        this.repoPath('issues', `${number}`, 'comments'),
        {body: comment}
      );
      return data.html_url;
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
      const labelIds = await this.getLabelIds();
      await Promise.all(
        labels.map(async label => {
          const id = labelIds.get(label);
          if (id === undefined) {
            return;
          }
          try {
            await this.call(
              'DELETE',
              this.repoPath('issues', `${number}`, 'labels', `${id}`)
            );
          } catch (e) {
            if (
              !(
                e instanceof RequestError &&
                (e.status === 404 || e.status === 422)
              )
            ) {
              throw e;
            }
          }
        })
      );
    }
  );

  /**
   * Adds labels to an issue/pull request. Missing repository labels are
   * created.
   *
   * @param {string[]} labels The labels to add.
   * @param {number} number The issue/pull request number.
   */
  addIssueLabels = wrapAsync(
    async (labels: string[], number: number): Promise<void> => {
      if (labels.length === 0) {
        return;
      }
      this.logger.debug(`adding labels: ${labels} to issue/pull ${number}`);
      const ids = await this.ensureLabels(labels);
      await this.call('POST', this.repoPath('issues', `${number}`, 'labels'), {
        labels: ids,
      });
    }
  );

  /**
   * Fetch all labels available to the repository (including organization
   * labels) indexed by name.
   */
  private async getLabelIds(): Promise<Map<string, number>> {
    if (this.labelCache) {
      return this.labelCache;
    }
    const labels = new Map<string, number>();
    for await (const label of this.paginate<ForgejoLabel>(
      this.repoPath('labels')
    )) {
      labels.set(label.name, label.id);
    }
    try {
      for await (const label of this.paginate<ForgejoLabel>(
        `/orgs/${encodePath(this.repository.owner)}/labels`
      )) {
        if (!labels.has(label.name)) {
          labels.set(label.name, label.id);
        }
      }
    } catch (e) {
      // the owner is a user rather than an organization, or the token
      // cannot read organization labels
      if (
        !(e instanceof RequestError && (e.status === 404 || e.status === 403))
      ) {
        throw e;
      }
    }
    this.labelCache = labels;
    return labels;
  }

  /**
   * Resolve label names to ids, creating missing repository labels.
   */
  private async ensureLabels(names: string[]): Promise<number[]> {
    const labelIds = await this.getLabelIds();
    const ids: number[] = [];
    for (const name of new Set(names)) {
      let id = labelIds.get(name);
      if (id === undefined) {
        this.logger.info(`Creating missing label: ${name}`);
        const {data} = await this.call<ForgejoLabel>(
          'POST',
          this.repoPath('labels'),
          {name, color: DEFAULT_LABEL_COLOR}
        );
        id = data.id;
        labelIds.set(name, id);
      }
      ids.push(id);
    }
    return ids;
  }

  /**
   * Forgejo cannot generate release notes.
   * @throws {ConfigurationError} always
   */
  async generateReleaseNotes(
    _tagName: string,
    _targetCommitish: string,
    _previousTag?: string
  ): Promise<string> {
    throw new ConfigurationError(
      'Forgejo does not support generated release notes. Use a different `changelog-type`.',
      'core',
      `${this.repository.owner}/${this.repository.repo}`
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
  createFileOnNewBranch = wrapAsync(
    async (
      filename: string,
      contents: string,
      newBranchName: string,
      baseBranchName: string
    ): Promise<string> => {
      let existing: GitHubFileContents | undefined;
      try {
        existing = await this.getFileContentsOnBranch(filename, baseBranchName);
      } catch (e) {
        if (!(e instanceof FileNotFoundError)) throw e;
      }
      const data = await this.commitFiles(
        [
          {
            operation: existing ? 'update' : 'create',
            path: filename,
            content: Buffer.from(contents, 'utf8').toString('base64'),
            sha: existing?.sha,
          },
        ],
        baseBranchName,
        newBranchName,
        'Saving release notes'
      );
      return (
        data.files?.[0]?.html_url ||
        `${this.webUrl}/${encodePath(this.repository.owner)}/${encodePath(
          this.repository.repo
        )}/src/branch/${encodePath(newBranchName)}/${encodePath(filename)}`
      );
    }
  );
}

/**
 * The branch name of a pull request head/base. Forgejo reports the head
 * `ref` as `refs/pull/<index>/head` once the head branch has been deleted
 * (e.g. after merging), while `label` keeps the branch name.
 */
function branchName(branch: ForgejoBranchInfo): string {
  return branch.label || branch.ref;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * URI-encode each segment of a slash separated path.
 */
function encodePath(value: string): string {
  return value.split('/').map(encodeURIComponent).join('/');
}

function fileCacheKey(branch: string, path: string): string {
  return `${branch}:${path}`;
}

/**
 * Group the items of an async iterable into arrays of up to `size` items.
 */
async function* chunk<T>(
  items: AsyncIterable<T>,
  size: number
): AsyncGenerator<T[], void, void> {
  let batch: T[] = [];
  for await (const item of items) {
    batch.push(item);
    if (batch.length >= size) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) {
    yield batch;
  }
}
