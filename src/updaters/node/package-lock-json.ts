// Copyright 2021 Google LLC
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

type LockFileV2 = {
  version: string;
  lockfileVersion?: number;
  packages: Record<string, {version: string, name: string}>;
};

/**
 * Updates a Node.js package-lock.json file's version and '' package
 * version (for a v2 lock file).
 */
export class PackageLockJson extends DefaultUpdater {
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = JSON.parse(content) as LockFileV2;
    logger.info(`updating from ${parsed.version} to ${this.version}`);
    parsed.version = this.version.toString();
    if (parsed.lockfileVersion === 2 || parsed.lockfileVersion === 3) {
      parsed.packages[''].version = this.version.toString();
    }
    if (this.versionsMap) {
      for (const [p, obj] of Object.entries(parsed.packages)) {
        for (const [name, ver] of this.versionsMap?.entries()) {
          if (obj.name === name) {
            obj.version = ver.toString();
          }
        }
      }
    }

    return jsonStringify(parsed, content);
  }
}
