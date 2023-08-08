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
const chai_1 = require("chai");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('VersionManifest', () => {
    (0, mocha_1.describe)('parseVersions', () => {
        (0, mocha_1.it)('parses multiple versions in versions.txt', async () => {
            var _a, _b, _c, _d, _e;
            const content = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './versions.txt'), 'utf8').replace(/\r\n/g, '\n');
            const versionsMap = versions_manifest_1.VersionsManifest.parseVersions(content);
            (0, chai_1.expect)((_a = versionsMap.get('google-cloud-trace')) === null || _a === void 0 ? void 0 : _a.toString()).to.equal('0.108.0-beta');
            (0, chai_1.expect)((_b = versionsMap.get('grpc-google-cloud-trace-v1')) === null || _b === void 0 ? void 0 : _b.toString()).to.equal('0.73.0');
            (0, chai_1.expect)((_c = versionsMap.get('grpc-google-cloud-trace-v2')) === null || _c === void 0 ? void 0 : _c.toString()).to.equal('0.73.0');
            (0, chai_1.expect)((_d = versionsMap.get('proto-google-cloud-trace-v1')) === null || _d === void 0 ? void 0 : _d.toString()).to.equal('0.73.0');
            (0, chai_1.expect)((_e = versionsMap.get('grpc-google-cloud-trace-v2')) === null || _e === void 0 ? void 0 : _e.toString()).to.equal('0.73.0');
        });
    });
    (0, mocha_1.describe)('needsSnapshot', () => {
        (0, mocha_1.it)('parses detects a release version', async () => {
            const content = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './versions-release.txt'), 'utf8').replace(/\r\n/g, '\n');
            (0, chai_1.expect)(versions_manifest_1.VersionsManifest.needsSnapshot(content)).to.equal(true);
        });
        (0, mocha_1.it)('parses detects an existing snapshot version', async () => {
            const content = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './versions.txt'), 'utf8').replace(/\r\n/g, '\n');
            (0, chai_1.expect)(versions_manifest_1.VersionsManifest.needsSnapshot(content)).to.equal(false);
        });
    });
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates versions.txt with snapshot released version', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './versions-double-snapshot.txt'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('google-cloud-trace', version_1.Version.parse('0.109.0'));
            versions.set('grpc-google-cloud-trace-v1', version_1.Version.parse('0.74.0'));
            const javaAuthVersions = new versions_manifest_1.VersionsManifest({
                versionsMap: versions,
                version: version_1.Version.parse('1.2.3'),
            });
            const newContent = javaAuthVersions.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=version-manifest.js.map