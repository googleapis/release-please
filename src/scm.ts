// Copyright 2022 Google LLC
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

import {Commit} from './commit';
import {PullRequest} from './pull-request';
import {ReleasePullRequest} from './release-pull-request';
import {Update} from './update';
import {Release} from './release';
import {Repository} from './repository';

export type CommitFilter = (commit: Commit) => boolean;
export interface CommitIteratorOptions {
  maxResults?: number;
  backfillFiles?: boolean;
}

export interface ScmRelease {
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

export interface ReleaseIteratorOptions {
  maxResults?: number;
}

export interface TagIteratorOptions {
  maxResults?: number;
}

export interface FileContents {
  sha: string;
  content: string;
  parsedContent: string;
  mode: string;
}
interface FileDiff {
  readonly mode: '100644' | '100755' | '040000' | '160000' | '120000';
  readonly content: string | null;
  readonly originalContent: string | null;
}
interface FileDiff {
  readonly mode: '100644' | '100755' | '040000' | '160000' | '120000';
  readonly content: string | null;
  readonly originalContent: string | null;
}
export type ChangeSet = Map<string, FileDiff>;

export interface ReleaseOptions {
  draft?: boolean;
  prerelease?: boolean;
}
export interface ScmRelease {
  name?: string;
  tagName: string;
  sha: string;
  notes?: string;
  url: string;
  draft?: boolean;
  uploadUrl?: string;
}

export interface Scm {
  readonly repository: Repository;
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
   * @throws {ScmAPIError} on an API error
   */
  commitsSince(
    targetBranch: string,
    filter: CommitFilter,
    options?: CommitIteratorOptions
  ): Promise<Commit[]>;

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
   * @throws {ScmAPIError} on an API error
   */
  mergeCommitIterator(
    targetBranch: string,
    options?: CommitIteratorOptions
  ): AsyncGenerator<Commit, void, void>;

  /**
   * Get the list of file paths modified in a given commit.
   *
   * @param {string} sha The commit SHA
   * @returns {string[]} File paths
   * @throws {ScmAPIError} on an API error
   */
  getCommitFiles(sha: string): Promise<string[]>;

  /**
   * Iterate through merged pull requests with a max number of results scanned.
   *
   * @param {number} maxResults maxResults - Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {PullRequest}
   * @throws {ScmAPIError} on an API error
   */
  pullRequestIterator(
    targetBranch: string,
    status?: 'OPEN' | 'CLOSED' | 'MERGED',
    maxResults?: number
  ): AsyncGenerator<PullRequest, void, void>;

  /**
   * Iterate through releases with a max number of results scanned.
   *
   * @param {ReleaseIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {GitHubRelease}
   * @throws {ScmAPIError} on an API error
   */
  releaseIterator(
    options?: ReleaseIteratorOptions
  ): AsyncGenerator<ScmRelease, void, void>;

  /**
   * Iterate through tags with a max number of results scanned.
   *
   * @param {TagIteratorOptions} options Query options
   * @param {number} options.maxResults Limit the number of results searched.
   *   Defaults to unlimited.
   * @yields {GitHubTag}
   * @throws {ScmAPIError} on an API error
   */
  tagIterator(options?: TagIteratorOptions): AsyncGenerator<ScmTag, void, void>;

  /**
   * Fetch the contents of a file from the configured branch
   *
   * @param {string} path The path to the file in the repository
   * @returns {FileContents}
   * @throws {ScmAPIError} on other API errors
   */
  getFileContents(path: string): Promise<FileContents>;

  /**
   * Fetch the contents of a file
   *
   * @param {string} path The path to the file in the repository
   * @param {string} branch The branch to fetch from
   * @returns {FileContents}
   * @throws {ScmAPIError} on other API errors
   */
  getFileContentsOnBranch(path: string, branch: string): Promise<FileContents>;

  /**
   * Fetch the parsed contents of a JSON file
   *
   * @param {string} path The path to the file in the repository
   * @param {string} branch The branch to fetch from
   * @returns {T}
   * @throws {ScmAPIError} on other API errors
   */
  getFileJson<T>(path: string, branch: string): Promise<T>;

  /**
   * Returns a list of paths to all files with a given name.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param filename The name of the file to find
   * @param prefix Optional path prefix used to filter results
   * @returns {string[]} List of file paths
   * @throws {ScmAPIError} on an API error
   */
  findFilesByFilename(filename: string, prefix?: string): Promise<string[]>;

