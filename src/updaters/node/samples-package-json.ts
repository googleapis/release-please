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
import {DefaultUpdater, UpdateOptions} from '../default';

interface SamplesPackageJsonOptions extends UpdateOptions {
  packageName: string;
}

/**
 * Updates the a Node.js package.json file with the library in the
 * dependencies section.
 */
export class SamplesPackageJson extends DefaultUpdater {
  packageName: string;

  /**
   * Instantiate a new SamplesPackageJson updater
   * @param options
   */
  constructor(options: SamplesPackageJsonOptions) {
    super(options);
    this.packageName = options.packageName;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = JSON.parse(content);
    if (!parsed.dependencies || !parsed.dependencies[this.packageName]) {
      return content;
    }
    logger.info(
      `updating ${this.packageName} dependency from ${
        parsed.dependencies[this.packageName]
      } to ^${this.version}`
    );
    parsed.dependencies[this.packageName] = `^${this.version}`;
    return jsonStringify(parsed, content);
  }
}
