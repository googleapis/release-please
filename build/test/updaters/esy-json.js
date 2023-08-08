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
const esy_json_1 = require("../../src/updaters/ocaml/esy-json");
const version_1 = require("../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('EsyJson', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates version in esy.json file', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './esy.json'), 'utf8').replace(/\r\n/g, '\n');
            const version = new esy_json_1.EsyJson({
                version: version_1.Version.parse('0.6.0'),
            });
            const newContent = version.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=esy-json.js.map