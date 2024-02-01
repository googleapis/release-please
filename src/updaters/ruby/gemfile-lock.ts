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

import {DefaultUpdater, UpdateOptions} from '../default';
import {RUBY_VERSION_REGEX, resolveRubyGemfileLockVersion} from './common';

export interface GemfileLockOptions extends UpdateOptions {
  gemName: string;
}

/**
 * Builds a regex matching a gem version in a Gemfile.lock file.
 * @example
 *    rails (7.0.1)
 *    rails (7.0.1.alpha1)
 */
export function buildGemfileLockVersionRegex(gemName: string) {
  return new RegExp(`s*${gemName} \\(${RUBY_VERSION_REGEX.source}\\)`);
}

/**
 * Updates a Gemfile.lock files which is expected to have a local path version string.
 */
export class GemfileLock extends DefaultUpdater {
  gemName: string;

  constructor(options: GemfileLockOptions) {
    super(options);
    this.gemName = options.gemName;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string): string {
    if (!this.gemName) {
      return content;
    }

    // Bundler will convert 1.0.0-alpha1 to 1.0.0.pre.alpha1, so we need to
    // do the same here.
    const versionString = resolveRubyGemfileLockVersion(
      this.version.toString()
    );

    return content.replace(
      buildGemfileLockVersionRegex(this.gemName),
      `${this.gemName} (${versionString})`
    );
  }
}
