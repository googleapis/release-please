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
import * as os from 'os';
import * as path from 'path';
import * as child_process from 'child_process';

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
import {MAX_ISSUE_BODY_SIZE} from './github-api';
import {GiteaApi, GiteaApiCreateOptions, GiteaPull} from './gitea-api';
import {globToRegex} from './local-github';
import {signoffCommitMessage} from './util/signoff-commit-message';
import {Logger} from './util/code-suggester/types';
import {logger as defaultLogger} from './util/logger';

/** Local ref namespace holding the remote's branches. */
const REMOTE_HEADS = 'refs/release-please/heads';
const DEFAULT_BATCH_SIZE = 100;
const EMPTY_SHA = '0000000000000000000000000000000000000000';

export interface GiteaCreateOptions extends GiteaApiCreateOptions {
  /**
   * Git URL to clone/push. Defaults to the repository's `clone_url` as
   * reported by the Gitea API.
   */
  cloneUrl?: string;
  /**
   * Use (or create) a clone at this path instead of a temporary directory.
   * The working tree and checked out branch are never modified.
   */
  localRepoPath?: string;
  /** Depth for clone and fetch. Defaults to full history. */
  cloneDepth?: number;
  /** Author/committer name for release commits. */
  gitAuthorName?: string;
  /** Author/committer email for release commits. */
  gitAuthorEmail?: string;
}

interface GitOptions {
  input?: string | Buffer;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}

/**
 * Runs git commands against a clone, passing credentials through
 * environment-provided config so they never appear in argv or on disk.
 */
class GitRunner {
  constructor(
    readonly remoteUrl: string,
    private dir: string,
    private token: string | undefined,
    private logger: Logger
  ) {}

  setDir(dir: string) {
    this.dir = dir;
  }

  private env(extra?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      ...extra,
    };
    if (this.token && /^https?:\/\//i.test(this.remoteUrl)) {
      const key = `http.${new URL(this.remoteUrl).origin}/.extraheader`;
      const auth = Buffer.from(`x-access-token:${this.token}`).toString(
        'base64'
      );
      let n = parseInt(env.GIT_CONFIG_COUNT ?? '0', 10) || 0;
      // an empty value resets headers inherited from other config, such as
      // the one actions/checkout writes into the local repository config
      env[`GIT_CONFIG_KEY_${n}`] = key;
      env[`GIT_CONFIG_VALUE_${n++}`] = '';
      env[`GIT_CONFIG_KEY_${n}`] = key;
      env[`GIT_CONFIG_VALUE_${n++}`] = `Authorization: Basic ${auth}`;
      env.GIT_CONFIG_COUNT = `${n}`;
    }
    return env;
  }

  runBuffer(args: string[], options: GitOptions = {}): Promise<Buffer> {
    const fullArgs = ['-c', 'core.quotePath=false', ...args];
    this.logger.trace(`git ${args.join(' ')}`);
    return new Promise((resolve, reject) => {
      const child = child_process.spawn('git', fullArgs, {
        cwd: options.cwd ?? this.dir,
        env: this.env(options.env),
        windowsHide: true,
      });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      child.stdout.on('data', d => stdout.push(d));
      child.stderr.on('data', d => stderr.push(d));
      child.on('error', reject);
      child.on('close', code => {
        if (code === 0) {
          resolve(Buffer.concat(stdout));
        } else {
          reject(
            new Error(
              `git ${args[0]} failed (${code}): ${Buffer.concat(stderr)
                .toString()
                .trim()}`
            )
          );
        }
      });
      child.stdin.on('error', () => {
        /* reported through close */
      });
      if (options.input !== undefined) {
        child.stdin.end(options.input);
      } else {
        child.stdin.end();
      }
    });
  }

  async run(args: string[], options: GitOptions = {}): Promise<string> {
    return (await this.runBuffer(args, options)).toString('utf8');
  }

  async tryRun(args: string[], options: GitOptions = {}) {
    try {
      return await this.run(args, options);
    } catch {
      return undefined;
    }
  }
}

