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
const versions_manifest_1 = require("../../src/updaters/java/versions-manifest");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('JavaAuthVersions', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates versions.txt appropriately for non-SNAPSHOT release', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './java-auth-versions.txt'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('google-auth-library', version_1.Version.parse('0.25.0'));
            const javaAuthVersions = new versions_manifest_1.VersionsManifest({
                version: version_1.Version.parse('0.25.0'),
                versionsMap: versions,
            });
            const newContent = javaAuthVersions.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('updates versions.txt appropriately for SNAPSHOT release', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './java-auth-versions.txt'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('google-auth-library-oauth2-http', version_1.Version.parse('0.16.2-SNAPSHOT'));
            const javaAuthVersions = new versions_manifest_1.VersionsManifest({
                version: version_1.Version.parse('0.16.2-SNAPSHOT'),
                versionsMap: versions,
            });
            const newContent = javaAuthVersions.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('updates multiple versions in versions.txt', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './java-auth-versions.txt'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('google-auth-library', version_1.Version.parse('0.25.0'));
            versions.set('google-auth-library-oauth2-http', version_1.Version.parse('0.16.2-SNAPSHOT'));
            const javaAuthVersions = new versions_manifest_1.VersionsManifest({
                versionsMap: versions,
                version: version_1.Version.parse('0.25.0'),
            });
            const newContent = javaAuthVersions.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=java-auth-versions.js.map