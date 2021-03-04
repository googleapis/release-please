// Copyright 2020 Google LLC
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
import {Commit} from '../graphql-to-commits';

// Java
import {BumpType, maxBumpType, fromSemverReleaseType} from './java/bump_type';
import {Version} from './java/version';
import {JavaYoshi} from './java-yoshi';

const DEPENDENCY_UPDATE_REGEX = /^deps: update dependency (.*) to (v.*)(\s\(#\d+\))?$/m;
const DEPENDENCY_PATCH_VERSION_REGEX = /^v\d+\.\d+\.[1-9]\d*(-.*)?/;

export class JavaBom extends JavaYoshi {
  private bumpType?: BumpType;

  protected async coerceVersions(
    cc: ConventionalCommits,
    _candidate: ReleaseCandidate,
    latestTag: GitHubTag | undefined,
    currentVersions: VersionsMap
  ): Promise<VersionsMap> {
    const bumpType = await this.getBumpType(cc, latestTag);
    const newVersions: VersionsMap = new Map<string, string>();
    for (const [k, version] of currentVersions) {
      newVersions.set(k, Version.parse(version).bump(bumpType).toString());
    }
    return newVersions;
  }

  private async getBumpType(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined
  ): Promise<BumpType> {
    if (!this.bumpType) {
      this.bumpType = this.snapshot
        ? 'snapshot'
        : maxBumpType([
            JavaBom.determineBumpType(cc.commits),
            fromSemverReleaseType(
              (
                await cc.suggestBump(
                  latestTag?.version || this.defaultInitialVersion()
                )
              ).releaseType
            ),
          ]);
    }
    return this.bumpType;
  }

  protected async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined,
    _preRelease = false
  ): Promise<ReleaseCandidate> {
    const bumpType = await this.getBumpType(cc, latestTag);
    return {
      version: latestTag
        ? Version.parse(latestTag.version).bump(bumpType).toString()
        : this.defaultInitialVersion(),
      previousTag: latestTag?.version,
    };
  }

  static dependencyUpdates(commits: Commit[]): VersionsMap {
    const versionsMap = new Map();
    commits.forEach(commit => {
      const match = commit.message.match(DEPENDENCY_UPDATE_REGEX);
      if (!match) return;

      // commits are sorted by latest first, so if there is a collision,
      // then we've already recorded the latest version
      if (versionsMap.has(match[1])) return;

      versionsMap.set(match[1], match[2]);
    });
    return versionsMap;
  }

  static isNonPatchVersion(commit: Commit) {
    let match = commit.message.match(DEPENDENCY_UPDATE_REGEX);
    if (!match) return false;

    match = match[2].match(DEPENDENCY_PATCH_VERSION_REGEX);
    if (!match) return true;

    return false;
  }

  static determineBumpType(commits: Commit[]): BumpType {
    if (commits.some(this.isNonPatchVersion)) {
      return 'minor';
    }
    return 'patch';
  }
}
