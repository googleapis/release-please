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
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const version_1 = require("../../src/version");
const java_add_snapshot_1 = require("../../src/versioning-strategies/java-add-snapshot");
const default_1 = require("../../src/versioning-strategies/default");
const service_pack_1 = require("../../src/versioning-strategies/service-pack");
const always_bump_patch_1 = require("../../src/versioning-strategies/always-bump-patch");
(0, mocha_1.describe)('JavaAddSnapshot', () => {
    (0, mocha_1.describe)('with DefaultVersioning', () => {
        (0, mocha_1.it)('should bump to snapshot', async () => {
            const strategy = new java_add_snapshot_1.JavaAddSnapshot(new default_1.DefaultVersioningStrategy({}));
            const oldVersion = version_1.Version.parse('1.2.3');
            const newVersion = await strategy.bump(oldVersion, []);
            (0, chai_1.expect)(newVersion.toString()).to.equal('1.2.4-SNAPSHOT');
        });
    });
    (0, mocha_1.describe)('with ServicePack', () => {
        (0, mocha_1.it)('should bump to snapshot', async () => {
            const strategy = new java_add_snapshot_1.JavaAddSnapshot(new service_pack_1.ServicePackVersioningStrategy({}));
            const oldVersion = version_1.Version.parse('1.2.3');
            const newVersion = await strategy.bump(oldVersion, []);
            (0, chai_1.expect)(newVersion.toString()).to.equal('1.2.3-sp.1-SNAPSHOT');
        });
        (0, mocha_1.it)('can bump to next snapshot', async () => {
            const strategy = new java_add_snapshot_1.JavaAddSnapshot(new service_pack_1.ServicePackVersioningStrategy({}));
            const oldVersion = version_1.Version.parse('1.2.3-sp.1');
            const newVersion = await strategy.bump(oldVersion, []);
            (0, chai_1.expect)(newVersion.toString()).to.equal('1.2.3-sp.2-SNAPSHOT');
        });
    });
    (0, mocha_1.describe)('with AlwaysBumpPatch', () => {
        (0, mocha_1.it)('should bump to snapshot', async () => {
            const strategy = new java_add_snapshot_1.JavaAddSnapshot(new always_bump_patch_1.AlwaysBumpPatch({}));
            const oldVersion = version_1.Version.parse('1.2.3');
            const newVersion = await strategy.bump(oldVersion, []);
            (0, chai_1.expect)(newVersion.toString()).to.equal('1.2.4-SNAPSHOT');
        });
    });
});
//# sourceMappingURL=java-add-snapshot.js.map