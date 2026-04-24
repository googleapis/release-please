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

import {VersioningStrategy, VersionUpdater} from '../versioning-strategy';
import {Version} from '../version';
import {ConventionalCommit} from '../commit';

const fakeCommit: ConventionalCommit = {
  message: 'fix: fake fix',
  type: 'fix',
  scope: null,
  notes: [],
  references: [],
  bareMessage: 'fake fix',
  breaking: false,
  sha: 'abc123',
  files: [],
};

class RemoveSnapshotVersionUpdate implements VersionUpdater {
  parent?: VersionUpdater;
  constructor(parent?: VersionUpdater) {
    this.parent = parent;
  }
  bump(version: Version): Version {
    let preRelease = version.preRelease;
    if (this.parent) {
      version = this.parent.bump(version);
      // reset the release candidate number after a bump
      preRelease = version.preRelease?.replace(/rc\d+/, 'rc1');
    }
    return new Version(
      version.major,
      version.minor,
      version.patch,
      preRelease?.replace(/-?SNAPSHOT/, ''),
      version.build
    );
  }
}

/**
 * This VersioningStrategy is used by Java releases to bump
 * to the next non-snapshot version.
 */
export class JavaSnapshot implements VersioningStrategy {
  strategy: VersioningStrategy;
  constructor(strategy: VersioningStrategy) {
    this.strategy = strategy;
  }

  determineReleaseType(
    version: Version,
    commits: ConventionalCommit[]
  ): VersionUpdater {
    // Determine the release type from the parent strategy based on the commits.
    const parentBump = this.strategy.determineReleaseType(version, commits);

    // If the current version is a snapshot, we need to handle it specially.
    if (version.preRelease?.match(/-?SNAPSHOT/)) {
      // To check if the only change is the snapshot removal, we simulate a patch bump.
      // We create a fake commit that would cause a patch bump and see what version the parent strategy would return.
      const patchBumpVersion = this.strategy
        .determineReleaseType(version, [fakeCommit])
        .bump(version);

      // We then get the version that the parent strategy would return with the actual commits.
      const parentBumpVersion = parentBump.bump(version);

      // If the parent bump version is the same as the patch bump version,
      // it means that the commits only triggered a patch bump.
      // In this case, we only need to remove the "-SNAPSHOT" from the version.
      if (patchBumpVersion.toString() === parentBumpVersion.toString()) {
        return new RemoveSnapshotVersionUpdate();
      }
      // If the parent bump version is different from the patch bump version,
      // it means that the commits triggered a minor or major bump.
      // In this case, we need to both apply the parent bump and remove the "-SNAPSHOT".
      return new RemoveSnapshotVersionUpdate(parentBump);
    }
    // If the current version is not a snapshot, we just return the parent bump.
    return parentBump;
  }

  bump(version: Version, commits: ConventionalCommit[]): Version {
    return this.determineReleaseType(version, commits).bump(version);
  }
}
