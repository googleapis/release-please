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

import {Updater} from '../../update';
import {Version} from '../../version';
import {logger as defaultLogger, Logger} from '../../util/logger';
import {jsonStringify} from '../../util/json-stringify';

interface ApiDefinition {
  id: string;
  version: string;
  // there are more fields we don't care about
}
interface ApisDoc {
  apis: ApiDefinition[];
}

/**
 * Updates the apis.json format. See
 * https://github.com/googleapis/google-cloud-dotnet/blob/main/apis/README.md.
 */
export class Apis implements Updater {
  private version: Version;
  private component: string;

  constructor(component: string, version: Version) {
    this.component = component;
    this.version = version;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const data = JSON.parse(content) as ApisDoc;
    const api = data.apis.find(api => api.id === this.component);
    if (!api) {
      logger.warn(`Failed to find component: ${this.component} in apis.json`);
      return content;
    }
    api.version = this.version.toString();
    return jsonStringify(data, content);
  }
}
