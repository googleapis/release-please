// Copyright 2023 Google LLC
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

import {jsonStringify} from '../../util/json-stringify';
import {logger as defaultLogger, Logger} from '../../util/logger';
import {DefaultUpdater} from '../default';

export type PackageDirectory = {
  versionNumber: string;
  default: boolean;
};
export type SfdxProjectFile = {
  packageDirectories: PackageDirectory[];
  name: string;
};

/**
 * This updates a sfdx sfdx-project.json file's main version.
 */
export class SfdxProjectJson extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = JSON.parse(content) as SfdxProjectFile;
    for (const packDir of parsed.packageDirectories) {
      if (packDir.default) {
        logger.info(
          `updating from ${packDir.versionNumber} to ${this.version}`
        );
        packDir.versionNumber = `${this.version.toString()}.NEXT`;
      }
    }
    return jsonStringify(parsed, content);
  }
}
