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
exports.Version = void 0;
const semver = require("semver");
const VERSION_REGEX = /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<preRelease>[^+]+))?(\+(?<build>.*))?/;
/**
 * This data class is used to represent a SemVer version.
 */
class Version {
    constructor(major, minor, patch, preRelease, build) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.preRelease = preRelease;
        this.build = build;
    }
    /**
     * Parse a version string into a data class.
     *
     * @param {string} versionString the input version string
     * @returns {Version} the parsed version
     * @throws {Error} if the version string cannot be parsed
     */
    static parse(versionString) {
        const match = versionString.match(VERSION_REGEX);
        if (!(match === null || match === void 0 ? void 0 : match.groups)) {
            throw Error(`unable to parse version string: ${versionString}`);
        }
        const major = Number(match.groups.major);
        const minor = Number(match.groups.minor);
        const patch = Number(match.groups.patch);
        const preRelease = match.groups.preRelease;
        const build = match.groups.build;
        return new Version(major, minor, patch, preRelease, build);
    }
    /**
     * Comparator to other Versions to be used in sorting.
     *
     * @param {Version} other The other version to compare to
     * @returns {number} -1 if this version is earlier, 0 if the versions
     *   are the same, or 1 otherwise.
     */
    compare(other) {
        return semver.compare(this.toString(), other.toString());
    }
    /**
     * Returns a normalized string version of this version.
     *
     * @returns {string}
     */
    toString() {
        const preReleasePart = this.preRelease ? `-${this.preRelease}` : '';
        const buildPart = this.build ? `+${this.build}` : '';
        return `${this.major}.${this.minor}.${this.patch}${preReleasePart}${buildPart}`;
    }
}
exports.Version = Version;
//# sourceMappingURL=version.js.map