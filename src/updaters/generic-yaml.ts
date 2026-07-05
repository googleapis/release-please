// Copyright 2022 Google LLC
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
import {Version} from '../version';
import {JSONPath} from 'jsonpath-plus';
import * as yaml from 'js-yaml';
import {logger as defaultLogger, Logger} from '../util/logger';

const DOCUMENT_SEPARATOR = '---\n';

/**
 * Updates YAML document according to given JSONPath.
 *
 * Note that used parser does reformat the document and removes all comments,
 * and converts everything to pure YAML (even JSON source).
 * If you want to retain formatting, use generic updater with comment hints.
 *
 * When applied on multi-document file, it updates all documents.
 */
export class GenericYaml implements Updater {
  readonly jsonpath: string;
  readonly version: Version;

  constructor(jsonpath: string, version: Version) {
    this.jsonpath = jsonpath;
    this.version = version;
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
          if (typeof payload.value !== 'string') {
            logger.warn(`No string in ${this.jsonpath}. Skipping.`);
            return payload;
          }

          modified = true;
          payload.parent[payload.parentProperty] = this.version.toString();
          return payload;
        },
      });
    });

    // If nothing was modified, return original content
    if (!modified) {
      logger.warn(`No entries modified in ${this.jsonpath}`);
      return content;
    }

    // Stringify documents
    if (docs.length === 1) {
      // Single doc
      return yaml.dump(docs[0]);
    } else {
      // Multi-document, each document starts with separator
      return docs.map(data => DOCUMENT_SEPARATOR + yaml.dump(data)).join('');
    }
  }
}
