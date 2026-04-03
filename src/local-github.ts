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
import {Commit} from './commit';
import {PullRequest} from './pull-request';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Release} from './release';
import {GitHubFileContents} from '@google-automations/git-file-utils';

/**
 * LocalGitHub implements the Scm interface using a local git clone
 * where possible, and falling back to the GitHub API for other operations.
 */
export class LocalGitHub implements Scm {
  readonly repository: Repository;
  private cloneDir?: string;
  private cloneDepth?: number;

  constructor(repository: Repository, options?: {cloneDepth?: number}) {
    this.repository = repository;
    this.cloneDepth = options?.cloneDepth;
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
    throw new Error('Method not implemented.');
  }

  async findFilesByFilenameAndRef(
    filename: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async findFilesByGlob(glob: string, prefix?: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async findFilesByGlobAndRef(
    glob: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async findFilesByExtension(
    extension: string,
    prefix?: string
  ): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async findFilesByExtensionAndRef(
    extension: string,
    ref: string,
    prefix?: string
  ): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async commitsSince(
    targetBranch: string,
    filter: (commit: Commit) => boolean,
    options?: ScmCommitIteratorOptions
  ): Promise<Commit[]> {
    throw new Error('Method not implemented.');
  }

  async *mergeCommitIterator(
    targetBranch: string,
    options?: ScmCommitIteratorOptions
  ): AsyncGenerator<Commit, void, void> {
    throw new Error('Method not implemented.');
  }

  async *pullRequestIterator(
    targetBranch: string,
    status?: 'OPEN' | 'CLOSED' | 'MERGED',
    maxResults?: number,
    includeFiles?: boolean
  ): AsyncGenerator<PullRequest, void, void> {
    throw new Error('Method not implemented.');
  }

  async *releaseIterator(
    options?: ScmReleaseIteratorOptions
  ): AsyncGenerator<ScmRelease, void, void> {
    throw new Error('Method not implemented.');
  }

  async *tagIterator(
    options?: ScmTagIteratorOptions
  ): AsyncGenerator<ScmTag, void, void> {
    throw new Error('Method not implemented.');
  }

  async createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: ScmCreatePullRequestOptions
  ): Promise<PullRequest> {
    throw new Error('Method not implemented.');
  }

  async updatePullRequest(
    number: number,
    pullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: ScmUpdatePullRequestOptions
  ): Promise<PullRequest> {
    throw new Error('Method not implemented.');
  }

  async getPullRequest(number: number): Promise<PullRequest> {
    throw new Error('Method not implemented.');
  }

  async createRelease(
    release: Release,
    options?: ScmReleaseOptions
  ): Promise<ScmRelease> {
    throw new Error('Method not implemented.');
  }

  async commentOnIssue(comment: string, number: number): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async removeIssueLabels(labels: string[], number: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async addIssueLabels(labels: string[], number: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async generateReleaseNotes(
    tagName: string,
    targetCommitish: string,
    previousTag?: string
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async createFileOnNewBranch(
    filename: string,
    contents: string,
    newBranchName: string,
    baseBranchName: string
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async buildChangeSet(
    updates: Update[],
    defaultBranch: string
  ): Promise<ScmChangeSet> {
    throw new Error('Method not implemented.');
  }
}
