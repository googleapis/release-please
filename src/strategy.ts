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

import {ReleasePullRequest} from './release-pull-request';
import {Release} from './release';
import {PullRequest} from './pull-request';
import {Commit} from './commit';
import {VersioningStrategy} from './versioning-strategy';
import {ChangelogNotes} from './changelog-notes';
import {Version} from './version';

export interface BuildReleaseOptions {
  groupPullRequestTitlePattern?: string;
}

export interface BumpReleaseOptions {
  newVersion: Version;
}

/**
 * A strategy is responsible for determining which files are
 * necessary to update in a release pull request.
 */
export interface Strategy {
  readonly changelogNotes: ChangelogNotes;
  readonly path: string;
  readonly versioningStrategy: VersioningStrategy;
  /**
   * Builds a candidate release pull request
   * @param {Commit[]} commits Raw commits to consider for this release.
   * @param {Release} latestRelease Optional. The last release for this
   *   component if available.
   * @param {boolean} draft Optional. Whether or not to create the pull
   *   request as a draft. Defaults to `false`.
   * @param {BumpReleaseOptions} bumpOnlyOptions Optional. Options, that when
   * present, indicate a release should be created even if there are no
   * conventional commits. This is used when a release is required for
   * a dependency update with a workspace plugin.
   * @returns {ReleasePullRequest | undefined} The release pull request to
   *   open for this path/component. Returns undefined if we should not
   *   open a pull request.
   */
  buildReleasePullRequest(
    commits: Commit[],
    latestRelease?: Release,
    draft?: boolean,
    labels?: string[],
    bumpOnlyOptions?: BumpReleaseOptions
  ): Promise<ReleasePullRequest | undefined>;

  /**
   * Given a merged pull request, build the candidate release.
   * @param {PullRequest} mergedPullRequest The merged release pull request.
   * @returns {Release} The candidate release.
   * @deprecated Use buildReleases() instead.
   */
  buildRelease(
    mergedPullRequest: PullRequest,
    options?: BuildReleaseOptions
  ): Promise<Release | undefined>;

  /**
   * Given a merged pull request, build the candidate releases.
   * @param {PullRequest} mergedPullRequest The merged release pull request.
   * @returns {Release} The candidate release.
   */
  buildReleases(
    mergedPullRequest: PullRequest,
    options?: BuildReleaseOptions
  ): Promise<Release[]>;

  /**
   * Return the component for this strategy. This may be a computed field.
   * @returns {string}
   */
  getComponent(): Promise<string | undefined>;

  /**
   * Return the component for this strategy used in the branch name.
   * This may be a computed field.
   * @returns {string}
   */
  getBranchComponent(): Promise<string | undefined>;

  /**
   * Validate whether version is a valid release.
   * @param version Released version.
   * @returns true of release is valid, false if it should be skipped.
   */
  isPublishedVersion?(version: Version): boolean;
}
