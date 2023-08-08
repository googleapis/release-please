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
const apis_1 = require("../../../src/updaters/dotnet/apis");
const version_1 = require("../../../src/version");
const fixturesPath = './test/updaters/fixtures/dotnet';
(0, mocha_1.describe)('Apis', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates the specific version while preserving formatting', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './apis.json'), 'utf8').replace(/\r\n/g, '\n');
            const updater = new apis_1.Apis('Google.Cloud.SecurityCenter.V1', version_1.Version.parse('2.12.0'));
            const newContent = updater.updateContent(oldContent);
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=apis.js.map