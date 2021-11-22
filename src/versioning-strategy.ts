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

export interface VersionUpdater {
  bump(version: Version): Version;
  name: string;
}

export class MajorVersionUpdate implements VersionUpdater {
  name = 'major';
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

export class MinorVersionUpdate implements VersionUpdater {
  name = 'major';
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

export class PatchVersionUpdate implements VersionUpdater {
  name = 'major';
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

export class CustomVersionUpdate implements VersionUpdater {
  name = 'custom';
  private versionString: string;
  constructor(versionString: string) {
    this.versionString = versionString;
  }
  bump(_version: Version): Version {
    return Version.parse(this.versionString);
  }
}

export interface VersioningStrategy {
  bump(version: Version, commits: ConventionalCommit[]): Version;
  determineReleaseType(
    version: Version,
    commits: ConventionalCommit[]
  ): VersionUpdater;
}
