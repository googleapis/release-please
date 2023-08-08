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
const fs_1 = require("fs");
const path_1 = require("path");
const snapshot = require("snap-shot-it");
const mocha_1 = require("mocha");
const app_json_1 = require("../../../src/updaters/expo/app-json");
const version_1 = require("../../../src/version");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('AppJson', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates the app versions', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './expo/app.json'), 'utf8');
            const packageJson = new app_json_1.AppJson({
                version: version_1.Version.parse('3.2.1'),
                expoSDKVersion: version_1.Version.parse('44.0.0'),
            });
            const newContent = packageJson.updateContent(oldContent);
            snapshot(newContent.replace(/\r\n/g, '\n'));
        });
    });
});
//# sourceMappingURL=app-json.js.map