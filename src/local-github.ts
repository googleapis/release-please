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

  constructor(repository: Repository) {
    this.repository = repository;
  }

  async getFileContents(path: string): Promise<GitHubFileContents> {
    throw new Error('Method not implemented.');
  }

  async getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    throw new Error('Method not implemented.');
  }

  async getFileJson<T>(path: string, branch: string): Promise<T> {
    throw new Error('Method not implemented.');
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
