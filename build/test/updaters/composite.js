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
const composite_1 = require("../../src/updaters/composite");
const java_update_1 = require("../../src/updaters/java/java-update");
const version_1 = require("../../src/version");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const helpers_1 = require("../helpers");
class FakeUpdater {
    updateContent(_content) {
        return '';
    }
}
(0, mocha_1.describe)('CompositeUpdater', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('updates content multiple times', async () => {
            const versions1 = new Map();
            const version1 = version_1.Version.parse('1.2.3');
            versions1.set('artifact1', version1);
            const updater1 = new java_update_1.JavaUpdate({
                versionsMap: versions1,
                version: version1,
            });
            const versions2 = new Map();
            const version2 = version_1.Version.parse('2.0.0');
            versions2.set('artifact2', version2);
            const updater2 = new java_update_1.JavaUpdate({
                versionsMap: versions2,
                version: version2,
            });
            const composite = new composite_1.CompositeUpdater(updater1, updater2);
            const input = 'v1: 1.2.2 // {x-version-update:artifact1:current}\nv2: 1.9.9 // {x-version-update:artifact2:current}';
            const output = await composite.updateContent(input);
            (0, chai_1.expect)(output).to.eql('v1: 1.2.3 // {x-version-update:artifact1:current}\nv2: 2.0.0 // {x-version-update:artifact2:current}');
        });
    });
    (0, mocha_1.describe)('mergeUpdates', () => {
        (0, mocha_1.it)('can merge multiple updates', () => {
            const input = [
                {
                    path: 'path1',
                    createIfMissing: false,
                    updater: new FakeUpdater(),
                },
                {
                    path: 'path2',
                    createIfMissing: false,
                    updater: new FakeUpdater(),
                },
                {
                    path: 'path1',
                    createIfMissing: false,
                    updater: new FakeUpdater(),
                },
                {
                    path: 'path1',
                    createIfMissing: false,
                    updater: new FakeUpdater(),
                },
            ];
            const merged = (0, composite_1.mergeUpdates)(input);
            (0, chai_1.expect)(merged).lengthOf(2);
            (0, helpers_1.assertHasUpdate)(merged, 'path1', composite_1.CompositeUpdater);
            (0, helpers_1.assertHasUpdate)(merged, 'path2', FakeUpdater);
        });
        (0, mocha_1.it)('ignores disjoint paths', () => {
            const input = [
                {
                    path: 'path1',
                    createIfMissing: false,
                    updater: new FakeUpdater(),
                },
                {
                    path: 'path2',
                    createIfMissing: false,
                    updater: new FakeUpdater(),
                },
                {
                    path: 'path3',
                    createIfMissing: false,
                    updater: new FakeUpdater(),
                },
                {
                    path: 'path4',
                    createIfMissing: false,
                    updater: new FakeUpdater(),
                },
            ];
            const merged = (0, composite_1.mergeUpdates)(input);
            (0, chai_1.expect)(merged).lengthOf(4);
            (0, helpers_1.assertHasUpdate)(merged, 'path1', FakeUpdater);
            (0, helpers_1.assertHasUpdate)(merged, 'path2', FakeUpdater);
            (0, helpers_1.assertHasUpdate)(merged, 'path3', FakeUpdater);
            (0, helpers_1.assertHasUpdate)(merged, 'path4', FakeUpdater);
        });
    });
});
//# sourceMappingURL=composite.js.map