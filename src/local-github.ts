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

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import * as util from 'util';
import * as readline from 'readline';
import {createPullRequest as suggesterCreatePullRequest} from 'code-suggester';

const execFile = util.promisify(child_process.execFile);
const mkdtemp = fs.promises.mkdtemp;

import {
  Scm,
  ScmRelease,
  ScmTag,
  ScmCommitIteratorOptions,
  ScmReleaseIteratorOptions,
  ScmTagIteratorOptions,
  ScmCreatePullRequestOptions,
  ScmUpdatePullRequestOptions,
  ScmReleaseOptions,
  ScmChangeSet,
} from './scm';
import {FileNotFoundError} from './errors';
import {Repository} from './repository';
import {ROOT_PROJECT_PATH} from './manifest';
import {Commit} from './commit';
import {PullRequest} from './pull-request';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Release} from './release';
import {
  GitHubFileContents,
  DEFAULT_FILE_MODE,
} from '@google-automations/git-file-utils';
import {mergeUpdates} from './updaters/composite';
import {
  GitHubApi,
  MAX_ISSUE_BODY_SIZE,
  GitHubCreateOptions,
} from './github-api';
import {Logger} from 'code-suggester/build/src/types';
import {logger as defaultLogger} from './util/logger';

export interface LocalGitHubCreateOptions extends GitHubCreateOptions {
  cloneDepth?: number;
  localRepoPath?: string;
}

/**
 * LocalGitHub implements the Scm interface using a local git clone
 * where possible, and falling back to the GitHub API for other operations.
 */
export class LocalGitHub implements Scm {
  readonly repository: Repository;
  private cloneDir: string;
  private gitHubApi: GitHubApi;
  private logger: Logger;

  constructor(
    repository: Repository,
    gitHubApi: GitHubApi,
    cloneDir: string,
    options?: {logger?: Logger}
  ) {
    this.repository = repository;
    this.gitHubApi = gitHubApi;
    this.cloneDir = cloneDir;
    this.logger = options?.logger ?? defaultLogger;
  }

  static async create(options: LocalGitHubCreateOptions): Promise<LocalGitHub> {
    const gitHubApi = await GitHubApi.create(options);
    const logger = options.logger ?? defaultLogger;

    let repoDir: string;
    if (options.localRepoPath) {
      repoDir = options.localRepoPath;
      let isGitRepo = false;
      try {
        await execFile('git', ['rev-parse', '--is-inside-work-tree'], {
          cwd: repoDir,
        });
        isGitRepo = true;
      } catch (err) {
        isGitRepo = false;
      }

      if (!isGitRepo) {
        logger.info(
          `Path ${repoDir} is not a git clone. Cloning repository...`
        );
        const url = `https://github.com/${gitHubApi.repository.owner}/${gitHubApi.repository.repo}.git`;
        const args = ['clone', '--', url, repoDir];
        if (options.cloneDepth) {
          args.splice(1, 0, '--depth', options.cloneDepth.toString());
        }
        logger.debug(`Executing: git ${args.join(' ')}`);
        await execFile('git', args);
      } else {
        logger.info(`Using existing local repository at ${repoDir}...`);
      }

      const branch = gitHubApi.repository.defaultBranch;
      const fetchArgs = ['fetch', 'origin'];
      if (options.cloneDepth) {
        fetchArgs.push('--depth', options.cloneDepth.toString());
      }
      logger.debug(`Executing: git ${fetchArgs.join(' ')}`);
      await execFile('git', fetchArgs, {cwd: repoDir});

      logger.debug(`Executing: git checkout ${branch}`);
      await execFile('git', ['checkout', branch], {cwd: repoDir});

      logger.debug(`Executing: git reset --hard origin/${branch}`);
      await execFile('git', ['reset', '--hard', `origin/${branch}`], {
        cwd: repoDir,
      });
    } else {
      const tempDir = await mkdtemp(path.join(os.tmpdir(), 'release-please-'));
      logger.info(`Cloning repository to ${tempDir}...`);
      const url = `https://github.com/${gitHubApi.repository.owner}/${gitHubApi.repository.repo}.git`;

      const args = ['clone', '--', url, tempDir];
      if (options.cloneDepth) {
        args.splice(1, 0, '--depth', options.cloneDepth.toString());
      }

      logger.debug(`Executing: git ${args.join(' ')}`);
      await execFile('git', args);
      repoDir = tempDir;
    }

    return new LocalGitHub(gitHubApi.repository, gitHubApi, repoDir, {
      logger: options.logger,
    });
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

  private async execGitStream(
    args: string[],
    callback: (line: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = child_process.spawn('git', args, {cwd: this.cloneDir});
      let stderr = '';
      child.stderr.on('data', data => {
        stderr += data;
      });

      const rl = readline.createInterface({
        input: child.stdout,
        crlfDelay: Infinity,
      });

      rl.on('line', callback);

      child.on('close', code => {
        if (code !== 0) {
          reject(new Error(`Command failed ${code}: ${stderr}`));
        } else {
          resolve();
        }
      });
    });
  }

