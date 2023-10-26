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

import {Version} from '../version';
import * as semver from 'semver';
import {ConventionalCommit} from '../commit';
import {DefaultVersioningStrategy} from './default';
import {
  VersionUpdater,
  MajorVersionUpdate,
  MinorVersionUpdate,
  PatchVersionUpdate,
} from '../versioning-strategy';

const DEPENDENCY_UPDATE_REGEX =
  /^deps: update dependency (.*) to (v[^\s]*)(\s\(#\d+\))?$/m;

/**
 * This VersioningStrategy looks at `deps` type commits and tries to
 * mirror the semantic version bump for that dependency update. For
 * example, an update to v2, would be treated as a major version bump.
 *
 * It also respects the default commit types and will pick the
 * greatest version bump.
 */
export class DependencyManifest extends DefaultVersioningStrategy {
  determineReleaseType(
    version: Version,
    commits: ConventionalCommit[]
  ): VersionUpdater {
    const regularBump = super.determineReleaseType(version, commits);

    const dependencyUpdates = buildDependencyUpdates(commits);
    let breaking = 0;
    let features = 0;
    for (const dep in dependencyUpdates) {
      const version = dependencyUpdates[dep];
      if (version.patch === 0) {
        if (version.minor === 0) {
          breaking++;
        } else {
          features++;
        }
      }
    }

    let dependencyBump: VersionUpdater;
    if (breaking > 0) {
      if (version.isPreMajor && this.bumpMinorPreMajor) {
        dependencyBump = new MinorVersionUpdate();
      } else {
        dependencyBump = new MajorVersionUpdate();
      }
    } else if (features > 0) {
      if (version.isPreMajor && this.bumpPatchForMinorPreMajor) {
        dependencyBump = new PatchVersionUpdate();
      } else {
        dependencyBump = new MinorVersionUpdate();
      }
    } else {
      dependencyBump = new PatchVersionUpdate();
    }

    if (
      semver.lte(
        dependencyBump.bump(version).toString(),
        regularBump.bump(version).toString()
      )
    ) {
      return regularBump;
    } else {
      return dependencyBump;
    }
  }
}

function buildDependencyUpdates(
  commits: ConventionalCommit[]
): Record<string, Version> {
  const versionsMap: Record<string, Version> = {};
  for (const commit of commits) {
    const match = commit.message.match(DEPENDENCY_UPDATE_REGEX);
    if (!match) continue;

    const versionString = match[2];
    let version: Version;
    try {
      version = Version.parse(versionString);
    } catch {
      version = Version.parse(`${versionString}.0.0`);
    }

    // commits are sorted by latest first, so if there is a collision,
    // then we've already recorded the latest version
    if (versionsMap[match[1]]) continue;

    versionsMap[match[1]] = version;
  }
  return versionsMap;
}
