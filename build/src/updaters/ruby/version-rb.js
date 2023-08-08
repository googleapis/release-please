"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionRB = void 0;
const default_1 = require("../default");
const common_1 = require("./common");
const RUBY_VERSION_RB_REGEX = new RegExp(`(["'])(${common_1.RUBY_VERSION_REGEX.source})(["'])`);
/**
 * Updates a versions.rb file which is expected to have a version string.
 */
class VersionRB extends default_1.DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content) {
        return content.replace(RUBY_VERSION_RB_REGEX, `$1${(0, common_1.stringifyRubyVersion)(this.version)}$1`);
    }
}
exports.VersionRB = VersionRB;
//# sourceMappingURL=version-rb.js.map