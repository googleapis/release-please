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

import {Updater} from '../update';
import {Version} from '../version';
import {JSONPath} from 'jsonpath-plus';
import {parseWith, replaceTomlValue} from '../util/toml-edit';
import * as toml from '@iarna/toml';
import {logger as defaultLogger, Logger} from '../util/logger';

/**
 * Updates TOML document according to given JSONPath.
 *
 * Note that used parser does reformat the document and removes all comments,
 * and converts everything to pure TOML.
 * If you want to retain formatting, use generic updater with comment hints.
 */
export class GenericToml implements Updater {
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
    let data: toml.JsonMap;
    try {
      data = parseWith(content);
    } catch (e) {
      logger.warn('Invalid toml, cannot be parsed', e);
      return content;
    }

    const pointers: string[] = JSONPath({
      path: this.jsonpath,
      json: data,
      resultType: 'pointer',
    });
    const paths = pointers.map(pointer => pointer.split('/').filter(Boolean));
    if (!paths || paths.length === 0) {
      logger.warn(`No entries modified in ${this.jsonpath}`);
      return content;
    }

    let processed = content;
    paths.forEach(path => {
      if (path[0] === '$') path = path.slice(1);
      processed = replaceTomlValue(processed, path, this.version.toString());
    });

    return processed;
  }
}