  private async ensureRef(ref: string): Promise<string> {
    try {
      await execFile('git', ['rev-parse', '--verify', ref], {
        cwd: this.cloneDir,
      });
      return ref;
    } catch (err) {
      this.logger.debug(
        `Ref ${ref} not found locally, trying to fetch from origin...`
      );
      try {
        await execFile('git', ['fetch', 'origin', '--', ref], {
          cwd: this.cloneDir,
        });
        return 'FETCH_HEAD';
      } catch (fetchErr) {
        throw err; // Throw original error if fetch fails
      }
    }
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
    this.logger.debug(
      `Fetching file contents for file ${path} on branch ${branch}`
    );

    const ref = await this.ensureRef(branch);
    const lsTreeResult = await execFile('git', ['ls-tree', ref, path], {
      cwd: this.cloneDir,
    });

    if (!lsTreeResult.stdout.trim()) {
      throw new FileNotFoundError(path);
    }

    const [info] = lsTreeResult.stdout.split('\t');
    const [mode, , sha] = info.split(' ');

    const {stdout} = await execFile('git', ['show', `${ref}:${path}`], {
      cwd: this.cloneDir,
      maxBuffer: 100 * 1024 * 1024,
    });

    return {
      content: Buffer.from(stdout).toString('base64'),
      parsedContent: stdout,
      sha,
      mode,
    };
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
  async findFilesByFilenameAndRef(
    filename: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    this.logger.debug(
      `Looking in local clone for file ${filename} with ref ${ref} and prefix '${prefix}'`
    );

    let normalizedPrefix = prefix
      ? prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '')
      : '';
    if (normalizedPrefix === ROOT_PROJECT_PATH) {
      normalizedPrefix = '';
    }

    const treePath = normalizedPrefix ? `${normalizedPrefix}/` : '.';

    const resolvedRef = await this.ensureRef(ref);
    this.logger.trace(
      `Executing stream: git ls-tree -r --name-only ${resolvedRef} ${treePath}`
    );
    const matchedPaths: string[] = [];
    await this.execGitStream(
      ['ls-tree', '-r', '--name-only', resolvedRef, treePath],
      line => {
        const trimmed = line.trim();
        if (trimmed && path.posix.basename(trimmed) === filename) {
          matchedPaths.push(trimmed);
        }
      }
    );

    if (normalizedPrefix) {
      return matchedPaths
        .map(p => {
          if (p === normalizedPrefix) return '';
          if (p.startsWith(`${normalizedPrefix}/`)) {
            return p.slice(normalizedPrefix.length + 1);
          }
          return p;
        })
        .filter(p => p !== '');
    }
    return matchedPaths;
  }

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
  async findFilesByGlobAndRef(
    glob: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    this.logger.debug(
      `Looking in local clone for file matching glob ${glob} with ref ${ref} and prefix '${prefix}'`
    );

    let normalizedPrefix = prefix
      ? prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '')
      : '';
    if (normalizedPrefix === ROOT_PROJECT_PATH) {
      normalizedPrefix = '';
    }

    const treePath = normalizedPrefix ? `${normalizedPrefix}/` : '.';

