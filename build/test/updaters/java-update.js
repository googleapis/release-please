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
const fs_1 = require("fs");
const path_1 = require("path");
const snapshot = require("snap-shot-it");
const mocha_1 = require("mocha");
const java_update_1 = require("../../src/updaters/java/java-update");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('JavaUpdate', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates an LTS snapshot version', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './pom-java-lts-snapshot.xml'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('google-auth-library-parent', version_1.Version.parse('v0.16.2-sp.1'));
            const updater = new java_update_1.JavaUpdate({
                versionsMap: versions,
                version: version_1.Version.parse('v0.16.2-sp.1'),
            });
            const newContent = updater.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('only updates current versions for snapshots', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './java-replacements-test.txt'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('module-name', version_1.Version.parse('3.3.3'));
            const updater = new java_update_1.JavaUpdate({
                versionsMap: versions,
                version: version_1.Version.parse('3.3.3'),
                isSnapshot: true,
            });
            const newContent = updater.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('updates all versions for non snapshots', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './java-replacements-test.txt'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('module-name', version_1.Version.parse('3.3.3'));
            const updater = new java_update_1.JavaUpdate({
                versionsMap: versions,
                version: version_1.Version.parse('3.3.3'),
            });
            const newContent = updater.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=java-update.js.map