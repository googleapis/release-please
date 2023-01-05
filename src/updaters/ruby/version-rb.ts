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

import {DefaultUpdater} from '../default';
import {RUBY_VERSION_REGEX, stringifyRubyVersion} from './common';

const RUBY_VERSION_RB_REGEX = new RegExp(
  `(["'])(${RUBY_VERSION_REGEX.source})(["'])`
);

/**
 * Updates a versions.rb file which is expected to have a version string.
 */
export class VersionRB extends DefaultUpdater {
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string): string {
    return content.replace(
      RUBY_VERSION_RB_REGEX,
      `$1${stringifyRubyVersion(this.version)}$1`
    );
  }
}
