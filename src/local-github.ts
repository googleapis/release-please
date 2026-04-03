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

const exec = util.promisify(child_process.exec);
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
import {GitHubApiDelegate} from './github-api-delegate';
import {GitHub, GitHubCreateOptions} from './github';
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
  private apiDelegate: GitHubApiDelegate;
  private logger: Logger;

  constructor(
    repository: Repository,
    apiDelegate: GitHubApiDelegate,
    cloneDir: string,
    options?: {logger?: Logger}
  ) {
    this.repository = repository;
    this.apiDelegate = apiDelegate;
    this.cloneDir = cloneDir;
    this.logger = options?.logger ?? defaultLogger;
  }

  static async create(options: LocalGitHubCreateOptions): Promise<LocalGitHub> {
    const github = await GitHub.create(options);
    const logger = options.logger ?? defaultLogger;

    let repoDir: string;
    if (options.localRepoPath) {
      repoDir = options.localRepoPath;
      logger.info(`Using existing local repository at ${repoDir}...`);
      const branch = github.repository.defaultBranch;

      logger.debug('Executing: git fetch origin');
      await exec('git fetch origin', {cwd: repoDir});

      logger.debug(`Executing: git checkout ${branch}`);
      await exec(`git checkout ${branch}`, {cwd: repoDir});

      logger.debug(`Executing: git reset --hard origin/${branch}`);
      await exec(`git reset --hard origin/${branch}`, {cwd: repoDir});
    } else {
      const tempDir = await mkdtemp(path.join(os.tmpdir(), 'release-please-'));
      logger.info(`Cloning repository to ${tempDir}...`);
      const url = `https://github.com/${github.repository.owner}/${github.repository.repo}.git`;

      let cloneCmd = `git clone ${url} ${tempDir}`;
      if (options.cloneDepth) {
        cloneCmd = `git clone --depth ${options.cloneDepth} ${url} ${tempDir}`;
      }

      logger.debug(`Executing: ${cloneCmd}`);
      await exec(cloneCmd);
      repoDir = tempDir;
    }

    return new LocalGitHub(
      github.repository,
      github.getApiDelegate(),
      repoDir,
      {
        logger: options.logger,
      }
    );
  }

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

  async getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    this.logger.debug(
      `Fetching file contents for file ${path} on branch ${branch}`
    );
    const lsTreeResult = await exec(`git ls-tree ${branch} ${path}`, {
      cwd: this.cloneDir,
    });

    if (!lsTreeResult.stdout.trim()) {
      throw new FileNotFoundError(path);
    }

    const [info] = lsTreeResult.stdout.split('\t');
    const [mode, , sha] = info.split(' ');

    const {stdout} = await exec(`git show ${branch}:${path}`, {
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

    this.logger.trace(
      `Executing stream: git ls-tree -r --name-only ${ref} ${treePath}`
    );
    const matchedPaths: string[] = [];
    await this.execGitStream(
      ['ls-tree', '-r', '--name-only', ref, treePath],
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

    const files: string[] = [];
    const dirs = new Set<string>();
    await this.execGitStream(
      ['ls-tree', '-r', '--name-only', ref, treePath],
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
    this.logger.debug(
      `Looking in local clone for file matching extension ${extension} with ref ${ref} and prefix '${prefix}'`
    );

    let normalizedPrefix = prefix
      ? prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '')
      : '';
    if (normalizedPrefix === ROOT_PROJECT_PATH) {
      normalizedPrefix = '';
    }

    const treePath = normalizedPrefix ? `${normalizedPrefix}/` : '';

    const matchedPaths: string[] = [];
    await this.execGitStream(
      ['ls-tree', '-r', '--name-only', ref, treePath],
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

    let command = `git log ${targetBranch} --pretty=format:"${format}"`;
    if (backfillFiles) {
      command += ' --name-only';
    }
    if (options?.maxResults) {
      command += ` -n ${options.maxResults}`;
    }

    const {stdout} = await exec(command, {
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
            .map(f => f.trim())
            .filter(f => f);
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

  async *pullRequestIterator(
    targetBranch: string,
    status?: 'OPEN' | 'CLOSED' | 'MERGED',
    maxResults?: number,
    includeFiles?: boolean
  ): AsyncGenerator<PullRequest, void, void> {
    yield* this.apiDelegate.pullRequestIterator(
      targetBranch,
      status,
      maxResults,
      includeFiles
    );
  }

  async *releaseIterator(
    options?: ScmReleaseIteratorOptions
  ): AsyncGenerator<ScmRelease, void, void> {
    yield* this.apiDelegate.releaseIterator(options);
  }

  async *tagIterator(
    options?: ScmTagIteratorOptions
  ): AsyncGenerator<ScmTag, void, void> {
    const {stdout} = await exec(
      'git for-each-ref --sort=-version:refname refs/tags --format="%(refname:short)|%(objectname)|%(*objectname)"',
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

  private async applyEditsAndPush(
    branch: string,
    targetBranch: string,
    message: string,
    changes: ScmChangeSet
  ): Promise<void> {
    this.logger.debug(`Applying edits and pushing to ${branch}`);

    // Checkout/Reset PR branch
    await exec(`git fetch origin ${targetBranch}`, {cwd: this.cloneDir});
    await exec(`git checkout -B ${branch} origin/${targetBranch}`, {
      cwd: this.cloneDir,
    });

    // Write file edits
    for (const [filePath, fileUpdate] of changes.entries()) {
      const fullPath = path.join(this.cloneDir, filePath);
      await fs.promises.mkdir(path.dirname(fullPath), {recursive: true});
      if (fileUpdate.content !== null) {
        await fs.promises.writeFile(fullPath, fileUpdate.content);
      } else {
        await fs.promises.unlink(fullPath).catch(() => {});
      }
      if (fileUpdate.mode) {
        await fs.promises.chmod(fullPath, parseInt(fileUpdate.mode, 8));
      }
    }

    // Commit changes
    const msgFile = path.join(
      os.tmpdir(),
      `release-please-commit-msg-${process.pid}-${Date.now()}`
    );
    await fs.promises.writeFile(msgFile, message);
    await exec('git add .', {cwd: this.cloneDir});

    try {
      await exec(`git commit -F ${msgFile}`, {cwd: this.cloneDir});
    } catch (err) {
      const error = err as {stdout?: string; stderr?: string};
      if (error.stdout && error.stdout.includes('nothing to commit')) {
        this.logger.debug('Nothing to commit');
      } else {
        throw err;
      }
    } finally {
      await fs.promises.unlink(msgFile).catch(() => {});
    }

    // Push transit
    await exec(`git push -f origin ${branch}`, {cwd: this.cloneDir});
  }

  async createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: ScmCreatePullRequestOptions
  ): Promise<PullRequest> {
    const changes = await this.buildChangeSet(updates, targetBranch);
    await this.applyEditsAndPush(
      pullRequest.headBranchName,
      targetBranch,
      message,
      changes
    );
    this.logger.info('Creating pull request via GitHub API...');
    const pullResponseData = (
      await this.apiDelegate.octokit.pulls.create({
        owner: this.repository.owner,
        repo: this.repository.repo,
        title: pullRequest.title,
        head: `${this.repository.owner}:${pullRequest.headBranchName}`,
        base: targetBranch,
        body: pullRequest.body,
        maintainer_can_modify: true,
        draft: !!options?.draft,
      })
    ).data;

    this.logger.info(
      `Successfully opened pull request available at url: ${pullResponseData.html_url}.`
    );
    return await this.apiDelegate.getPullRequest(pullResponseData.number);
  }

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
    await this.applyEditsAndPush(
      pullRequest.headRefName,
      targetBranch,
      message,
      changes
    );
    return await this.apiDelegate.updatePullRequestFromChanges(
      number,
      pullRequest,
      targetBranch,
      new Map(),
      options
    );
  }

  async getPullRequest(number: number): Promise<PullRequest> {
    return await this.apiDelegate.getPullRequest(number);
  }

  async createRelease(
    release: Release,
    options?: ScmReleaseOptions
  ): Promise<ScmRelease> {
    return await this.apiDelegate.createRelease(release, options);
  }

  async commentOnIssue(comment: string, number: number): Promise<string> {
    return await this.apiDelegate.commentOnIssue(comment, number);
  }

  async removeIssueLabels(labels: string[], number: number): Promise<void> {
    return await this.apiDelegate.removeIssueLabels(labels, number);
  }

  async addIssueLabels(labels: string[], number: number): Promise<void> {
    return await this.apiDelegate.addIssueLabels(labels, number);
  }

  async generateReleaseNotes(
    tagName: string,
    targetCommitish: string,
    previousTag?: string
  ): Promise<string> {
    return await this.apiDelegate.generateReleaseNotes(
      tagName,
      targetCommitish,
      previousTag
    );
  }

  async createFileOnNewBranch(
    filename: string,
    contents: string,
    newBranchName: string,
    baseBranchName: string
  ): Promise<string> {
    return await this.apiDelegate.createFileOnNewBranch(
      filename,
      contents,
      newBranchName,
      baseBranchName
    );
  }

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