function normalizePrefix(prefix?: string): string {
  let normalized = prefix
    ? prefix.replace(/^\.?[/\\]+/, '').replace(/[/\\]+$/, '')
    : '';
  if (normalized === ROOT_PROJECT_PATH) {
    normalized = '';
  }
  return normalized;
}

function normalizePath(file: string): string {
  return file.replace(/\\/g, '/').replace(/^(\.\/|\/)+/, '');
}

/**
 * Extract the pull request number from a merge or squash commit subject.
 *
 * Supports Gitea's default merge message
 * ("Merge pull request 'title' (#12) from branch into main"), squash
 * messages ("title (#12)") and GitHub style merge messages.
 */
export function parsePullRequestNumber(subject: string): number | undefined {
  const match =
    subject.match(/^Merge pull request '.*' \(#(\d+)\) from .+ into .+$/) ??
    subject.match(/^Merge pull request #(\d+) from /) ??
    subject.match(/\s\(#(\d+)\)$/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Gitea implements the Scm interface for Gitea (and Forgejo) servers.
 *
 * Repository contents, history and tags are read from a local git clone.
 * Release branches are built with git plumbing and pushed, so no working
 * tree is ever modified. Pull requests, releases, labels and comments go
 * through the Gitea REST API.
 */
export class Gitea implements Scm {
  readonly repository: Repository;
  readonly api: GiteaApi;
  private git: GitRunner;
  private logger: Logger;
  private cloneDepth?: number;
  private gitAuthorName: string;
  private gitAuthorEmail: string;
  private pullCache = new Map<number, Promise<GiteaPull | undefined>>();
  private warnedFork = false;

  private constructor(
    api: GiteaApi,
    git: GitRunner,
    options: {
      logger?: Logger;
      cloneDepth?: number;
      gitAuthorName?: string;
      gitAuthorEmail?: string;
    }
  ) {
    this.api = api;
    this.repository = api.repository;
    this.git = git;
    this.logger = options.logger ?? defaultLogger;
    this.cloneDepth = options.cloneDepth;
    this.gitAuthorName = options.gitAuthorName ?? 'release-please[bot]';
    this.gitAuthorEmail =
      options.gitAuthorEmail ?? 'release-please-bot@noreply.localhost';
  }

  static async create(options: GiteaCreateOptions): Promise<Gitea> {
    const logger = options.logger ?? defaultLogger;
    const api = await GiteaApi.create(options);
    const cloneUrl = options.cloneUrl ?? api.repoInfo.cloneUrl;
    if (!cloneUrl) {
      throw new Error(
        `Could not determine clone URL for ${options.owner}/${options.repo}`
      );
    }
    const depthArgs = options.cloneDepth
      ? ['--depth', `${options.cloneDepth}`]
      : [];

    let dir: string;
    const git = new GitRunner(cloneUrl, process.cwd(), options.token, logger);
    if (options.localRepoPath) {
      dir = path.resolve(options.localRepoPath);
      const isRepo = await git.tryRun(['rev-parse', '--git-dir'], {cwd: dir});
      if (isRepo === undefined) {
        logger.info(`Cloning ${cloneUrl} to ${dir}...`);
        await git.run(['clone', '--bare', ...depthArgs, '--', cloneUrl, dir]);
      } else {
        logger.info(`Using existing local repository at ${dir}...`);
      }
    } else {
      dir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), 'release-please-')
      );
      logger.info(`Cloning ${cloneUrl} to ${dir}...`);
      await git.run(['clone', '--bare', ...depthArgs, '--', cloneUrl, dir]);
    }
    git.setDir(dir);

    // Mirror the remote's branches into a private namespace so we never
    // touch the user's own branches or remotes.
    logger.debug('Fetching branches and tags');
    await git.run([
      'fetch',
      '--force',
      '--tags',
      '--prune',
      ...depthArgs,
      '--',
      cloneUrl,
      `+refs/heads/*:${REMOTE_HEADS}/*`,
    ]);

    return new Gitea(api, git, {
      logger: options.logger,
      cloneDepth: options.cloneDepth,
      gitAuthorName: options.gitAuthorName,
      gitAuthorEmail: options.gitAuthorEmail,
    });
  }

  /**
   * Resolve a branch, tag or SHA to a commit SHA, fetching it from the
   * remote if it is not present locally.
   */
  private async resolveRef(ref: string): Promise<string> {
    const candidates = [`${REMOTE_HEADS}/${ref}`, `refs/tags/${ref}`, ref];
    for (const candidate of candidates) {
      const sha = await this.git.tryRun([
        'rev-parse',
        '--verify',
        '--quiet',
        `${candidate}^{commit}`,
      ]);
      if (sha?.trim()) {
        return sha.trim();
      }
    }
    this.logger.debug(`Ref ${ref} not found locally, fetching from remote`);
    const depthArgs = this.cloneDepth ? ['--depth', `${this.cloneDepth}`] : [];
    const fetched =
      (await this.git.tryRun([
        'fetch',
        '--force',
        ...depthArgs,
        '--',
        this.git.remoteUrl,
        `+refs/heads/${ref}:${REMOTE_HEADS}/${ref}`,
      ])) !== undefined ||
      (await this.git.tryRun([
        'fetch',
        ...depthArgs,
        '--',
        this.git.remoteUrl,
        ref,
      ])) !== undefined;
    if (fetched) {
      for (const candidate of candidates) {
        const sha = await this.git.tryRun([
          'rev-parse',
          '--verify',
          '--quiet',
          `${candidate}^{commit}`,
        ]);
        if (sha?.trim()) {
          return sha.trim();
        }
      }
    }
    throw new Error(`Unable to resolve git ref: ${ref}`);
  }

  async getFileContents(path: string): Promise<GitHubFileContents> {
    return await this.getFileContentsOnBranch(
      path,
      this.repository.defaultBranch
    );
  }

  async getFileContentsOnBranch(
    file: string,
    branch: string
  ): Promise<GitHubFileContents> {
    this.logger.debug(`Fetching file contents for ${file} on ${branch}`);
    const filePath = normalizePath(file);
    const sha = await this.resolveRef(branch);
    const entry = (
      await this.git.run(['ls-tree', '-z', sha, '--', filePath])
    ).split('\0')[0];
    if (!entry) {
      throw new FileNotFoundError(file);
    }
    const [info] = entry.split('\t');
    const [mode, type, objectSha] = info.split(' ');
    if (type !== 'blob') {
      throw new FileNotFoundError(file);
    }
    const contents = await this.git.runBuffer(['cat-file', 'blob', objectSha]);
    return {
      content: contents.toString('base64'),
      parsedContent: contents.toString('utf8'),
      sha: objectSha,
      mode,
    };
  }

  async getFileJson<T>(path: string, branch: string): Promise<T> {
    const content = await this.getFileContentsOnBranch(path, branch);
    return JSON.parse(content.parsedContent);
  }

  /**
   * List all file paths at a ref, relative to the prefix if given.
   */
  private async listFiles(ref: string, prefix?: string): Promise<string[]> {
    const normalizedPrefix = normalizePrefix(prefix);
    const sha = await this.resolveRef(ref);
    const args = ['ls-tree', '-r', '-z', '--name-only', sha];
    if (normalizedPrefix) {
      args.push('--', `${normalizedPrefix}/`);
    }
    const files = (await this.git.run(args)).split('\0').filter(f => !!f);
    if (!normalizedPrefix) {
      return files;
    }
    return files
      .filter(f => f.startsWith(`${normalizedPrefix}/`))
      .map(f => f.slice(normalizedPrefix.length + 1));
  }

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

  async findFilesByFilenameAndRef(
    filename: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    return (await this.listFiles(ref, prefix)).filter(
      f => path.posix.basename(f) === filename
    );
  }

  async findFilesByGlob(glob: string, prefix?: string): Promise<string[]> {
    return this.findFilesByGlobAndRef(
      glob,
      this.repository.defaultBranch,
      prefix
    );
  }

  async findFilesByGlobAndRef(
    glob: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    const files = await this.listFiles(ref, prefix);
    const dirs = new Set<string>();
    for (const file of files) {
      let dir = path.posix.dirname(file);
      while (dir !== '.' && dir !== '/') {
        dirs.add(dir);
        dir = path.posix.dirname(dir);
      }
    }
    const regex = globToRegex(glob);
    return [...files, ...dirs].filter(p => regex.test(p));
  }

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

  async findFilesByExtensionAndRef(
    extension: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    return (await this.listFiles(ref, prefix)).filter(f =>
      f.endsWith(`.${extension}`)
    );
  }

  async commitsSince(
    targetBranch: string,
    filter: (commit: Commit) => boolean,
    options?: ScmCommitIteratorOptions
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

  private getCachedPull(number: number): Promise<GiteaPull | undefined> {
    let pull = this.pullCache.get(number);
    if (!pull) {
      pull = this.api.findPull(number);
      this.pullCache.set(number, pull);
    }
    return pull;
  }

  /**
   * Iterate through the branch history, newest first. Commits that merged a
   * pull request (merge or squash) carry that pull request's details.
   */
  async *mergeCommitIterator(
    targetBranch: string,
    options?: ScmCommitIteratorOptions
  ): AsyncGenerator<Commit, void, void> {
    const backfillFiles = options?.backfillFiles ?? true;
    const maxResults = options?.maxResults ?? Number.MAX_SAFE_INTEGER;
    const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
    const head = await this.resolveRef(targetBranch);
    const format = '%x1e%H%x1f%P%x1f%an%x1f%ae%x1f%B%x1f';

    let yielded = 0;
    for (let skip = 0; yielded < maxResults; skip += batchSize) {
      const args = [
        'log',
        `--pretty=format:${format}`,
        `--skip=${skip}`,
        `--max-count=${batchSize}`,
      ];
      if (backfillFiles) {
        args.push('--name-only');
      }
      args.push(head, '--');
      const output = await this.git.run(args);
      const blocks = output.split('\x1e').filter(b => b.trim());
      if (blocks.length === 0) {
        return;
      }
      for (const block of blocks) {
        const [sha, parents, authorName, authorEmail, body, fileBlock] =
          block.split('\x1f');
        const message = body.trim();
        let files: string[] | undefined = backfillFiles
          ? (fileBlock ?? '')
              .split('\n')
              .map(f => f.trim())
              .filter(f => !!f)
          : undefined;

        const commit: Commit = {
          sha: sha.trim(),
          message,
          files,
          author: {name: authorName, email: authorEmail},
        };

        const subject = message.split('\n')[0].trim();
        const prNumber = parsePullRequestNumber(subject);
        if (prNumber) {
          const pull = await this.getCachedPull(prNumber);
          if (pull?.merged && pull.merge_commit_sha === commit.sha) {
            const parentShas = parents
              .trim()
              .split(' ')
              .filter(p => !!p);
            if (backfillFiles && parentShas.length > 1) {
              // merge commits list no files; diff against the first parent
              files = (
                await this.git.run([
                  'diff',
                  '--name-only',
                  '-z',
                  parentShas[0],
                  commit.sha,
                ])
              )
                .split('\0')
                .filter(f => !!f);
              commit.files = files;
            }
            commit.pullRequest = {
              ...GiteaApi.toPullRequest(pull, files ?? []),
              sha: commit.sha,
            };
          }
        }

        yield commit;
        if (++yielded >= maxResults) {
          return;
        }
      }
      if (blocks.length < batchSize) {
        return;
      }
    }
  }

  async *pullRequestIterator(
    targetBranch: string,
    status?: 'OPEN' | 'CLOSED' | 'MERGED',
    maxResults?: number,
    includeFiles?: boolean
  ): AsyncGenerator<PullRequest, void, void> {
    yield* this.api.pullRequestIterator(
      targetBranch,
      status,
      maxResults,
      includeFiles
    );
  }

  async *releaseIterator(
    options?: ScmReleaseIteratorOptions
  ): AsyncGenerator<ScmRelease, void, void> {
    const maxResults = options?.maxResults ?? Number.MAX_SAFE_INTEGER;
    let results = 0;
    for await (const release of this.api.releaseIterator()) {
      if (results >= maxResults) {
        return;
      }
      const sha =
        (
          await this.git.tryRun([
            'rev-parse',
            '--verify',
            '--quiet',
            `refs/tags/${release.tag_name}^{commit}`,
          ])
        )?.trim() || (await this.api.getTagCommitSha(release.tag_name));
      if (!sha) {
        // draft releases may not have a tag yet
        this.logger.debug(`Skipping release without tag: ${release.tag_name}`);
        continue;
      }
      results += 1;
      yield {
        id: release.id,
        name: release.name || undefined,
        tagName: release.tag_name,
        sha,
        notes: release.body,
        url: release.html_url,
        draft: release.draft,
        uploadUrl: release.upload_url,
      };
    }
  }

  async *tagIterator(
    options?: ScmTagIteratorOptions
  ): AsyncGenerator<ScmTag, void, void> {
    const output = await this.git.run([
      'for-each-ref',
      '--sort=-version:refname',
      '--format=%(refname:short)|%(objectname)|%(*objectname)',
      'refs/tags',
    ]);
    const maxResults = options?.maxResults ?? Number.MAX_SAFE_INTEGER;
    let results = 0;
    for (const line of output.split('\n')) {
      if (!line) continue;
      const [name, objectSha, commitSha] = line.split('|');
      const sha = commitSha || objectSha;
      if (sha) {
        yield {name, sha};
        if (++results >= maxResults) break;
      }
    }
  }

  /**
   * Build a commit on top of `baseBranch` containing the changes and force
   * push it to `headBranch`. Uses a temporary index so that no working tree
   * is touched.
   *
   * @returns {string|undefined} the pushed SHA, or undefined if the changes
   *   produced no difference from the base branch.
   */
  private async commitAndPush(
    changes: ScmChangeSet,
    baseBranch: string,
    headBranch: string,
    message: string,
    pushIfUnchanged = false
  ): Promise<string | undefined> {
    const baseSha = await this.resolveRef(baseBranch);
    const tmpDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'release-please-index-')
    );
    const env = {GIT_INDEX_FILE: path.join(tmpDir, 'index')};
    try {
      await this.git.run(['read-tree', baseSha], {env});
      const indexInfo: string[] = [];
      for (const [file, diff] of changes) {
        const filePath = normalizePath(file);
        if (diff.content === null) {
          indexInfo.push(`0 ${EMPTY_SHA}\t${filePath}`);
          continue;
        }
        const blob = (
          await this.git.run(['hash-object', '-w', '--no-filters', '--stdin'], {
            input: diff.content,
          })
        ).trim();
        indexInfo.push(`${diff.mode} ${blob}\t${filePath}`);
      }
      if (indexInfo.length > 0) {
        await this.git.run(['update-index', '--index-info'], {
          env,
          input: indexInfo.join('\n') + '\n',
        });
      }
      const tree = (await this.git.run(['write-tree'], {env})).trim();
      const baseTree = (
        await this.git.run(['rev-parse', `${baseSha}^{tree}`])
      ).trim();

      let sha: string;
      if (tree === baseTree) {
        if (!pushIfUnchanged) {
          return undefined;
        }
        sha = baseSha;
      } else {
        sha = (
          await this.git.run(['commit-tree', tree, '-p', baseSha, '-F', '-'], {
            input: message,
            env: {
              GIT_AUTHOR_NAME: this.gitAuthorName,
              GIT_AUTHOR_EMAIL: this.gitAuthorEmail,
              GIT_COMMITTER_NAME: this.gitAuthorName,
              GIT_COMMITTER_EMAIL: this.gitAuthorEmail,
            },
          })
        ).trim();
      }
      this.logger.info(`Pushing ${sha} to branch ${headBranch}`);
      await this.git.run([
        'push',
        '--force',
        '--',
        this.git.remoteUrl,
        `${sha}:refs/heads/${headBranch}`,
      ]);
      await this.git.run(['update-ref', `${REMOTE_HEADS}/${headBranch}`, sha]);
      return sha;
    } finally {
      await fs.promises.rm(tmpDir, {recursive: true, force: true});
    }
  }

  private warnFork(fork?: boolean) {
    if (fork && !this.warnedFork) {
      this.warnedFork = true;
      this.logger.warn(
        'Opening pull requests from a fork is not supported for Gitea; pushing to the repository instead'
      );
    }
  }

  async createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: ScmCreatePullRequestOptions
  ): Promise<PullRequest> {
    this.warnFork(options?.fork);
    const changes = await this.buildChangeSet(updates, targetBranch);
    const pushed =
      changes.size > 0
        ? await this.commitAndPush(
            changes,
            targetBranch,
            pullRequest.headBranchName,
            message
          )
        : undefined;
    if (!pushed) {
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
    const existing = await this.api.findOpenPullRequest(
      pullRequest.headBranchName,
      targetBranch
    );
    if (existing) {
      this.logger.info(
        `Found existing pull request #${existing.number} for ${pullRequest.headBranchName}`
      );
      return GiteaApi.toPullRequest(existing);
    }
    return await this.api.createPullRequest(pullRequest, targetBranch, {
      draft: options?.draft,
    });
  }

  async updatePullRequest(
    number: number,
    pullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: ScmUpdatePullRequestOptions
  ): Promise<PullRequest> {
    this.warnFork(options?.fork);
    const changes = await this.buildChangeSet(
      pullRequest.updates,
      targetBranch
    );
    let message = pullRequest.title.toString();
    if (options?.signoffUser) {
      message = signoffCommitMessage(message, options.signoffUser);
    }
    const title = pullRequest.title.toString();
    const body = (
      options?.pullRequestOverflowHandler
        ? await options.pullRequestOverflowHandler.handleOverflow(pullRequest)
        : pullRequest.body
    )
      .toString()
      .slice(0, MAX_ISSUE_BODY_SIZE);
    if (changes.size > 0) {
      await this.commitAndPush(
        changes,
        targetBranch,
        pullRequest.headRefName,
        message
      );
    }
    return await this.api.updatePullRequest(number, title, body);
  }

  async getPullRequest(number: number): Promise<PullRequest> {
    return await this.api.getPullRequest(number);
  }

  async createRelease(
    release: Release,
    options?: ScmReleaseOptions
  ): Promise<ScmRelease> {
    return await this.api.createRelease(release, options);
  }

  async commentOnIssue(comment: string, number: number): Promise<string> {
    return await this.api.commentOnIssue(comment, number);
  }

  async removeIssueLabels(labels: string[], number: number): Promise<void> {
    return await this.api.removeIssueLabels(labels, number);
  }

  async addIssueLabels(labels: string[], number: number): Promise<void> {
    return await this.api.addIssueLabels(labels, number);
  }

  async generateReleaseNotes(
    _tagName: string,
    _targetCommitish: string,
    _previousTag?: string
  ): Promise<string> {
    throw new Error(
      "Gitea does not support generating release notes; use the 'default' changelog-type instead of 'github'"
    );
  }

  async createFileOnNewBranch(
    filename: string,
    contents: string,
    newBranchName: string,
    baseBranchName: string
  ): Promise<string> {
    const changes: ScmChangeSet = new Map([
      [
        filename,
        {
          mode: DEFAULT_FILE_MODE as '100644',
          content: contents,
          originalContent: null,
        },
      ],
    ]);
    await this.commitAndPush(
      changes,
      baseBranchName,
      newBranchName,
      'Saving release notes',
      true
    );
    const branch = newBranchName.split('/').map(encodeURIComponent).join('/');
    const file = normalizePath(filename)
      .split('/')
      .map(encodeURIComponent)
      .join('/');
    return `${this.api.repoInfo.htmlUrl}/src/branch/${branch}/${file}`;
  }

  async buildChangeSet(
    updates: Update[],
    defaultBranch: string
  ): Promise<ScmChangeSet> {
    const changes: ScmChangeSet = new Map();
    for (const update of mergeUpdates(updates)) {
      let content: GitHubFileContents | undefined;
      try {
        content = await this.getFileContentsOnBranch(
          update.path,
          defaultBranch
        );
      } catch (err) {
        if (!(err instanceof FileNotFoundError)) throw err;
        if (!update.createIfMissing) {
          this.logger.warn(`file ${update.path} did not exist`);
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
          mode: (content ? content.mode : DEFAULT_FILE_MODE) as '100644',
        });
      }
    }
    return changes;
  }
}
