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
exports.CustomVersionUpdate = exports.PatchVersionUpdate = exports.MinorVersionUpdate = exports.MajorVersionUpdate = void 0;
const version_1 = require("./version");
/**
 * This VersionUpdater performs a SemVer major version bump.
 */
class MajorVersionUpdate {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version) {
        return new version_1.Version(version.major + 1, 0, 0, version.preRelease, version.build);
    }
}
exports.MajorVersionUpdate = MajorVersionUpdate;
/**
 * This VersionUpdater performs a SemVer minor version bump.
 */
class MinorVersionUpdate {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version) {
        return new version_1.Version(version.major, version.minor + 1, 0, version.preRelease, version.build);
    }
}
exports.MinorVersionUpdate = MinorVersionUpdate;
/**
 * This VersionUpdater performs a SemVer patch version bump.
 */
class PatchVersionUpdate {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version) {
        return new version_1.Version(version.major, version.minor, version.patch + 1, version.preRelease, version.build);
    }
}
exports.PatchVersionUpdate = PatchVersionUpdate;
/**
 * This VersionUpdater sets the version to a specific version.
 */
class CustomVersionUpdate {
    constructor(versionString) {
        this.versionString = versionString;
    }
    /**
     * Returns the new bumped version. This version is specified
     * at initialization.
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(_version) {
        return version_1.Version.parse(this.versionString);
    }
}
exports.CustomVersionUpdate = CustomVersionUpdate;
//# sourceMappingURL=versioning-strategy.js.map