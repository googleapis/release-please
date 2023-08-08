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
const package_lock_json_1 = require("../../src/updaters/node/package-lock-json");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('PackageLockJson', () => {
    (0, mocha_1.describe)('updateContent v1', () => {
        (0, mocha_1.it)('updates the package version', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './package-lock-v1.json'), 'utf8');
            const packageJson = new package_lock_json_1.PackageLockJson({
                version: version_1.Version.parse('14.0.0'),
            });
            const newContent = packageJson.updateContent(oldContent);
            snapshot(newContent.replace(/\r\n/g, '\n'));
        });
    });
    (0, mocha_1.describe)('updateContent v2', () => {
        (0, mocha_1.it)('updates the package version', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './package-lock-v2.json'), 'utf8');
            const packageJson = new package_lock_json_1.PackageLockJson({
                version: version_1.Version.parse('14.0.0'),
            });
            const newContent = packageJson.updateContent(oldContent);
            snapshot(newContent.replace(/\r\n/g, '\n'));
        });
    });
    (0, mocha_1.describe)('updateContent v3', () => {
        (0, mocha_1.it)('updates the package version', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './package-lock-v3.json'), 'utf8');
            const packageJson = new package_lock_json_1.PackageLockJson({
                version: version_1.Version.parse('14.0.0'),
            });
            const newContent = packageJson.updateContent(oldContent);
            snapshot(newContent.replace(/\r\n/g, '\n'));
        });
    });
});
//# sourceMappingURL=package-lock-json.js.map