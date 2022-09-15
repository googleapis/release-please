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

import {replaceTomlValue} from '../../util/toml-edit';
import {parseCargoLockfile} from './common';
import {logger as defaultLogger, Logger} from '../../util/logger';
import {Updater} from '../../update';
import {VersionsMap} from '../../version';

/**
 * Updates `Cargo.lock` lockfiles, preserving formatting and comments.
 */
export class CargoLock implements Updater {
  versionsMap: VersionsMap;
  constructor(versionsMap: VersionsMap) {
    this.versionsMap = versionsMap;
  }
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    let payload = content;

    const parsed = parseCargoLockfile(payload);
    if (!parsed.package) {
      logger.error('is not a Cargo lockfile');
      throw new Error('is not a Cargo lockfile');
    }

    // n.b for `replaceTomlString`, we need to keep track of the index
    // (position) of the package we're considering.
    for (let i = 0; i < parsed.package.length; i++) {
      const pkg = parsed.package[i];
      if (!pkg.name) {
        // all `[[package]]` entries should have a name,
        // but if they don't, ignore them silently.
        continue; // to next package
      }

      const nextVersion = this.versionsMap.get(pkg.name);
      if (!nextVersion) {
        // this package is not upgraded.
        continue; // to next package
      }

      // note: in ECMAScript, using strings to index arrays is perfectly valid,
      // which is lucky because `replaceTomlString` expect "all strings" in its
      // `path` argument.
      const packageIndex = i.toString();

      logger.info(`updating ${pkg.name} in`);
      payload = replaceTomlValue(
        payload,
        ['package', packageIndex, 'version'],
        nextVersion.toString()
      );
    }

    return payload;
  }
}
