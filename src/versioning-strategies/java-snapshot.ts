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
    if (this.parent) {
      version = this.parent.bump(version);
    }
    return new Version(
      version.major,
      version.minor,
      version.patch,
      version.preRelease
        ? version.preRelease.replace(/-?SNAPSHOT/, '')
        : undefined,
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
    const parentBump = this.strategy.determineReleaseType(version, commits);
    if (version.preRelease?.match(/-?SNAPSHOT/)) {
      const patchBumpVersion = this.strategy
        .determineReleaseType(version, [fakeCommit])
        .bump(version);
      const parentBumpVersion = parentBump.bump(version);
      if (patchBumpVersion.toString() === parentBumpVersion.toString()) {
        return new RemoveSnapshotVersionUpdate();
      }
      return new RemoveSnapshotVersionUpdate(parentBump);
    }
    return parentBump;
  }

  bump(version: Version, commits: ConventionalCommit[]): Version {
    return this.determineReleaseType(version, commits).bump(version);
  }
}
