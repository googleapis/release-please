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
import {jsonStringify} from '../util/json-stringify';
import {logger as defaultLogger, Logger} from '../util/logger';

const VERSION_REGEX =
  /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<preRelease>[\w.]+))?(\+(?<build>[-\w.]+))?/;

export class GenericJson implements Updater {
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
    const data = JSON.parse(content);
    JSONPath({
      resultType: 'all',
      path: this.jsonpath,
      json: data,
      callback: (payload, _payloadType, _fullPayload) => {
        if (typeof payload.value !== 'string') {
          logger.warn(`No string in ${this.jsonpath}. Skipping.`);
          return payload;
        }
        if (!payload.value.match(VERSION_REGEX)) {
          logger.warn(`No version found in ${this.jsonpath}. Skipping.`);
          return payload;
        }
        payload.parent[payload.parentProperty] = payload.parent[
          payload.parentProperty
        ].replace(VERSION_REGEX, this.version.toString());
        return payload;
      },
    });
    return jsonStringify(data, content);
  }
}
