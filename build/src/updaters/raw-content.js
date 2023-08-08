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
exports.RawContent = void 0;
/**
 * This updater ignores previous content and writes the provided
 * content verbatim.
 */
class RawContent {
    /**
     * Create a new RawContent instance
     * @param {string} rawContent The raw content to set as the contents.
     */
    constructor(rawContent) {
        this.rawContent = rawContent;
    }
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(_content) {
        return this.rawContent;
    }
}
exports.RawContent = RawContent;
//# sourceMappingURL=raw-content.js.map