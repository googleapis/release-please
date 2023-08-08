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
exports.Changelog = void 0;
const default_1 = require("./default");
const DEFAULT_VERSION_HEADER_REGEX = '\n###? v?[0-9[]';
class Changelog extends default_1.DefaultUpdater {
    constructor(options) {
        var _a;
        super(options);
        this.changelogEntry = options.changelogEntry;
        this.versionHeaderRegex = new RegExp((_a = options.versionHeaderRegex) !== null && _a !== void 0 ? _a : DEFAULT_VERSION_HEADER_REGEX, 's');
    }
    updateContent(content) {
        content = content || '';
        // Handle both H2 (features/BREAKING CHANGES) and H3 (fixes).
        const lastEntryIndex = content.search(this.versionHeaderRegex);
        if (lastEntryIndex === -1) {
            if (content) {
                return `${this.header()}\n${this.changelogEntry}\n\n${adjustHeaders(content).trim()}\n`;
            }
            else {
                return `${this.header()}\n${this.changelogEntry}\n`;
            }
        }
        else {
            const before = content.slice(0, lastEntryIndex);
            const after = content.slice(lastEntryIndex);
            return `${before}\n${this.changelogEntry}\n${after}`.trim() + '\n';
        }
    }
    header() {
        return `\
# Changelog
`;
    }
}
exports.Changelog = Changelog;
// Helper to increase markdown H1 headers to H2
function adjustHeaders(content) {
    return content.replace(/^#(\s)/gm, '##$1');
}
//# sourceMappingURL=changelog.js.map