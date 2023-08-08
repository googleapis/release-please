"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GemfileLock = exports.buildGemfileLockVersionRegex = void 0;
const default_1 = require("../default");
const common_1 = require("./common");
/**
 * Builds a regex matching a gem version in a Gemfile.lock file.
 * @example
 *    rails (7.0.1)
 *    rails (7.0.1.alpha1)
 */
function buildGemfileLockVersionRegex(gemName) {
    return new RegExp(`s*${gemName} \\(${common_1.RUBY_VERSION_REGEX.source}\\)`);
}
exports.buildGemfileLockVersionRegex = buildGemfileLockVersionRegex;
/**
 * Updates a Gemfile.lock files which is expected to have a local path version string.
 */
class GemfileLock extends default_1.DefaultUpdater {
    constructor(options) {
        super(options);
        this.gemName = options.gemName;
    }
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content) {
        if (!this.gemName) {
            return content;
        }
        // Bundler will convert 1.0.0-alpha1 to 1.0.0.pre.alpha1, so we need to
        // do the same here.
        const versionString = (0, common_1.resolveRubyGemfileLockVersion)(this.version.toString());
        return content.replace(buildGemfileLockVersionRegex(this.gemName), `${this.gemName} (${versionString})`);
    }
}
exports.GemfileLock = GemfileLock;
//# sourceMappingURL=gemfile-lock.js.map