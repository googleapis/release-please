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

class AddSnapshotVersionUpdate implements VersionUpdater {
  strategy: VersioningStrategy;
  constructor(strategy: VersioningStrategy) {
    this.strategy = strategy;
  }
  bump(version: Version): Version {
    const nextPatch = this.strategy.bump(version, [fakeCommit]);
    return new Version(
      nextPatch.major,
      nextPatch.minor,
      nextPatch.patch,
      nextPatch.preRelease ? `${nextPatch.preRelease}-SNAPSHOT` : 'SNAPSHOT',
      nextPatch.build
    );
  }
}

/**
 * This VersioningStrategy is used by Java releases to bump
 * to the next snapshot version.
 */
export class JavaAddSnapshot implements VersioningStrategy {
  strategy: VersioningStrategy;
  constructor(strategy: VersioningStrategy) {
    this.strategy = strategy;
  }

  determineReleaseType(
    _version: Version,
    _commits: ConventionalCommit[]
  ): VersionUpdater {
    return new AddSnapshotVersionUpdate(this.strategy);
  }

  bump(version: Version, commits: ConventionalCommit[]): Version {
    return this.determineReleaseType(version, commits).bump(version);
  }
}
