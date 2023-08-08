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
const fs_1 = require("fs");
const path_1 = require("path");
const snapshot = require("snap-shot-it");
const mocha_1 = require("mocha");
const changelog_1 = require("../../src/updaters/changelog");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('ChangelogUpdater', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('inserts content at appropriate location if CHANGELOG exists', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './CHANGELOG.md'), 'utf8').replace(/\r\n/g, '\n');
            const changelog = new changelog_1.Changelog({
                changelogEntry: '## 2.0.0\n\n* added a new foo to bar.',
                version: version_1.Version.parse('1.0.0'),
            });
            const newContent = changelog.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('inserts content at appropriate location if CHANGELOG exists, and last release was a patch', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './CHANGELOG-fix.md'), 'utf8').replace(/\r\n/g, '\n');
            const changelog = new changelog_1.Changelog({
                changelogEntry: '## 2.0.0\n\n* added a new foo to bar.',
                version: version_1.Version.parse('1.0.0'),
            });
            const newContent = changelog.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('inserts content at appropriate location in yoshi-ruby style CHANGELOG', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './CHANGELOG-ruby.md'), 'utf8').replace(/\r\n/g, '\n');
            const changelog = new changelog_1.Changelog({
                changelogEntry: '## 0.7.0\n\n* added a new foo to bar.',
                version: version_1.Version.parse('0.7.0'),
            });
            const newContent = changelog.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('populates a new CHANGELOG if none exists', async () => {
            const changelog = new changelog_1.Changelog({
                changelogEntry: '## 2.0.0\n\n* added a new foo to bar.',
                version: version_1.Version.parse('1.0.0'),
            });
            const newContent = changelog.updateContent(undefined);
            snapshot(newContent);
        });
        (0, mocha_1.it)('inserts content at appropriate location in yoshi-dotnet style CHANGELOG', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './CHANGELOG-dotnet.md'), 'utf8').replace(/\r\n/g, '\n');
            const changelog = new changelog_1.Changelog({
                changelogEntry: '## 1.0.0\n\n* added a new foo to bar.',
                version: version_1.Version.parse('1.0.0'),
                versionHeaderRegex: '\n## Version [0-9[]+',
            });
            const newContent = changelog.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('prepends CHANGELOG entries if a different style is found', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './CHANGELOG-non-conforming.md'), 'utf8').replace(/\r\n/g, '\n');
            const changelog = new changelog_1.Changelog({
                changelogEntry: '## 1.0.0\n\n* added a new foo to bar.',
                version: version_1.Version.parse('1.0.0'),
            });
            const newContent = changelog.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=changelog.js.map