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

import {Updater} from '../update';
import {Version, VersionsMap} from '../version';

// Constructor options for the DefaultUpdater class
export interface UpdateOptions {
  // The primary version to update
  version: Version;

  // Map of component/package => version used for updating
  // multiple versions at the same time.
  versionsMap?: VersionsMap;
}

/**
 * This updater writes a plain file with the version string as the
 * only content.
 */
export class DefaultUpdater implements Updater {
  version: Version;
  versionsMap?: VersionsMap;
  constructor(options: UpdateOptions) {
    this.version = options.version;
    this.versionsMap = options.versionsMap;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(_content: string): string {
    return this.version + '\n';
  }
}
