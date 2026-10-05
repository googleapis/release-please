// Copyright 2026 Google LLC
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

import * as TOML from '@iarna/toml';
import {replaceTomlValue} from '../../util/toml-edit';
import {logger as defaultLogger, Logger} from '../../util/logger';
import {Updater} from '../../update';
import {Version} from '../../version';

interface UvLockfile {
  // sic. the key is singular, but it's an array
  package?: UvLockfilePackage[];
}

interface UvLockfilePackage {
  name?: string;
  version?: string;
}

function parseUvLockfile(content: string): UvLockfile {
  return TOML.parse(content) as UvLockfile;
}

/**
 * Normalizes a Python package name per PEP 503: lowercased, with runs of
 * `-`, `_`, or `.` collapsed to a single `-`.
 */
function normalizePackageName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

/**
 * Updates `uv.lock` lockfiles, preserving formatting and comments.
 *
 * Note: the content is parsed twice — once here to find the matching package
 * index, and again inside `replaceTomlValue` (which uses a position-tracking
 * parser for byte-accurate string splicing). This is inherent to the
 * `replaceTomlValue` API design and is consistent with how `CargoLock` works.
 */
export class UvLock implements Updater {
  private packageName: string;
  private version: Version;

  constructor(options: {packageName: string; version: Version}) {
    this.packageName = options.packageName;
    this.version = options.version;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    let payload = content;

    const parsed = parseUvLockfile(payload);
    if (!parsed.package) {
      // Unlike CargoLock (which throws here), we only warn. A uv.lock without
      // [[package]] entries can exist for a freshly-initialized project before
      // its first `uv lock` run; crashing the release would be unhelpful.
      logger.warn('uv.lock has no [[package]] entries');
      return payload;
    }

    const normalizedTarget = normalizePackageName(this.packageName);

    // n.b for `replaceTomlValue`, we need to keep track of the index
    // (position) of the package we're considering.
    let foundVersioned = false;
    let foundVersionless = false;
    for (let i = 0; i < parsed.package.length; i++) {
      const pkg = parsed.package[i];
      if (!pkg.name) {
        continue;
      }

      if (normalizePackageName(pkg.name) !== normalizedTarget) {
        continue;
      }

      if (!pkg.version) {
        // Virtual packages (workspace members without a version) have no
        // `version` field; record that we found the package but cannot bump it.
        foundVersionless = true;
        continue;
      }

      // note: in ECMAScript, using strings to index arrays is perfectly valid,
      // which is lucky because `replaceTomlValue` expects "all strings" in its
      // `path` argument.
      const packageIndex = i.toString();

      foundVersioned = true;
      logger.info(`updating ${pkg.name} in uv.lock`);
      // Note: replaceTomlValue may throw if the lockfile is structurally
      // malformed (e.g., the `version` field is not a plain string). This is
      // consistent with the CargoLock updater and is intentional — a corrupt
      // lockfile should surface as an error rather than be silently skipped.
      payload = replaceTomlValue(
        payload,
        ['package', packageIndex, 'version'],
        this.version.toString()
      );
    }

    if (!foundVersioned) {
      if (foundVersionless) {
        logger.warn(
          `${this.packageName} is in uv.lock but has no version field (virtual package); skipping`
        );
      } else {
        logger.warn(`package ${this.packageName} not found in uv.lock`);
      }
    }

    return payload;
  }
}
