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
const pyproject_toml_1 = require("../../src/updaters/python/pyproject-toml");
const chai_1 = require("chai");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('PyProjectToml', () => {
    (0, mocha_1.it)('refuses to update something that is not a valid pyproject', async () => {
        const oldContent = '[woops]\nindeed = true';
        const pyProject = new pyproject_toml_1.PyProjectToml({
            version: version_1.Version.parse('0.6.0'),
        });
        (0, chai_1.expect)(() => {
            pyProject.updateContent(oldContent);
        }).to.throw();
    });
    (0, mocha_1.it)('refuses to update when version is missing', async () => {
        const oldContent = "[project]\nname = 'project'";
        const pyProject = new pyproject_toml_1.PyProjectToml({
            version: version_1.Version.parse('0.6.0'),
        });
        (0, chai_1.expect)(() => {
            pyProject.updateContent(oldContent);
        }).to.throw();
    });
});
(0, mocha_1.describe)('pyproject-project.toml', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates version in pyproject-project.toml', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './pyproject-project.toml'), 'utf8').replace(/\r\n/g, '\n');
            const version = new pyproject_toml_1.PyProjectToml({
                version: version_1.Version.parse('0.6.0'),
            });
            const newContent = version.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
(0, mocha_1.describe)('pyproject-poetry.toml', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates version in pyproject-poetry.toml', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './pyproject-poetry.toml'), 'utf8').replace(/\r\n/g, '\n');
            const version = new pyproject_toml_1.PyProjectToml({
                version: version_1.Version.parse('0.6.0'),
            });
            const newContent = version.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=pyproject-toml.js.map