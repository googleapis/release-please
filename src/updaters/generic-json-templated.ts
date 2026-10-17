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

import {Updater} from '../update';
import {JSONPath} from 'jsonpath-plus';
import {jsonStringify} from '../util/json-stringify';
import {logger as defaultLogger, Logger} from '../util/logger';

/**
 * Updates a JSON file with a templated string value.
 * Unlike GenericJson, this replaces the entire value with the templated string.
 */
export class GenericJsonTemplated implements Updater {
  readonly jsonpath: string;
  readonly value: string;

  constructor(jsonpath: string, value: string) {
    this.jsonpath = jsonpath;
    this.value = value;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const data = JSON.parse(content);
    let modified = false;
    JSONPath({
      resultType: 'all',
      path: this.jsonpath,
      json: data,
      callback: (payload, _payloadType, _fullPayload) => {
        payload.parent[payload.parentProperty] = this.value;
        modified = true;
        return payload;
      },
    });

    if (!modified) {
      logger.warn(`No entries modified in ${this.jsonpath}`);
    }

    return jsonStringify(data, content);
  }
}
