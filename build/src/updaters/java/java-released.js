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
exports.JavaReleased = void 0;
const generic_1 = require("../generic");
const INLINE_UPDATE_REGEX = /x-release-please-released-(?<scope>major|minor|patch|version)/;
const BLOCK_START_REGEX = /x-release-please-released-start-(?<scope>major|minor|patch|version)/;
const BLOCK_END_REGEX = /x-release-please-released-end/;
const REGEX_OPTIONS = {
    inlineUpdateRegex: INLINE_UPDATE_REGEX,
    blockStartRegex: BLOCK_START_REGEX,
    blockEndRegex: BLOCK_END_REGEX,
};
/**
 * The JavaReleased updater is used only when updating to stable (not SNAPSHOT)
 * versions. It looks for well known patterns and replaces content.
 * The well known patterns are:
 *
 * 1. `x-release-please-released-version` if this string is found on the line,
 *    then replace a semver-looking string on that line with the next
 *    version
 * 2. `x-release-please-released-major` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    major
 * 3. `x-release-please-released-minor` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    minor
 * 4. `x-release-please-released-patch` if this string is found on the line,
 *    then replace an integer looking value with the next version's
 *    patch
 *
 * You can also use a block-based replacement. Content between the
 * opening `x-release-please-released-start-version` and `x-release-please-released-end` will
 * be considered for version replacement. You can also open these blocks
 * with `x-release-please-released-start-<major|minor|patch>` to replace single
 * numbers
 */
class JavaReleased extends generic_1.Generic {
    constructor(options) {
        super({
            ...REGEX_OPTIONS,
            ...options,
        });
    }
}
exports.JavaReleased = JavaReleased;
//# sourceMappingURL=java-released.js.map