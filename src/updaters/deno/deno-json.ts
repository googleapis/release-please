// Copyright 2025 Google LLC
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
import {DefaultUpdater, UpdateOptions} from '../default';

export type DenoJsonDescriptor = {
  name?: string;
  version: string;
};

export type DenoJsonOptions = UpdateOptions;

/**
 * This updates a Deno deno.json file's main version.
 */
export class DenoJson extends DefaultUpdater {
  constructor(options: DenoJsonOptions) {
    super(options);
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @param logger
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = JSON.parse(content) as DenoJsonDescriptor;
    logger.info(`updating from ${parsed.version} to ${this.version}`);
    parsed.version = this.version.toString();

    return jsonStringify(parsed, content);
  }
}
