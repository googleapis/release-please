"use strict";
// Copyright 2020 Google LLC
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
exports.ModuleVersion = void 0;
const logger_1 = require("../../util/logger");
const default_1 = require("../default");
/**
 * Updates a Terraform Module versions.tf file.
 */
class ModuleVersion extends default_1.DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        const oldVersion = content.match(/v[0-9]+\.[0-9]+\.[0-9]+(-\w+)?/);
        if (oldVersion) {
            logger.info(`updating from ${oldVersion} to v${this.version}`);
        }
        return content.replace(/v[0-9]+\.[0-9]+\.[0-9]+(-\w+)?/g, `v${this.version}`);
    }
}
exports.ModuleVersion = ModuleVersion;
//# sourceMappingURL=module-version.js.map