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

import {Version} from './version';
import {ConventionalCommit} from './commit';

/**
 * An interface for updating a version.
 */
export interface VersionUpdater {
  /**
   * Returns the new bumped version
   *
   * @param {Version} version The current version
   * @returns {Version} The bumped version
   */
  bump(version: Version): Version;
}

/**
 * This VersionUpdater performs a SemVer major version bump.
 */
export class MajorVersionUpdate implements VersionUpdater {
  /**
   * Returns the new bumped version
   *
   * @param {Version} version The current version
   * @returns {Version} The bumped version
   */
  bump(version: Version): Version {
    return new Version(
      version.major + 1,
      0,
      0,
      version.preRelease,
      version.build
    );
  }
}

/**
 * This VersionUpdater performs a SemVer minor version bump.
 */
export class MinorVersionUpdate implements VersionUpdater {
  /**
   * Returns the new bumped version
   *
   * @param {Version} version The current version
   * @returns {Version} The bumped version
   */
  bump(version: Version): Version {
    return new Version(
      version.major,
      version.minor + 1,
      0,
      version.preRelease,
      version.build
    );
  }
}

/**
 * This VersionUpdater performs a SemVer patch version bump.
 */
export class PatchVersionUpdate implements VersionUpdater {
  /**
   * Returns the new bumped version
   *
   * @param {Version} version The current version
   * @returns {Version} The bumped version
   */
  bump(version: Version): Version {
    return new Version(
      version.major,
      version.minor,
      version.patch + 1,
      version.preRelease,
      version.build
    );
  }
}

/**
 * This VersionUpdater sets the version to a specific version.
 */
export class CustomVersionUpdate implements VersionUpdater {
  private versionString: string;
  constructor(versionString: string) {
    this.versionString = versionString;
  }
  /**
   * Returns the new bumped version. This version is specified
   * at initialization.
   *
   * @param {Version} version The current version
   * @returns {Version} The bumped version
   */
  bump(_version: Version): Version {
    return Version.parse(this.versionString);
  }
}

/**
 * Implement this interface to create a new versioning scheme.
 */
export interface VersioningStrategy {
  /**
   * Given the current version of an artifact and a list of commits,
   * return the next version.
   *
   * @param {Version} version The current version
   * @param {ConventionalCommit[]} commits The list of commits to consider
   * @returns {Version} The next version
   */
  bump(version: Version, commits: ConventionalCommit[]): Version;

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
  ): VersionUpdater;
}
