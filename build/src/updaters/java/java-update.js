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
exports.JavaUpdate = void 0;
const default_1 = require("../default");
const logger_1 = require("../../util/logger");
const INLINE_UPDATE_REGEX = /{x-version-update:([\w\-_]+):(current|released)}/;
const BLOCK_START_REGEX = /{x-version-update-start:([\w\-_]+):(current|released)}/;
const BLOCK_END_REGEX = /{x-version-update-end}/;
const VERSION_REGEX = /\d+\.\d+\.\d+(-\w+(\.\d+)?)?(-SNAPSHOT)?/;
/**
 * Updates a file annotated with region markers. These region markers are
 * either denoted inline with `{x-version-update:<component-name>:current|released}`
 * or with a `{x-version-update-start:<component-name>}` and `{x-version-update-end}`.
 */
class JavaUpdate extends default_1.DefaultUpdater {
    constructor(options) {
        super(options);
        this.isSnapshot = !!options.isSnapshot;
    }
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        if (!this.versionsMap) {
            logger.warn('missing versions map');
            return content;
        }
        const newLines = [];
        let blockPackageName = null;
        content.split(/\r?\n/).forEach(line => {
            let match = line.match(INLINE_UPDATE_REGEX);
            if (match && (!this.isSnapshot || match[2] === 'current')) {
                const newVersion = this.versionsMap.get(match[1]);
                if (newVersion) {
                    newLines.push(line.replace(VERSION_REGEX, newVersion.toString()));
                }
                else {
                    newLines.push(line);
                }
            }
            else if (blockPackageName) {
                const newVersion = this.versionsMap.get(blockPackageName);
                if (newVersion) {
                    newLines.push(line.replace(VERSION_REGEX, newVersion.toString()));
                }
                else {
                    newLines.push(line);
                }
                if (line.match(BLOCK_END_REGEX)) {
                    blockPackageName = null;
                }
            }
            else {
                match = line.match(BLOCK_START_REGEX);
                if (match && (!this.isSnapshot || match[2] === 'current')) {
                    blockPackageName = match[1];
                }
                newLines.push(line);
            }
        });
        return newLines.join('\n');
    }
}
exports.JavaUpdate = JavaUpdate;
//# sourceMappingURL=java-update.js.map