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
const krm_blueprint_version_1 = require("../../src/updaters/krm/krm-blueprint-version");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures/krm';
(0, mocha_1.describe)('KRM Blueprint', () => {
    const tests = [
        {
            name: 'simpleKRM.yaml',
            previousVersion: '0.2.0',
            expectedVersion: '2.1.0',
        },
        {
            name: 'multiKRMwithFn.yaml',
            previousVersion: '0.2.0',
            expectedVersion: '18.0.0',
        },
    ];
    (0, mocha_1.describe)('updateContent', () => {
        tests.forEach(test => {
            (0, mocha_1.describe)('with previousVersion', () => {
                (0, mocha_1.it)(`updates version in ${test.name}`, async () => {
                    const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, test.name), 'utf8').replace(/\r\n/g, '\n');
                    const versionsMap = new Map();
                    versionsMap.set('previousVersion', version_1.Version.parse(test.previousVersion));
                    const version = new krm_blueprint_version_1.KRMBlueprintVersion({
                        version: version_1.Version.parse(test.expectedVersion),
                        versionsMap,
                    });
                    const newContent = version.updateContent(oldContent);
                    snapshot(newContent);
                });
            });
            (0, mocha_1.describe)('without previousVersion', () => {
                (0, mocha_1.it)(`updates version in ${test.name}`, async () => {
                    const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, test.name), 'utf8').replace(/\r\n/g, '\n');
                    const version = new krm_blueprint_version_1.KRMBlueprintVersion({
                        version: version_1.Version.parse(test.expectedVersion),
                    });
                    const newContent = version.updateContent(oldContent);
                    snapshot(newContent);
                });
            });
        });
    });
});
//# sourceMappingURL=krm-blueprint-version.js.map