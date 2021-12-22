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

import {DefaultUpdater} from './default';
import {Version} from '../version';
import {logger} from '../util/logger';

const VERSION_REGEX =
  /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<preRelease>[\w.]+))?(\+(?<build>[-\w.]+))?/;
const SINGLE_VERSION_REGEX = /\b\d+\b/;
const INLINE_UPDATE_REGEX =
  /x-release-please-(?<scope>major|minor|patch|version)/;
const BLOCK_START_REGEX =
  /x-release-please-start-(?<scope>major|minor|patch|version)/;
const BLOCK_END_REGEX = /x-release-please-end/;

type BlockScope = 'major' | 'minor' | 'patch' | 'version';

/**
 * The Generic updater looks for well known patterns and replaces
 * content. The well known patterns are:
 *
 * 1. `x-release-please-version` if this string is found on the line,
 *    then replace a semver-looking string on that line with the next
 *    version
 * 2. `x-release-please-major` if this string is found on the line,
 *    then replace an integer looking value with the the next version's
 *    major
 * 3. `x-release-please-minor` if this string is found on the line,
 *    then replace an integer looking value with the the next version's
 *    minor
 * 4. `x-release-please-patch` if this string is found on the line,
 *    then replace an integer looking value with the the next version's
 *    patch
 *
 * You can also use a block-based replacement. Content between the
 * opening `x-release-please-start-version` and `x-release-please-end` will
 * be considered for version replacement. You can also open these blocks
 * with `x-release-please-start-<major|minor|patch>` to replace single
 * numbers
 */
export class Generic extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string | undefined): string {
    if (!content) {
      return '';
    }

    const newLines: string[] = [];
    let blockScope: BlockScope | undefined;

    function replaceVersion(line: string, scope: BlockScope, version: Version) {
      switch (scope) {
        case 'major':
          newLines.push(line.replace(SINGLE_VERSION_REGEX, `${version.major}`));
          return;
        case 'minor':
          newLines.push(line.replace(SINGLE_VERSION_REGEX, `${version.minor}`));
          return;
        case 'patch':
          newLines.push(line.replace(SINGLE_VERSION_REGEX, `${version.patch}`));
          return;
        case 'version':
          newLines.push(line.replace(VERSION_REGEX, version.toString()));
          return;
        default:
          logger.warn(`unknown block scope: ${scope}`);
          newLines.push(line);
      }
    }

    content.split(/\r?\n/).forEach(line => {
      let match = line.match(INLINE_UPDATE_REGEX);
      if (match) {
        // replace inline versions
        replaceVersion(
          line,
          (match.groups?.scope || 'version') as BlockScope,
          this.version
        );
      } else if (blockScope) {
        // in a block, so try to replace versions
        replaceVersion(line, blockScope, this.version);
        if (line.match(BLOCK_END_REGEX)) {
          blockScope = undefined;
        }
      } else {
        // look for block start line
        match = line.match(BLOCK_START_REGEX);
        if (match) {
          if (match.groups?.scope) {
            blockScope = match.groups.scope as BlockScope;
          } else {
            blockScope = 'version';
          }
        }
        newLines.push(line);
      }
    });

    return newLines.join('\n');
  }
}
