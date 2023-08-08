"use strict";
// Copyright 2022 Google LLC
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
const snapshot = require("snap-shot-it");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const root_composer_update_packages_1 = require("../../src/updaters/php/root-composer-update-packages");
const version_1 = require("../../src/version");
(0, mocha_1.describe)('PHPComposer', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('does not update a version when version is the same', async () => {
            const oldContent = '{"version":"1.0.0","replace":{"version":"1.0.0"}}';
            const version = version_1.Version.parse('1.0.0');
            const versionsMap = new Map();
            const newContent = new root_composer_update_packages_1.RootComposerUpdatePackages({
                version,
                versionsMap,
            }).updateContent(oldContent);
            (0, chai_1.expect)(newContent).to.eq('{"version":"1.0.0","replace":{"version":"1.0.0"}}');
            snapshot(newContent);
        });
        (0, mocha_1.it)('update all versions in composer.json', async () => {
            const oldContent = '{"version":"0.0.0","replace":{"version":"0.0.0"}}';
            const version = version_1.Version.parse('1.0.0');
            const versionsMap = new Map();
            versionsMap.set('version', version);
            const newContent = new root_composer_update_packages_1.RootComposerUpdatePackages({
                version,
                versionsMap,
            }).updateContent(oldContent);
            (0, chai_1.expect)(newContent).to.eq('{"version":"1.0.0","replace":{"version":"1.0.0"}}');
            snapshot(newContent);
        });
        (0, mocha_1.it)('update root version in composer.json', async () => {
            const oldContent = '{"version":"0.0.0"}';
            const version = version_1.Version.parse('1.0.0');
            const versionsMap = new Map();
            versionsMap.set('version', version);
            const newContent = new root_composer_update_packages_1.RootComposerUpdatePackages({
                version,
                versionsMap,
            }).updateContent(oldContent);
            (0, chai_1.expect)(newContent).to.eq('{"version":"1.0.0"}');
            snapshot(newContent);
        });
        (0, mocha_1.it)('update replace version in composer.json when version is present', async () => {
            const oldContent = '{"replace":{"version":"0.0.0"}}';
            const version = version_1.Version.parse('1.0.0');
            const versionsMap = new Map();
            versionsMap.set('version', version);
            const newContent = new root_composer_update_packages_1.RootComposerUpdatePackages({
                version,
                versionsMap,
            }).updateContent(oldContent);
            (0, chai_1.expect)(newContent).to.eq('{"replace":{"version":"1.0.0"}}');
            snapshot(newContent);
        });
        (0, mocha_1.it)('update replace version in composer.json when version is missing', async () => {
            const oldContent = '{"replace":{}}';
            const version = version_1.Version.parse('1.0.0');
            const versionsMap = new Map();
            versionsMap.set('version', version);
            const newContent = new root_composer_update_packages_1.RootComposerUpdatePackages({
                version,
                versionsMap,
            }).updateContent(oldContent);
            (0, chai_1.expect)(newContent).to.eq('{"replace":{"version":"1.0.0"}}');
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=php-composer-update-packages.js.map