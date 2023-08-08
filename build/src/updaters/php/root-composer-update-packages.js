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
exports.RootComposerUpdatePackages = void 0;
const logger_1 = require("../../util/logger");
const json_stringify_1 = require("../../util/json-stringify");
const default_1 = require("../default");
/**
 * Updates a root composer.json
 */
class RootComposerUpdatePackages extends default_1.DefaultUpdater {
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        if (!this.versionsMap || this.versionsMap.size === 0) {
            logger.info('no updates necessary');
            return content;
        }
        const parsed = JSON.parse(content);
        if (this.versionsMap) {
            for (const [key, version] of this.versionsMap.entries()) {
                const toVersion = version.toString() || '1.0.0';
                let fromVersion;
                if (parsed.replace) {
                    fromVersion = parsed.replace[key];
                    parsed.replace[key] = toVersion;
                }
                if (parsed[key]) {
                    fromVersion !== null && fromVersion !== void 0 ? fromVersion : (fromVersion = parsed[key]);
                    parsed[key] = toVersion;
                }
                logger.info(`updating ${key} from ${fromVersion} to ${toVersion}`);
            }
        }
        return (0, json_stringify_1.jsonStringify)(parsed, content);
    }
}
exports.RootComposerUpdatePackages = RootComposerUpdatePackages;
//# sourceMappingURL=root-composer-update-packages.js.map