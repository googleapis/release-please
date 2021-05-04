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

import {Update, UpdateOptions, VersionsMap} from '../update';
import {GitHubFileContents} from '../../github';
import {replaceTomlValue} from '../toml-edit';
import {DEP_KINDS, parseCargoManifest} from './common';
import {logger} from '../../util/logger';

/**
 * Updates `Cargo.toml` manifests, preserving formatting and comments.
 */
export class CargoToml implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  versions?: VersionsMap;
  packageName: string;
  create: boolean;
  contents?: GitHubFileContents;

  constructor(options: UpdateOptions) {
    this.create = false;
    this.path = options.path;
    this.changelogEntry = options.changelogEntry;
    this.version = options.version;
    this.versions = options.versions;
    this.packageName = options.packageName;
  }

  updateContent(content: string): string {
    let payload = content;

    if (!this.versions) {
      throw new Error('updateContent called with no versions');
    }

    const parsed = parseCargoManifest(payload);
    if (!parsed.package) {
      const msg = `${this.path} is not a package manifest (might be a cargo workspace)`;
      logger.error(msg);
      throw new Error(msg);
    }

    for (const [pkgName, pkgVersion] of this.versions) {
      if (parsed.package.name === pkgName) {
        logger.info(
          `updating ${this.path}'s own version from ${parsed.package?.version} to ${pkgVersion}`
        );
        payload = replaceTomlValue(payload, ['package', 'version'], pkgVersion);

        continue; // to next [pkgName, pkgVersion] pair
      }

      for (const depKind of DEP_KINDS) {
        const deps = parsed[depKind];

        if (!deps) {
          continue; // to next depKind
        }

        if (!deps[pkgName]) {
          continue; // to next depKind
        }

        const dep = deps[pkgName];

        if (typeof dep === 'string' || typeof dep.path === 'undefined') {
          logger.info(`skipping ${depKind}.${pkgName} in ${this.path}`);
          continue; // to next depKind
        }

        logger.info(
          `updating ${this.path} ${depKind}.${pkgName} from ${dep.version} to ${pkgVersion}`
        );
        payload = replaceTomlValue(
          payload,
          [depKind, pkgName, 'version'],
          pkgVersion
        );
      }

      // Update platform-specific dependencies
      if (parsed.target) {
        for (const targetName of Object.keys(parsed.target)) {
          for (const depKind of DEP_KINDS) {
            const deps = parsed.target[targetName][depKind];

            if (!deps) {
              continue; // to next depKind
            }

            if (!deps[pkgName]) {
              continue; // to next depKind
            }

            const dep = deps[pkgName];

            if (typeof dep === 'string' || typeof dep.path === 'undefined') {
              logger.info(
                `skipping target.${targetName}.${depKind}.${pkgName} in ${this.path}`
              );
              continue; // to next depKind
            }

            logger.info(
              `updating ${this.path} target.${targetName}.${depKind}.${pkgName} from ${dep.version} to ${pkgVersion}`
            );
            payload = replaceTomlValue(
              payload,
              ['target', targetName, depKind, pkgName, 'version'],
              pkgVersion
            );
          }
        }
      }
    }

    return payload;
  }
}
