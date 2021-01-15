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

import {checkpoint, CheckpointType} from '../../util/checkpoint';
import {Update, UpdateOptions, VersionsMap} from '../update';
import {GitHubFileContents} from '../../github';
import {replaceTomlValue} from './toml-edit';
import {parseCargoLockfile} from './common';

/**
 * Updates `Cargo.lock` lockfiles, preserving formatting and comments.
 */
export class CargoLock implements Update {
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

    const parsed = parseCargoLockfile(payload);
    if (!parsed.package) {
      checkpoint(
        `${this.path} is not a Cargo lockfile`,
        CheckpointType.Failure
      );
      throw new Error(`${this.path} is not a Cargo lockfile`);
    }

    // n.b for `replaceTomlString`, we need to keep track of the index
    // (position) of the package we're considering.
    for (let i = 0; i < parsed.package.length; i++) {
      const pkg = parsed.package[i];
      if (!pkg.name) {
        // all `[[package]]` entries should have a name,
        // but if they don't, ignore them silently.
        continue; // to next package
      }

      const nextVersion = this.versions.get(pkg.name);
      if (!nextVersion) {
        // this package is not upgraded.
        continue; // to next package
      }

      // note: in ECMAScript, using strings to index arrays is perfectly valid,
      // which is lucky because `replaceTomlString` expect "all strings" in its
      // `path` argument.
      const packageIndex = i.toString();

      checkpoint(
        `updating ${pkg.name} in ${this.path}`,
        CheckpointType.Success
      );
      payload = replaceTomlValue(
        payload,
        ['package', packageIndex, 'version'],
        nextVersion
      );
    }

    return payload;
  }
}
