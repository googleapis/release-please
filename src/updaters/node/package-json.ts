// Copyright 2019 Google LLC
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
import {Version, VersionsMap} from '../../version';
import {DefaultUpdater, UpdateOptions} from '../default';

export type PackageJsonDescriptor = {
  name?: string;
  resolved?: string;
  link?: boolean;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

export interface PackageJsonOptions extends UpdateOptions {
  updatePeerDependencies?: boolean;
}

/**
 * This updates a Node.js package.json file's main version.
 */
export class PackageJson extends DefaultUpdater {
  private updatePeerDependencies = false;

  constructor(options: PackageJsonOptions) {
    super(options);
    this.updatePeerDependencies = options.updatePeerDependencies || false;
  }
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @param logger
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = JSON.parse(content) as PackageJsonDescriptor;
    logger.info(`updating from ${parsed.version} to ${this.version}`);
    parsed.version = this.version.toString();

    // If additional dependency versions specified, then update dependency versions
    // while preserving any valid version range prefixes.
    if (this.versionsMap) {
      if (parsed.dependencies) {
        updateDependencies(parsed.dependencies, this.versionsMap);
      }
      if (parsed.devDependencies) {
        updateDependencies(parsed.devDependencies, this.versionsMap);
      }
      if (parsed.peerDependencies && this.updatePeerDependencies) {
        updateDependencies(parsed.peerDependencies, this.versionsMap);
      }
      if (parsed.optionalDependencies) {
        updateDependencies(parsed.optionalDependencies, this.versionsMap);
      }
    }

    return jsonStringify(parsed, content);
  }
}

enum SUPPORTED_RANGE_PREFIXES {
  CARET = '^',
  TILDE = '~',
  EQUAL_OR_GREATER_THAN = '>=',
  EQUAL_OR_LESS_THAN = '<=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
}
function detectRangePrefix(version: string): string {
  return (
    Object.values(SUPPORTED_RANGE_PREFIXES).find(supportedRangePrefix =>
      version.startsWith(supportedRangePrefix)
    ) || ''
  );
}
/**
 * Helper to coerce a new version value into a version range that preserves the
 * version range prefix of the original version.
 * @param {string} oldVersion Old semver with range
 * @param {Version} newVersion The new version to update with
 */
export function newVersionWithRange(
  oldVersion: string,
  newVersion: Version
): string {
  const prefix = detectRangePrefix(oldVersion);
  if (prefix) {
    return `${prefix}${newVersion}`;
  }
  return newVersion.toString();
}
export const NPM_PROTOCOL_REGEXP = /^[a-z]+:/;
/**
 * Helper function to update dependency versions for all new versions specified
 * in the updated versions map. Note that this mutates the existing input.
 * @param {Record<string, string>} dependencies Entries in package.json dependencies
 *   where the key is the dependency name and the value is the dependency range
 * @param {VersionsMap} updatedVersions Map of new versions (without dependency range prefixes)
 */
export function updateDependencies(
  dependencies: Record<string, string>,
  updatedVersions: VersionsMap
) {
  for (const depName of Object.keys(dependencies)) {
    const oldVersion = dependencies[depName];
    if (NPM_PROTOCOL_REGEXP.test(oldVersion)) {
      continue;
    }
    const newVersion = updatedVersions.get(depName);
    if (newVersion) {
      dependencies[depName] = newVersionWithRange(oldVersion, newVersion);
    }
  }
}
