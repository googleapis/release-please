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
exports.JavaAddSnapshot = void 0;
const version_1 = require("../version");
const fakeCommit = {
    message: 'fix: fake fix',
    type: 'fix',
    scope: null,
    notes: [],
    references: [],
    bareMessage: 'fake fix',
    breaking: false,
    sha: 'abc123',
    files: [],
};
class AddSnapshotVersionUpdate {
    constructor(strategy) {
        this.strategy = strategy;
    }
    bump(version) {
        const nextPatch = this.strategy.bump(version, [fakeCommit]);
        return new version_1.Version(nextPatch.major, nextPatch.minor, nextPatch.patch, nextPatch.preRelease ? `${nextPatch.preRelease}-SNAPSHOT` : 'SNAPSHOT', nextPatch.build);
    }
}
/**
 * This VersioningStrategy is used by Java releases to bump
 * to the next snapshot version.
 */
class JavaAddSnapshot {
    constructor(strategy) {
        this.strategy = strategy;
    }
    determineReleaseType(_version, _commits) {
        return new AddSnapshotVersionUpdate(this.strategy);
    }
    bump(version, commits) {
        return this.determineReleaseType(version, commits).bump(version);
    }
}
exports.JavaAddSnapshot = JavaAddSnapshot;
//# sourceMappingURL=java-add-snapshot.js.map