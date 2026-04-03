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

export interface LocalGitHubCreateOptions extends GitHubCreateOptions {
  cloneDepth?: number;
}

/**
 * LocalGitHub implements the Scm interface using a local git clone
 * where possible, and falling back to the GitHub API for other operations.
 */
export class LocalGitHub implements Scm {
  readonly repository: Repository;
  private cloneDir?: string;
  private cloneDepth?: number;
  private apiDelegate: GitHubApiDelegate;

  constructor(
    repository: Repository,
    apiDelegate: GitHubApiDelegate,
    options?: {cloneDepth?: number}
  ) {
    this.repository = repository;
    this.apiDelegate = apiDelegate;
    this.cloneDepth = options?.cloneDepth;
  }

  static async create(options: LocalGitHubCreateOptions): Promise<LocalGitHub> {
    const github = await GitHub.create(options);
    return new LocalGitHub(github.repository, github.getApiDelegate(), {
      cloneDepth: options.cloneDepth,
    });
  }

  private async getCloneDir(): Promise<string> {
    if (this.cloneDir) {
      return this.cloneDir;
    }

    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'release-please-'));
    const url = `https://github.com/${this.repository.owner}/${this.repository.repo}.git`;

    let cloneCmd = `git clone ${url} ${tempDir}`;
    if (this.cloneDepth) {
      cloneCmd = `git clone --depth ${this.cloneDepth} ${url} ${tempDir}`;
    }

    await exec(cloneCmd);
    this.cloneDir = tempDir;
    return tempDir;
  }

  async getFileContents(path: string): Promise<GitHubFileContents> {
    return await this.getFileContentsOnBranch(
      path,
      this.repository.defaultBranch
    );
  }

  async getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    const cloneDir = await this.getCloneDir();

    const lsTreeResult = await exec(`git ls-tree ${branch} ${path}`, {
      cwd: cloneDir,
    });

    if (!lsTreeResult.stdout.trim()) {
      throw new FileNotFoundError(path);
    }

    const [info] = lsTreeResult.stdout.split('\t');
    const [mode, , sha] = info.split(' ');

    const {stdout} = await exec(`git show ${branch}:${path}`, {
      cwd: cloneDir,
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
    const cloneDir = await this.getCloneDir();

    let normalizedPrefix = prefix
      ? prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '')
      : '';
    if (normalizedPrefix === ROOT_PROJECT_PATH) {
      normalizedPrefix = '';
    }

    const treePath = normalizedPrefix ? `${normalizedPrefix}/` : '';

    const {stdout} = await exec(
      `git ls-tree -r --name-only ${ref} ${treePath}`,
      {
        cwd: cloneDir,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const matchedPaths = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        return line && path.posix.basename(line) === filename;
      });

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
    const cloneDir = await this.getCloneDir();

    let normalizedPrefix = prefix
      ? prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '')
      : '';
    if (normalizedPrefix === ROOT_PROJECT_PATH) {
      normalizedPrefix = '';
    }

    const treePath = normalizedPrefix ? `${normalizedPrefix}/` : '';

    // Increase maxBuffer to 10MB to handle large repositories
    const {stdout} = await exec(
      `git ls-tree -r --name-only ${ref} ${treePath}`,
      {
        cwd: cloneDir,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const files = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    // Derive directories
    const dirs = new Set<string>();
    for (const file of files) {
      let dir = path.posix.dirname(file);
      while (dir !== '.' && dir !== '/') {
        dirs.add(dir);
        dir = path.posix.dirname(dir);
      }
    }

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
    const cloneDir = await this.getCloneDir();

    let normalizedPrefix = prefix
      ? prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '')
      : '';
    if (normalizedPrefix === ROOT_PROJECT_PATH) {
      normalizedPrefix = '';
    }

    const treePath = normalizedPrefix ? `${normalizedPrefix}/` : '';

    const {stdout} = await exec(
      `git ls-tree -r --name-only ${ref} ${treePath}`,
      {
        cwd: cloneDir,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const matchedPaths = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        return line && line.endsWith(`.${extension}`);
      });

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
    const cloneDir = await this.getCloneDir();
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
      cwd: cloneDir,
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
    const cloneDir = await this.getCloneDir();
    const {stdout} = await exec(
      'git for-each-ref --sort=-version:refname refs/tags --format="%(refname:short)|%(objectname)|%(*objectname)"',
      {cwd: cloneDir}
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

  async createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: ScmCreatePullRequestOptions
  ): Promise<PullRequest> {
    const changes = await this.buildChangeSet(updates, targetBranch);
    return await this.apiDelegate.createPullRequestFromChanges(
      pullRequest,
      targetBranch,
      message,
      changes,
      options
    );
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
    return await this.apiDelegate.updatePullRequestFromChanges(
      number,
      pullRequest,
      targetBranch,
      changes,
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
          content: Buffer.from(newContents).toString('base64'),
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