    const resolvedRef = await this.ensureRef(ref);
    const files: string[] = [];
    const dirs = new Set<string>();
    await this.execGitStream(
      ['ls-tree', '-r', '--name-only', resolvedRef, treePath],
      line => {
        const trimmed = line.trim();
        if (trimmed) {
          files.push(trimmed);
          let dir = path.posix.dirname(trimmed);
          while (dir !== '.' && dir !== '/') {
            dirs.add(dir);
            dir = path.posix.dirname(dir);
          }
        }
      }
    );

    const allPaths = [...files, ...dirs];

    // Make paths relative to prefix if provided
    let relativePaths = allPaths;
    if (normalizedPrefix) {
      relativePaths = allPaths
        .map(p => {
          if (p === normalizedPrefix) return '';
          if (p.startsWith(`${normalizedPrefix}/`)) {
            return p.slice(normalizedPrefix.length + 1);
          }
          return p;
        })
        .filter(p => p !== '');
    }

    const regex = globToRegex(glob);
    return relativePaths.filter(p => regex.test(p));
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
  async findFilesByExtensionAndRef(
    extension: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    this.logger.debug(
      `Looking in local clone for file matching extension ${extension} with ref ${ref} and prefix '${prefix}'`
    );

    let normalizedPrefix = prefix
      ? prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '')
      : '';
    if (normalizedPrefix === ROOT_PROJECT_PATH) {
      normalizedPrefix = '';
    }

    const treePath = normalizedPrefix ? `${normalizedPrefix}/` : '.';

    const resolvedRef = await this.ensureRef(ref);
    const matchedPaths: string[] = [];
    await this.execGitStream(
      ['ls-tree', '-r', '--name-only', resolvedRef, treePath],
      line => {
        const trimmed = line.trim();
        if (trimmed && trimmed.endsWith(`.${extension}`)) {
          matchedPaths.push(trimmed);
        }
      }
    );

