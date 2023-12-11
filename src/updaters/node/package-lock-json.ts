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

import {Updater} from '../../update';
import {jsonStringify} from '../../util/json-stringify';
import {logger as defaultLogger, Logger} from '../../util/logger';
import {Version, VersionsMap} from '../../version';
import {UpdateOptions} from '../default';
import {PackageJsonDescriptor, updateDependencies} from './package-json';

type LockFileV2 = {
  version: string;
  lockfileVersion?: number;
  packages: Record<string, PackageJsonDescriptor>;
};

/**
 * Updates a Node.js package-lock.json file's version and '' package
 * version (for a v2 lock file).
 */
export class PackageLockJson implements Updater {
  version?: Version;
  versionsMap?: VersionsMap;
  constructor(options: Partial<UpdateOptions>) {
    this.version = options.version;
    this.versionsMap = options.versionsMap;
  }
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = JSON.parse(content) as LockFileV2;
    if (this.version) {
      logger.info(`updating from ${parsed.version} to ${this.version}`);
      parsed.version = this.version.toString();
    }

    if (parsed.lockfileVersion === 2 || parsed.lockfileVersion === 3) {
      if (this.version) {
        parsed.packages[''].version = this.version.toString();
      }

      if (this.versionsMap) {
        this.versionsMap.forEach((version, name) => {
          let pkg = parsed.packages['node_modules/' + name];
          if (!pkg) {
            return;
          }

          // @see https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json#packages
          if (pkg.link && pkg.resolved) {
            pkg = parsed.packages[pkg.resolved];
            if (!pkg) {
              return;
            }
          }

          pkg.version = version.toString();

          if (pkg.dependencies) {
            updateDependencies(pkg.dependencies, this.versionsMap!);
          }
          if (pkg.devDependencies) {
            updateDependencies(pkg.devDependencies, this.versionsMap!);
          }
          if (pkg.peerDependencies) {
            updateDependencies(pkg.peerDependencies, this.versionsMap!);
          }
          if (pkg.optionalDependencies) {
            updateDependencies(pkg.optionalDependencies, this.versionsMap!);
          }
        });
      }
    }
    if (this.versionsMap) {
      for (const [, obj] of Object.entries(parsed.packages)) {
        if (!obj.name) {
          continue;
        }

        const ver = this.versionsMap.get(obj.name);
        if (ver) {
          obj.version = ver.toString();
        }
      }
    }

    return jsonStringify(parsed, content);
  }
}
