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
exports.RubyYoshi = void 0;
const indent_commit_1 = require("../util/indent-commit");
// Generic
const changelog_1 = require("../updaters/changelog");
// RubyYoshi
const version_rb_1 = require("../updaters/ruby/version-rb");
const base_1 = require("./base");
const fs_1 = require("fs");
const path_1 = require("path");
const CHANGELOG_SECTIONS = [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance Improvements' },
    { type: 'revert', section: 'Reverts' },
    { type: 'docs', section: 'Documentation' },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'Continuous Integration', hidden: true },
];
class RubyYoshi extends base_1.BaseStrategy {
    constructor(options) {
        var _a;
        super({
            ...options,
            changelogSections: CHANGELOG_SECTIONS,
            commitPartial: (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, '../../../templates/commit.hbs'), 'utf8'),
            headerPartial: (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, '../../../templates/header.hbs'), 'utf8'),
            mainTemplate: (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, '../../../templates/template.hbs'), 'utf8'),
            tagSeparator: '/',
        });
        this.versionFile = (_a = options.versionFile) !== null && _a !== void 0 ? _a : '';
    }
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        const versionFile = this.versionFile
            ? this.versionFile
            : `lib/${(this.component || '').replace(/-/g, '/')}/version.rb`;
        updates.push({
            path: this.addPath(versionFile),
            createIfMissing: false,
            updater: new version_rb_1.VersionRB({
                version,
            }),
        });
        return updates;
    }
    async postProcessCommits(commits) {
        commits.forEach(commit => {
            commit.message = (0, indent_commit_1.indentCommit)(commit);
        });
        return commits;
    }
    async buildReleaseNotes(conventionalCommits, newVersion, newVersionTag, latestRelease, commits) {
        const releaseNotes = await super.buildReleaseNotes(conventionalCommits, newVersion, newVersionTag, latestRelease, commits);
        return (releaseNotes
            // Remove links in version title line and standardize on h3
            .replace(/^###? \[([\d.]+)\]\([^)]*\)/gm, '### $1')
            // Remove bolded scope from change lines
            .replace(/^\* \*\*[\w-]+:\*\* /gm, '* ')
            // Remove PR and commit links from pull request title suffixes
            .replace(/(\(\[(\w+)\]\(https:\/\/github\.com\/[^)]*\)\))+\s*$/gm, '')
            // Standardize on h4 for change type subheaders
            .replace(/^### (Features|Bug Fixes|Documentation)$/gm, '#### $1')
            // Collapse 2 or more blank lines
            .replace(/\n{3,}/g, '\n\n'));
    }
}
exports.RubyYoshi = RubyYoshi;
//# sourceMappingURL=ruby-yoshi.js.map