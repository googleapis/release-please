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

interface ManifestModule {
  name: string;
  versions: string[];
}

/**
 * Updates a manifest.json file.
 * @see https://github.com/googleapis/google-cloud-php/blob/master/docs/manifest.json
 */
export class PHPManifest extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    if (!this.versionsMap || this.versionsMap.size === 0) {
      logger.info('no updates necessary');
      return content;
    }
    const parsed = JSON.parse(content);
    parsed.modules.forEach((module: ManifestModule) => {
      if (!this.versionsMap) return;
      for (const [key, version] of this.versionsMap) {
        if (module.name === key) {
          logger.info(`adding ${key}@${version} to manifest`);
          module.versions.unshift(`v${version}`);
        }
      }

      // the mono-repo's own API version should be added to the
      // google/cloud key:
      if (module.name === 'google/cloud') {
        module.versions.unshift(`v${this.version}`);
      }
    });

    return jsonStringify(parsed, content);
  }
}
