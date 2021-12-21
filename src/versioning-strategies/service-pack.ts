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
import {DefaultVersioningStrategy} from './default';
import {ConventionalCommit} from '../commit';
import {VersionUpdater} from '../versioning-strategy';

const SERVICE_PACK_PATTERN = /sp\.(\d+)/;

/**
 * This version updater knows how to bump from a non-service pack
 * version to a service pack version and increment the service
 * pack number in subsequent releases.
 */
class ServicePackVersionUpdate implements VersionUpdater {
  bump(version: Version): Version {
    const match = version.preRelease?.match(SERVICE_PACK_PATTERN);
    if (match) {
      const spNumber = Number(match[1]);
      return new Version(
        version.major,
        version.minor,
        version.patch,
        `sp.${spNumber + 1}`,
        version.build
      );
    }
    return new Version(
      version.major,
      version.minor,
      version.patch,
      'sp.1',
      version.build
    );
  }
}

/**
 * This VersioningStrategy is used for "service pack" versioning. In this
 * strategy, we use the pre-release field with a pattern of `sp-\d+` where
 * the number is an auto-incrementing integer starting with 1.
 */
export class ServicePackVersioningStrategy extends DefaultVersioningStrategy {
  determineReleaseType(
    _version: Version,
    _commits: ConventionalCommit[]
  ): VersionUpdater {
    return new ServicePackVersionUpdate();
  }
}