    if (normalizedPrefix) {
      return matchedPaths
        .map(p => {
          if (p === normalizedPrefix) return '';
          if (p.startsWith(`${normalizedPrefix}/`)) {
            return p.slice(normalizedPrefix.length + 1);
          }
          return p;
        })
        .filter(p => p !== '');
    }
    return matchedPaths;
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
    filter: (commit: Commit) => boolean,
    options?: ScmCommitIteratorOptions
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
    options?: ScmCommitIteratorOptions
  ): AsyncGenerator<Commit, void, void> {
    this.logger.debug(
      `Looking in local clone for commits on branch ${targetBranch}`
    );

    const backfillFiles = options?.backfillFiles ?? true;

    let format = '---COMMIT_START---%n%H%n%B';
    if (backfillFiles) {
      format += '%n---FILES_START---';
    }

    const ref = await this.ensureRef(targetBranch);
    const args = ['log', ref, `--pretty=format:${format}`];
    if (backfillFiles) {
      args.push('--name-only');
    }
    if (options?.maxResults) {
      args.push('-n', options.maxResults.toString());
    }

    const {stdout} = await execFile('git', args, {
      cwd: this.cloneDir,
      maxBuffer: 100 * 1024 * 1024,
    });

    const blocks = stdout.split('---COMMIT_START---\n');
    for (const block of blocks) {
      if (!block.trim()) continue;

      let commitInfo = block;
      let files: string[] = [];

      if (backfillFiles) {
        const parts = block.split('\n---FILES_START---\n');
        commitInfo = parts[0];
        if (parts[1]) {
          files = parts[1]
            .split('\n')
            .map((f: string) => f.trim())
            .filter((f: string) => f);
        }
      }

      const lines = commitInfo.split('\n');
      const sha = lines[0].trim();
      const message = lines.slice(1).join('\n').trim();

      if (!sha) continue;

      const commit: Commit = {
        sha,
        message,
        files: backfillFiles ? files : undefined,
      };

      const subject = lines[1] ? lines[1].trim() : '';
      let prNumber: number | undefined;
      let headBranchName = '';

      const squashMatch = subject.match(/\s\(#(\d+)\)$/);
      const mergeMatch = subject.match(/^Merge pull request #(\d+) from (.*)$/);

      if (squashMatch) {
        prNumber = parseInt(squashMatch[1], 10);
      } else if (mergeMatch) {
        prNumber = parseInt(mergeMatch[1], 10);
        headBranchName = mergeMatch[2].trim();
      }

      if (prNumber) {
        commit.pullRequest = {
          sha,
          number: prNumber,
          title: subject.replace(/\s\(#(\d+)\)$/, ''),
          body: message,
          labels: [],
          files: backfillFiles ? files : [],
          baseBranchName: targetBranch,
          headBranchName,
        };
      }

      yield commit;
    }
  }

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
    status?: 'OPEN' | 'CLOSED' | 'MERGED',
    maxResults?: number,
    includeFiles?: boolean
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
  async *releaseIterator(
    options?: ScmReleaseIteratorOptions
  ): AsyncGenerator<ScmRelease, void, void> {
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
  async *tagIterator(
    options?: ScmTagIteratorOptions
  ): AsyncGenerator<ScmTag, void, void> {
    const {stdout} = await execFile(
      'git',
      [
        'for-each-ref',
        '--sort=-version:refname',
        'refs/tags',
        '--format=%(refname:short)|%(objectname)|%(*objectname)',
      ],
      {cwd: this.cloneDir}
    );

    const maxResults = options?.maxResults || Number.MAX_SAFE_INTEGER;
    let results = 0;

    for (const line of stdout.split('\n')) {
      if (!line) continue;
      const [name, objectSha, commitSha] = line.split('|');
      const sha = commitSha || objectSha;
      if (sha) {
        yield {name, sha};
        results++;
        if (results >= maxResults) break;
      }
    }
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
  async createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: ScmCreatePullRequestOptions
  ): Promise<PullRequest> {
    const changes = await this.buildChangeSet(updates, targetBranch);
    const prNumber = await suggesterCreatePullRequest(
      this.gitHubApi.octokit,
      changes,
      {
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
      }
    );
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
    pullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: ScmUpdatePullRequestOptions
  ): Promise<PullRequest> {
    const changes = await this.buildChangeSet(
      pullRequest.updates,
      targetBranch
    );
    const message = pullRequest.title.toString();
    const title = pullRequest.title.toString();
    const body = (
      options?.pullRequestOverflowHandler
        ? await options.pullRequestOverflowHandler.handleOverflow(pullRequest)
        : pullRequest.body
    )
      .toString()
      .slice(0, MAX_ISSUE_BODY_SIZE);

    const prNumber = await suggesterCreatePullRequest(
      this.gitHubApi.octokit,
      changes,
      {
        upstreamOwner: this.repository.owner,
        upstreamRepo: this.repository.repo,
        title,
        branch: pullRequest.headRefName,
        description: body,
        primary: targetBranch,
        force: true,
        fork: options?.fork === false ? false : true,
        message,
        logger: this.logger,
        draft: pullRequest.draft,
      }
    );
    if (prNumber !== number) {
      this.logger.warn(
        `updated code for ${prNumber}, but update requested for ${number}`
      );
    }
    return this.gitHubApi.updatePullRequest(number, title, body);
  }

  async getPullRequest(number: number): Promise<PullRequest> {
    return await this.gitHubApi.getPullRequest(number);
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
    options?: ScmReleaseOptions
  ): Promise<ScmRelease> {
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
        if (!update.createIfMissing) {
          console.warn(`file ${update.path} did not exist`);
          continue;
        }
      }
      const newContents = update.updater.updateContent(
        content ? content.parsedContent : undefined
      );
      if (newContents) {
        changes.set(update.path, {
          content: newContents,
          originalContent: content ? content.parsedContent : null,
          mode: content ? content.mode : DEFAULT_FILE_MODE,
        });
      }
    }
    return changes;
  }
}

function globToRegex(glob: string): RegExp {
  let reg = '';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (i + 1 < glob.length && glob[i + 1] === '*') {
        if (i + 2 < glob.length && glob[i + 2] === '/') {
          reg += '(?:.*\\/)?';
          i += 2;
        } else {
          reg += '.*';
          i++;
        }
      } else {
        reg += '[^/]*';
      }
    } else if (c === '?') {
      reg += '[^/]';
    } else if (
      ['.', '+', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'].includes(c)
    ) {
      reg += '\\' + c;
    } else {
      reg += c;
    }
    i++;
  }
  return new RegExp(`^${reg}$`);
}
