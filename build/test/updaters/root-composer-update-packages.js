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
const root_composer_update_packages_1 = require("../../src/updaters/php/root-composer-update-packages");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('composer-update-package.json', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates all versions in root composer file', async () => {
            const versions = new Map();
            versions.set('google/cloud-automl', version_1.Version.parse('0.8.0'));
            versions.set('google/cloud-talent', version_1.Version.parse('1.0.0'));
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './composer-update-packages.json'), 'utf8').replace(/\r\n/g, '\n');
            const composer = new root_composer_update_packages_1.RootComposerUpdatePackages({
                version: version_1.Version.parse('1.0.0'),
                versionsMap: versions,
            });
            const newContent = composer.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=root-composer-update-packages.js.map