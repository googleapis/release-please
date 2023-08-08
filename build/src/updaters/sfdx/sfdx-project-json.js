"use strict";
// Copyright 2023 Google LLC
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
exports.SfdxProjectJson = void 0;
const json_stringify_1 = require("../../util/json-stringify");
const logger_1 = require("../../util/logger");
const default_1 = require("../default");
/**
 * This updates a sfdx sfdx-project.json file's main version.
 */
class SfdxProjectJson extends default_1.DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        const parsed = JSON.parse(content);
        for (const packDir of parsed.packageDirectories) {
            if (packDir.default) {
                logger.info(`updating from ${packDir.versionNumber} to ${this.version}`);
                packDir.versionNumber = `${this.version.toString()}.NEXT`;
            }
        }
        return (0, json_stringify_1.jsonStringify)(parsed, content);
    }
}
exports.SfdxProjectJson = SfdxProjectJson;
//# sourceMappingURL=sfdx-project-json.js.map