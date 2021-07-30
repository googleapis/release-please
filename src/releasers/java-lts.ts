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

import {ReleaseCandidate} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag} from '../github';
import {VersionsMap} from '../updaters/update';

// Java
import {Version} from './java/version';
import {JavaYoshi} from './java-yoshi';

export class JavaLTS extends JavaYoshi {
  protected async coerceVersions(
    _cc: ConventionalCommits,
    _candidate: ReleaseCandidate,
    _latestTag: GitHubTag | undefined,
    currentVersions: VersionsMap
  ): Promise<VersionsMap> {
    // Example versioning:
    //   1.2.3
    //   1.2.3-sp.1-SNAPSHOT
    //   1.2.3-sp.1
    //   1.2.3-sp.2-SNAPSHOT
    const bumpType = this.snapshot ? 'lts-snapshot' : 'lts';
    const newVersions: VersionsMap = new Map<string, string>();
    for (const [k, version] of currentVersions) {
      newVersions.set(k, Version.parse(version).bump(bumpType).toString());
    }
    return newVersions;
  }

  protected async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined,
    _preRelease = false
  ): Promise<ReleaseCandidate> {
    const bumpType = this.snapshot ? 'lts-snapshot' : 'lts';

    const version = Version.parse(
      latestTag?.version ?? this.defaultInitialVersion()
    )
      .bump(bumpType)
      .toString();

    return {
      previousTag: latestTag?.version,
      version,
    };
  }
}
