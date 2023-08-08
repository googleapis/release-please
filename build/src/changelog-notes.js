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
exports.buildChangelogSections = void 0;
const DEFAULT_HEADINGS = {
    feat: 'Features',
    fix: 'Bug Fixes',
    perf: 'Performance Improvements',
    deps: 'Dependencies',
    revert: 'Reverts',
    docs: 'Documentation',
    style: 'Styles',
    chore: 'Miscellaneous Chores',
    refactor: 'Code Refactoring',
    test: 'Tests',
    build: 'Build System',
    ci: 'Continuous Integration',
};
function buildChangelogSections(scopes) {
    return scopes.map(scope => {
        return {
            type: scope,
            section: DEFAULT_HEADINGS[scope] || scope,
        };
    });
}
exports.buildChangelogSections = buildChangelogSections;
//# sourceMappingURL=changelog-notes.js.map