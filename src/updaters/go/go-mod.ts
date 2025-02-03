// Copyright 2024 Google LLC
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

import {logger as defaultLogger, Logger} from '../../util/logger';
import {DefaultUpdater} from '../default';

/**
 * Updates `go.mod` files, preserving formatting and comments.
 */
export class GoMod extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    let payload = content;

    if (!this.versionsMap) {
      throw new Error('updateContent called with no versions');
    }

    for (const [pkgName, pkgVersion] of this.versionsMap) {
      // Easy version is v1.2.3
      // But if depending on a commit it could be v0.1.1-0.20250203122516-4c838e530ecb
      const regex = new RegExp(`${pkgName} v\\d+\\.\\d+\\.\\d+\\S*`, 'g');
      // Is the dep in the go.mod file?
      const deps = regex.exec(payload);

      if (!deps) {
        logger.info(`skipping ${pkgName} (not found in go.mod)`);
        continue;
      }

      for (const dep of deps) {
        const oldVersion = dep.split(' ')[1];
        logger.info(`updating ${pkgName} from ${oldVersion} to v${pkgVersion}`);

        payload = payload.replace(dep, `${pkgName} v${pkgVersion}`);
      }
    }

    return payload;
  }
}
