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

// Mirrors ROOT_PROJECT_PATH in manifest.ts (not imported to avoid a cycle).
const ROOT_PATH = '.';

/**
 * Normalize a path prefix by removing leading and trailing slashes.
 * The root project path (`.`) normalizes to an empty prefix.
 *
 * @param {string} prefix Optional path prefix
 * @returns {string} The normalized prefix, or '' for no prefix
 */
export function normalizePathPrefix(prefix?: string): string {
  const normalized = prefix
    ? prefix.replace(/^[/\\]/, '').replace(/[/\\]$/, '')
    : '';
  return normalized === ROOT_PATH ? '' : normalized;
}

/**
 * Keep only the paths located under the given prefix and make them
 * relative to it. Paths are returned unchanged if there is no prefix.
 *
 * @param {string[]} paths Repository paths
 * @param {string} prefix A normalized path prefix
 * @returns {string[]} Paths relative to the prefix
 */
export function relativizePaths(paths: string[], prefix: string): string[] {
  if (!prefix) {
    return paths;
  }
  return paths
    .filter(p => p.startsWith(`${prefix}/`))
    .map(p => p.slice(prefix.length + 1));
}

/**
 * Convert a glob pattern into a regular expression matching whole paths.
 * Supports `*`, `**`, `**\/` and `?`.
 *
 * @param {string} glob The glob pattern
 * @returns {RegExp} The equivalent regular expression
 */
export function globToRegex(glob: string): RegExp {
  let reg = '';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      if (i + 1 < glob.length && glob[i + 1] === '*') {
        if (i + 2 < glob.length && glob[i + 2] === '/') {
          reg += '(?:.*\\/)?';
          i += 2;
        } else {
          reg += '.*';
          i++;
        }
      } else {
        reg += '[^/]*';
      }
    } else if (c === '?') {
      reg += '[^/]';
    } else if (
      ['.', '+', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'].includes(c)
    ) {
      reg += '\\' + c;
    } else {
      reg += c;
    }
    i++;
  }
  return new RegExp(`^${reg}$`);
}
