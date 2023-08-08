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
const chai_1 = require("chai");
const cargo_lock_1 = require("../../src/updaters/rust/cargo-lock");
const common_1 = require("../../src/updaters/rust/common");
const fixturesPath = './test/updaters/fixtures';
(0, mocha_1.describe)('CargoLock', () => {
    (0, mocha_1.describe)('updateContent', () => {
        (0, mocha_1.it)('refuses to update something that is not a lockfile', async () => {
            const oldContent = '[woops]\nindeed = true';
            const cargoLock = new cargo_lock_1.CargoLock(new Map());
            (0, chai_1.expect)(() => {
                cargoLock.updateContent(oldContent);
            }).to.throw();
        });
        (0, mocha_1.it)('updates the crate version while preserving formatting', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './Cargo.lock'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('delf', '0.2.0');
            const cargoLock = new cargo_lock_1.CargoLock(versions);
            const newContent = cargoLock.updateContent(oldContent);
            const pkg = (0, common_1.parseCargoLockfile)(newContent).package[4];
            (0, chai_1.expect)(pkg).to.deep.include({
                name: 'delf',
                version: '0.2.0',
            });
            snapshot(newContent);
        });
        (0, mocha_1.it)('silently ignores invalid [[package]] entries', async () => {
            const oldContent = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './Cargo-invalid.lock'), 'utf8').replace(/\r\n/g, '\n');
            const versions = new Map();
            versions.set('delf', '0.2.0');
            const cargoLock = new cargo_lock_1.CargoLock(versions);
            const newContent = cargoLock.updateContent(oldContent);
            const pkg = (0, common_1.parseCargoLockfile)(newContent).package[0];
            (0, chai_1.expect)(pkg).to.deep.include({
                name: 'delf',
                version: '0.2.0',
            });
            snapshot(newContent);
        });
    });
});
//# sourceMappingURL=cargo-lock.js.map