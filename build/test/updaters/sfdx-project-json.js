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
const fs_1 = require("fs");
const path_1 = require("path");
const snapshot = require("snap-shot-it");
const mocha_1 = require("mocha");
const version_1 = require("../../src/version");
const sfdx_project_json_1 = require("../../src/updaters/sfdx/sfdx-project-json");
const chai_1 = require("chai");
const fixturesPath = './test/updaters/fixtures/';
(0, mocha_1.describe)('SfdxProjectJson', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates version in sfdx-project.json', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, 'sfdx-project.json'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            const pom = new sfdx_project_json_1.SfdxProjectJson({
                versionsMap: versions,
                version: version_1.Version.parse('v2.3.4'),
            });
            const newContent = pom.updateContent(oldContent);
            snapshot(newContent);
            const parsedNewContent = JSON.parse(newContent);
            (0, chai_1.expect)(parsedNewContent.packageDirectories[0].versionNumber).to.equal('2.3.4.NEXT');
        });
    });
});
//# sourceMappingURL=sfdx-project-json.js.map