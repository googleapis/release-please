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
exports.filterCommits = void 0;
const BREAKING_CHANGE_NOTE = 'BREAKING CHANGE';
const DEFAULT_CHANGELOG_SECTIONS = [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance Improvements' },
    { type: 'revert', section: 'Reverts' },
    { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
    { type: 'docs', section: 'Documentation', hidden: true },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'Continuous Integration', hidden: true },
];
/**
 * Given a set of conventional commits and the configured
 * changelog sections provided by the user, return the set
 * of commits that should be displayed:
 *
 * @param commits
 * @param changelogSections
 * @returns ConventionalCommit[]
 */
function filterCommits(commits, changelogSections) {
    changelogSections = changelogSections !== null && changelogSections !== void 0 ? changelogSections : DEFAULT_CHANGELOG_SECTIONS;
    const hiddenSections = [];
    const visibleSections = [];
    for (const section of changelogSections) {
        if (!section.hidden)
            visibleSections.push(section.type);
        else
            hiddenSections.push(section.type);
    }
    return commits.filter(commit => {
        const isBreaking = commit.notes.find(note => {
            return note.title === BREAKING_CHANGE_NOTE;
        });
        return (visibleSections.includes(commit.type) ||
            (isBreaking && hiddenSections.includes(commit.type)));
    });
}
exports.filterCommits = filterCommits;
//# sourceMappingURL=filter-commits.js.map