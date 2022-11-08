// Copyright 2022 Google LLC
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
import {ConventionalCommit} from '../commit';
import {DefaultVersioningStrategy} from './default';
import {VersionUpdater, MinorVersionUpdate} from '../versioning-strategy';

/**
 * This VersioningStrategy always bumps the minor version.
 */
export class AlwaysBumpMinor extends DefaultVersioningStrategy {
  determineReleaseType(
    _version: Version,
    _commits: ConventionalCommit[]
  ): VersionUpdater {
    return new MinorVersionUpdate();
  }
}
