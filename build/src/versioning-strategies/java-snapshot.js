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
exports.JavaSnapshot = void 0;
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
class RemoveSnapshotVersionUpdate {
    constructor(parent) {
        this.parent = parent;
    }
    bump(version) {
        if (this.parent) {
            version = this.parent.bump(version);
        }
        return new version_1.Version(version.major, version.minor, version.patch, version.preRelease
            ? version.preRelease.replace(/-?SNAPSHOT/, '')
            : undefined, version.build);
    }
}
/**
 * This VersioningStrategy is used by Java releases to bump
 * to the next non-snapshot version.
 */
class JavaSnapshot {
    constructor(strategy) {
        this.strategy = strategy;
    }
    determineReleaseType(version, commits) {
        var _a;
        const parentBump = this.strategy.determineReleaseType(version, commits);
        if ((_a = version.preRelease) === null || _a === void 0 ? void 0 : _a.match(/-?SNAPSHOT/)) {
            const patchBumpVersion = this.strategy
                .determineReleaseType(version, [fakeCommit])
                .bump(version);
            const parentBumpVersion = parentBump.bump(version);
            if (patchBumpVersion.toString() === parentBumpVersion.toString()) {
                return new RemoveSnapshotVersionUpdate();
            }
            return new RemoveSnapshotVersionUpdate(parentBump);
        }
        return parentBump;
    }
    bump(version, commits) {
        return this.determineReleaseType(version, commits).bump(version);
    }
}
exports.JavaSnapshot = JavaSnapshot;
//# sourceMappingURL=java-snapshot.js.map