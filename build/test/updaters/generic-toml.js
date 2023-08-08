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
const chai_1 = require("chai");
const generic_toml_1 = require("../../src/updaters/generic-toml");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('GenericToml', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates matching entry', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './Cargo.toml'), 'utf8').replace(/\r\n/g, '\n');
            const updater = new generic_toml_1.GenericToml('$.package.version', version_1.Version.parse('v2.3.4'));
            const newContent = updater.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('updates deep entry in toml', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './Cargo.toml'), 'utf8').replace(/\r\n/g, '\n');
            const updater = new generic_toml_1.GenericToml("$['dev-dependencies']..version", version_1.Version.parse('v2.3.4'));
            const newContent = updater.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('ignores non-matching entry', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './Cargo.toml'), 'utf8').replace(/\r\n/g, '\n');
            const updater = new generic_toml_1.GenericToml('$.nonExistent', version_1.Version.parse('v2.3.4'));
            const newContent = updater.updateContent(oldContent);
            (0, chai_1.expect)(newContent).to.eql(oldContent);
        });
        (0, mocha_1.it)('warns on invalid jsonpath', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './Cargo.toml'), 'utf8').replace(/\r\n/g, '\n');
            const updater = new generic_toml_1.GenericToml('bad jsonpath', version_1.Version.parse('v2.3.4'));
            chai_1.assert.throws(() => {
                updater.updateContent(oldContent);
            });
        });
        (0, mocha_1.it)('ignores invalid file', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './toml/invalid.txt'), 'utf8').replace(/\r\n/g, '\n');
            const updater = new generic_toml_1.GenericToml('$.boo', version_1.Version.parse('v2.3.4'));
            const newContent = updater.updateContent(oldContent);
            (0, chai_1.expect)(newContent).to.eql(oldContent);
        });
        (0, mocha_1.it)('updates matching entry with TOML v1.0.0 spec', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './toml/v1.0.0.toml'), 'utf8').replace(/\r\n/g, '\n');
            const updater = new generic_toml_1.GenericToml('$.package.version', version_1.Version.parse('v2.3.4'));
            const newContent = updater.updateContent(oldContent);
            (0, chai_1.expect)(newContent).not.to.eql(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=generic-toml.js.map