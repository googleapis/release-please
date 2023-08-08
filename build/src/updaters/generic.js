"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generic = void 0;
const default_1 = require("./default");
const logger_1 = require("../util/logger");
const VERSION_REGEX = /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<preRelease>[\w.]+))?(\+(?<build>[-\w.]+))?/;
const SINGLE_VERSION_REGEX = /\b\d+\b/;
const INLINE_UPDATE_REGEX = /x-release-please-(?<scope>major|minor|patch|version)/;
const BLOCK_START_REGEX = /x-release-please-start-(?<scope>major|minor|patch|version)/;
const BLOCK_END_REGEX = /x-release-please-end/;
/**
 * The Generic updater looks for well known patterns and replaces
 * content. The well known patterns are:
 *
 * 1. `x-release-please-version` if this string is found on the line,
 *    then replace a semver-looking string on that line with the next
 *    version
 * 2. `x-release-please-major` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    major
 * 3. `x-release-please-minor` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    minor
 * 4. `x-release-please-patch` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    patch
 *
 * You can also use a block-based replacement. Content between the
 * opening `x-release-please-start-version` and `x-release-please-end` will
 * be considered for version replacement. You can also open these blocks
 * with `x-release-please-start-<major|minor|patch>` to replace single
 * numbers
 */
class Generic extends default_1.DefaultUpdater {
    constructor(options) {
        var _a, _b, _c;
        super(options);
        this.inlineUpdateRegex = (_a = options.inlineUpdateRegex) !== null && _a !== void 0 ? _a : INLINE_UPDATE_REGEX;
        this.blockStartRegex = (_b = options.blockStartRegex) !== null && _b !== void 0 ? _b : BLOCK_START_REGEX;
        this.blockEndRegex = (_c = options.blockEndRegex) !== null && _c !== void 0 ? _c : BLOCK_END_REGEX;
    }
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        if (!content) {
            return '';
        }
        const newLines = [];
        let blockScope;
        function replaceVersion(line, scope, version) {
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
            var _a, _b;
            let match = line.match(this.inlineUpdateRegex);
            if (match) {
                // replace inline versions
                replaceVersion(line, (((_a = match.groups) === null || _a === void 0 ? void 0 : _a.scope) || 'version'), this.version);
            }
            else if (blockScope) {
                // in a block, so try to replace versions
                replaceVersion(line, blockScope, this.version);
                if (line.match(this.blockEndRegex)) {
                    blockScope = undefined;
                }
            }
            else {
                // look for block start line
                match = line.match(this.blockStartRegex);
                if (match) {
                    if ((_b = match.groups) === null || _b === void 0 ? void 0 : _b.scope) {
                        blockScope = match.groups.scope;
                    }
                    else {
                        blockScope = 'version';
                    }
                }
                newLines.push(line);
            }
        });
        return newLines.join('\n');
    }
}
exports.Generic = Generic;
//# sourceMappingURL=generic.js.map