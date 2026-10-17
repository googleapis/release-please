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
import * as yaml from 'js-yaml';
import {logger as defaultLogger, Logger} from '../util/logger';

const DOCUMENT_SEPARATOR = '---\n';

/**
 * Updates a YAML file with a templated string value.
 * Unlike GenericYaml, this replaces the entire value with the templated string.
 */
export class GenericYamlTemplated implements Updater {
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
    // Parse possibly multi-document file
    let docs: unknown[];
    try {
      docs = yaml.loadAll(content, null, {json: true});
    } catch (e) {
      logger.warn('Invalid yaml, cannot be parsed', e);
      return content;
    }

    // Update each document
    let modified = false;
    docs.forEach(data => {
      JSONPath({
        resultType: 'all',
        path: this.jsonpath,
        json: data as any,
        callback: (payload, _payloadType, _fullPayload) => {
          modified = true;
          payload.parent[payload.parentProperty] = this.value;
          return payload;
        },
      });
    });

    // If nothing was modified, return original content
    if (!modified) {
      logger.warn(`No entries modified in ${this.jsonpath}`);
      return content;
    }

    // Serialize back to YAML
    return docs
      .map(doc => yaml.dump(doc, {lineWidth: -1, noRefs: true}))
      .join(DOCUMENT_SEPARATOR);
  }
}
