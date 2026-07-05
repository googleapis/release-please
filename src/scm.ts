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

import {Repository} from './repository';
import {Commit} from './commit';
import {PullRequest} from './pull-request';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Release} from './release';
import {GitHubFileContents} from '@google-automations/git-file-utils';
import {PullRequestOverflowHandler} from './util/pull-request-overflow-handler';

export interface ScmFileDiff {
  readonly mode: '100644' | '100755' | '040000' | '160000' | '120000';
  readonly content: string | null;
  readonly originalContent: string | null;
}

export type ScmChangeSet = Map<string, ScmFileDiff>;

export interface ScmCommitIteratorOptions {
  maxResults?: number;
  backfillFiles?: boolean;
  batchSize?: number;
}

export interface ScmReleaseIteratorOptions {
  maxResults?: number;
}

export interface ScmTagIteratorOptions {
  maxResults?: number;
}

export interface ScmCreatePullRequestOptions {
  fork?: boolean;
  draft?: boolean;
}

export interface ScmUpdatePullRequestOptions {
  signoffUser?: string;
  fork?: boolean;
  pullRequestOverflowHandler?: PullRequestOverflowHandler;
}

export interface ScmReleaseOptions {
  draft?: boolean;
  prerelease?: boolean;
  forceTag?: boolean;
}

export interface ScmRelease {
  id: number;
  name?: string;
  tagName: string;
  sha: string;
  notes?: string;
  url: string;
  draft?: boolean;
  uploadUrl?: string;
}

export interface ScmTag {
  name: string;
  sha: string;
}

export interface Scm {
  readonly repository: Repository;

  getFileContents(path: string): Promise<GitHubFileContents>;
  getFileContentsOnBranch(
    path: string,
    branch: string
  ): Promise<GitHubFileContents>;
  getFileJson<T>(path: string, branch: string): Promise<T>;

  findFilesByFilename(filename: string, prefix?: string): Promise<string[]>;
  findFilesByFilenameAndRef(
    filename: string,
    ref: string,
    prefix?: string
  ): Promise<string[]>;
  findFilesByGlob(glob: string, prefix?: string): Promise<string[]>;
  findFilesByGlobAndRef(
    glob: string,
    ref: string,
    prefix?: string
  ): Promise<string[]>;
  findFilesByExtension(extension: string, prefix?: string): Promise<string[]>;
  findFilesByExtensionAndRef(
    extension: string,
    ref: string,
    prefix?: string
  ): Promise<string[]>;

  commitsSince(
    targetBranch: string,
    filter: (commit: Commit) => boolean,
    options?: ScmCommitIteratorOptions
  ): Promise<Commit[]>;
  mergeCommitIterator(
    targetBranch: string,
    options?: ScmCommitIteratorOptions
  ): AsyncGenerator<Commit, void, void>;
  pullRequestIterator(
    targetBranch: string,
    status?: 'OPEN' | 'CLOSED' | 'MERGED',
    maxResults?: number,
    includeFiles?: boolean
  ): AsyncGenerator<PullRequest, void, void>;
  releaseIterator(
    options?: ScmReleaseIteratorOptions
  ): AsyncGenerator<ScmRelease, void, void>;
  tagIterator(
    options?: ScmTagIteratorOptions
  ): AsyncGenerator<ScmTag, void, void>;

  createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: ScmCreatePullRequestOptions
  ): Promise<PullRequest>;
  updatePullRequest(
    number: number,
    pullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: ScmUpdatePullRequestOptions
  ): Promise<PullRequest>;
  getPullRequest(number: number): Promise<PullRequest>;

  createRelease(
    release: Release,
    options?: ScmReleaseOptions
  ): Promise<ScmRelease>;
  commentOnIssue(comment: string, number: number): Promise<string>;
  removeIssueLabels(labels: string[], number: number): Promise<void>;
  addIssueLabels(labels: string[], number: number): Promise<void>;

  generateReleaseNotes(
    tagName: string,
    targetCommitish: string,
    previousTag?: string
  ): Promise<string>;
  createFileOnNewBranch(
    filename: string,
    contents: string,
    newBranchName: string,
    baseBranchName: string
  ): Promise<string>;

  buildChangeSet(
    updates: Update[],
    defaultBranch: string
  ): Promise<ScmChangeSet>;
}
