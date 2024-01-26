// Copyright 2019 Google LLC
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
import {jsonStringify} from '../../util/json-stringify';
import {DefaultUpdater} from '../default';

/**
 * Updates a root composer.json
 */
export class RootComposerUpdatePackages extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    if (!this.version && (!this.versionsMap || this.versionsMap.size === 0)) {
      logger.info('no updates necessary');
      return content;
    }
    const parsed = JSON.parse(content);
    if (parsed['version']) {
      const fromVersion: string = parsed['version'];
      const toVersion = this.version.toString() || '1.0.0';
      parsed['version'] = toVersion;
      logger.info(`updating "version" from ${fromVersion} to ${toVersion}`);
    }
    if (this.versionsMap) {
      for (const [key, version] of this.versionsMap.entries()) {
        const toVersion = version.toString() || '1.0.0';
        let fromVersion: string | undefined;
        if (parsed.replace) {
          fromVersion = parsed.replace[key];
          parsed.replace[key] = toVersion;
        }
        if (parsed[key]) {
          fromVersion ??= parsed[key];
          parsed[key] = toVersion;
        }

        logger.info(`updating ${key} from ${fromVersion} to ${toVersion}`);
      }
    }
    return jsonStringify(parsed, content);
  }
}
