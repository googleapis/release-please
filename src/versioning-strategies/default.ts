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

import {
  VersioningStrategy,
  MinorVersionUpdate,
  VersionUpdater,
  MajorVersionUpdate,
  PatchVersionUpdate,
  CustomVersionUpdate,
} from '../versioning-strategy';
import {ConventionalCommit} from '../commit';
import {Version} from '../version';

interface DefaultVersioningStrategyOptions {
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
}

/**
 * This is the default VersioningStrategy for release-please. Breaking
 * changes should bump the major, features should bump the minor, and other
 * significant changes should bump the patch version.
 */
export class DefaultVersioningStrategy implements VersioningStrategy {
  readonly bumpMinorPreMajor: boolean;
  readonly bumpPatchForMinorPreMajor: boolean;
  /**
   * Create a new DefaultVersioningStrategy
   * @param {DefaultVersioningStrategyOptions} options Configuration options
   * @param {boolean} options.bumpMinorPreMajor If the current version is less than 1.0.0,
   *   then bump the minor version for breaking changes
   * @param {boolean} options.bumpPatchForMinorPreMajor If the current version is less than
   *   1.0.0, then bump the patch version for features
   */
  constructor(options: DefaultVersioningStrategyOptions = {}) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor === true;
    this.bumpPatchForMinorPreMajor = options.bumpPatchForMinorPreMajor === true;
  }

  /**
   * Given the current version of an artifact and a list of commits,
   * return a VersionUpdater that knows how to bump the version.
   *
   * This is useful for chaining together versioning strategies.
   *
   * @param {Version} version The current version
   * @param {ConventionalCommit[]} commits The list of commits to consider
   * @returns {VersionUpdater} Updater for bumping the next version.
   */
  determineReleaseType(
    version: Version,
    commits: ConventionalCommit[]
  ): VersionUpdater {
    // iterate through list of commits and find biggest commit type
    let breaking = 0;
    let features = 0;
    let customVersion: Version | undefined;
    for (const commit of commits) {
      const releaseAs = commit.notes.find(note => note.title === 'RELEASE AS');
      if (releaseAs) {
        customVersion = Version.parse(releaseAs.text);
      }
      if (commit.breaking) {
        breaking++;
      } else if (commit.type === 'feat' || commit.type === 'feature') {
        features++;
      }
    }

    if (customVersion) {
      return new CustomVersionUpdate(customVersion.toString());
    }

    if (breaking > 0) {
      if (version.major < 1 && this.bumpMinorPreMajor) {
        return new MinorVersionUpdate();
      } else {
        return new MajorVersionUpdate();
      }
    } else if (features > 0) {
      if (version.major < 1 && this.bumpPatchForMinorPreMajor) {
        return new PatchVersionUpdate();
      } else {
        return new MinorVersionUpdate();
      }
    }
    return new PatchVersionUpdate();
  }

  /**
   * Given the current version of an artifact and a list of commits,
   * return the next version.
   *
   * @param {Version} version The current version
   * @param {ConventionalCommit[]} commits The list of commits to consider
   * @returns {Version} The next version
   */
  bump(version: Version, commits: ConventionalCommit[]): Version {
    return this.determineReleaseType(version, commits).bump(version);
  }
}
