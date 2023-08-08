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
const python_file_with_version_1 = require("../../src/updaters/python/python-file-with-version");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('version.py', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates version in version.py', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './version.py'), 'utf8').replace(/\r\n/g, '\n');
            const version = new python_file_with_version_1.PythonFileWithVersion({
                version: version_1.Version.parse('0.6.0'),
            });
            const newContent = version.updateContent(oldContent);
            snapshot(newContent);
        });
        (0, mocha_1.it)('updates long patch versions in version.py', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './version-with-long-patch.py'), 'utf8').replace(/\r\n/g, '\n');
            const version = new python_file_with_version_1.PythonFileWithVersion({
                version: version_1.Version.parse('0.5.11'),
            });
            const newContent = version.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
(0, mocha_1.describe)('project/__init__.py', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates version in project/__init__.py', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './project/__init__.py'), 'utf8').replace(/\r\n/g, '\n');
            const version = new python_file_with_version_1.PythonFileWithVersion({
                version: version_1.Version.parse('0.6.0'),
            });
            const newContent = version.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
(0, mocha_1.describe)('src/project/__init__.py', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates version in src/project/__init__.py', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './src/project/__init__.py'), 'utf8').replace(/\r\n/g, '\n');
            const version = new python_file_with_version_1.PythonFileWithVersion({
                version: version_1.Version.parse('0.6.0'),
            });
            const newContent = version.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=python-file-with-version.js.map