  /**
   * Returns a list of paths to all files with a given name.
   *
   * If a prefix is specified, only return paths that match
   * the provided prefix.
   *
   * @param filename The name of the file to find
   * @param ref Git reference to search files in
   * @param prefix Optional path prefix used to filter results
   * @throws {ScmAPIError} on an API error
   */
  findFilesByFilenameAndRef(
    filename: string,
    ref: string,
    prefix?: string
  ): Promise<string[]>;

  /**
   * Open a pull request
   *
   * @param {ReleasePullRequest} releasePullRequest Pull request data to update
   * @param {string} targetBranch The base branch of the pull request
   * @param {GitHubPR} options The pull request options
   * @throws {ScmAPIError} on an API error
   */
  createReleasePullRequest(
    releasePullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: {
      signoffUser?: string;
      fork?: boolean;
      skipLabeling?: boolean;
    }
  ): Promise<PullRequest>;

  /**
   * Open a pull request
   *
   * @param {PullRequest} pullRequest Pull request data to update
   * @param {string} targetBranch The base branch of the pull request
   * @param {string} message The body of the pull request
   * @param {Update[]} updates File updates to apply
   * @param options Options
   */
  createPullRequest(
    pullRequest: PullRequest,
    targetBranch: string,
    message: string,
    updates: Update[],
    options?: {
      fork?: boolean;
      draft?: boolean;
    }
  ): Promise<PullRequest>;

  /**
   * Fetch a pull request given the pull number
   * @param {number} number The pull request number
   * @returns {PullRequest}
   */
  getPullRequest(number: number): Promise<PullRequest>;

  /**
   * Update a pull request's title and body.
   * @param {number} number The pull request number
   * @param {ReleasePullRequest} releasePullRequest Pull request data to update
   * @param {}
   */
  updatePullRequest(
    number: number,
    releasePullRequest: ReleasePullRequest,
    targetBranch: string,
    options?: {
      signoffUser?: string;
      fork?: boolean;
    }
  ): Promise<PullRequest>;

  /**
   * Given a set of proposed updates, build a changeset to suggest.
   *
   * @param {Update[]} updates The proposed updates
   * @param {string} defaultBranch The target branch
   * @return {Changes} The changeset to suggest.
   * @throws {ScmAPIError} on an API error
   */
  buildChangeSet(updates: Update[], defaultBranch: string): Promise<ChangeSet>;

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
   * @throws {ScmAPIError} on an API error
   */
  findFilesByExtensionAndRef(
    extension: string,
    ref: string,
    prefix?: string
  ): Promise<string[]>;

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
   * @throws {ScmAPIError} on an API error
   */
  findFilesByExtension(extension: string, prefix?: string): Promise<string[]>;

  /**
   * Create a GitHub release
   *
   * @param {Release} release Release parameters
   * @param {ReleaseOptions} options Release option parameters
   * @throws {DuplicateReleaseError} if the release tag already exists
   * @throws {ScmAPIError} on other API errors
   */
  createRelease(
    release: Release,
    options?: ReleaseOptions
  ): Promise<ScmRelease>;

  /**
   * Makes a comment on a issue/pull request.
   *
   * @param {string} comment - The body of the comment to post.
   * @param {number} number - The issue or pull request number.
   * @throws {ScmAPIError} on an API error
   */
  commentOnIssue(comment: string, number: number): Promise<string>;

  /**
   * Removes labels from an issue/pull request.
   *
   * @param {string[]} labels The labels to remove.
   * @param {number} number The issue/pull request number.
   */
  removeIssueLabels(labels: string[], number: number): Promise<void>;

  /**
   * Adds label to an issue/pull request.
   *
   * @param {string[]} labels The labels to add.
   * @param {number} number The issue/pull request number.
   */
  addIssueLabels(labels: string[], number: number): Promise<void>;

  /**
   * Generate release notes from GitHub at tag
   * @param {string} tagName Name of new release tag
   * @param {string} targetCommitish Target commitish for new tag
   * @param {string} previousTag Optional. Name of previous tag to analyze commits since
   */ generateReleaseNotes(
    tagName: string,
    targetCommitish: string,
    previousTag?: string
  ): Promise<string>;
}
