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

import {logger as defaultLogger, Logger} from '../../util/logger';
import {DefaultUpdater} from '../default';

/**
 * Updates a Terraform metadata.yaml or metadata.display.yaml file(s).
 */
export class MetadataVersion extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const oldVersion = content.match(/version: [0-9]+\.[0-9]+\.[0-9]+(-\w+)?/);
    if (oldVersion) {
      logger.info(`updating from ${oldVersion} to v${this.version}`);
    }
    return content.replace(
      /version: [0-9]+\.[0-9]+\.[0-9]+(-\w+)?/g,
      `version: ${this.version}`
    );
  }
}
