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

import {Scm} from '../scm';
import {FileNotFoundError} from '../errors';
import {Version} from '../version';
import {Logger} from './logger';

// Kept as literals (rather than importing from ../manifest) to avoid a
// circular import, since manifest.ts imports this module.
const MANIFEST_FILE = '.release-please-manifest.json';
const ROOT_PROJECT_PATH = '.';

/**
 * Returns the path of the versions manifest for a single component, located
 * at the root of the component (adjacent to its CHANGELOG.md).
 *
 * @param {string} path The component path, as configured in `packages`
 * @returns {string}
 */
export function componentManifestPath(path: string): string {
  return path === ROOT_PROJECT_PATH
    ? MANIFEST_FILE
    : `${path}/${MANIFEST_FILE}`;
}

/**
 * Fetches each component's own versions manifest and combines them into a
 * single path => version map. Components without a manifest file are
 * skipped (treated as never released).
 *
 * Each file has the same `{"<path>": "<version>"}` format as the root
 * manifest, but only the entry for its own component is read.
 *
 * @param {Scm} github
 * @param {string[]} paths Configured component paths
 * @param {string} branch Branch to read from
 * @param {Logger} logger
 * @returns {Record<string, Version>}
 */
export async function parseComponentReleasedVersions(
  github: Scm,
  paths: string[],
  branch: string,
  logger: Logger
): Promise<Record<string, Version>> {
  const releasedVersions: Record<string, Version> = {};
  await Promise.all(
    paths.map(async path => {
      const file = componentManifestPath(path);
      try {
        const json = await github.getFileJson<Record<string, string>>(
          file,
          branch
        );
        if (json[path]) {
          releasedVersions[path] = Version.parse(json[path]);
        } else {
          logger.warn(`No version for path '${path}' in ${file}`);
        }
      } catch (e) {
        if (e instanceof FileNotFoundError) {
          logger.info(`No component manifest found at ${file}`);
          return;
        }
        throw e;
      }
    })
  );
  return releasedVersions;
}
