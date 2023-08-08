"use strict";
// Copyright 2023 Google LLC
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
exports.PrereleaseVersioningStrategy = void 0;
const default_1 = require("./default");
const version_1 = require("../version");
const versioning_strategy_1 = require("../versioning-strategy");
const PRERELEASE_PATTERN = /^(?<type>[a-z]+)(?<number>\d+)$/;
class PrereleasePatchVersionUpdate {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version) {
        if (version.preRelease) {
            const match = version.preRelease.match(PRERELEASE_PATTERN);
            if (match === null || match === void 0 ? void 0 : match.groups) {
                const numberLength = match.groups.number.length;
                const nextPrereleaseNumber = Number(match.groups.number) + 1;
                const paddedNextPrereleaseNumber = `${nextPrereleaseNumber}`.padStart(numberLength, '0');
                const nextPrerelease = `${match.groups.type}${paddedNextPrereleaseNumber}`;
                return new version_1.Version(version.major, version.minor, version.patch, nextPrerelease, version.build);
            }
        }
        return new version_1.Version(version.major, version.minor, version.patch + 1, version.preRelease, version.build);
    }
}
class PrereleaseMinorVersionUpdate {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version) {
        if (version.preRelease) {
            const match = version.preRelease.match(PRERELEASE_PATTERN);
            if (match === null || match === void 0 ? void 0 : match.groups) {
                const numberLength = match.groups.number.length;
                const prereleaseNumber = Number(match.groups.number);
                let nextPrereleaseNumber = 1;
                let nextMinorNumber = version.minor + 1;
                let nextPatchNumber = 0;
                if (version.patch === 0) {
                    // this is already the next minor candidate, then bump the pre-release number
                    nextPrereleaseNumber = prereleaseNumber + 1;
                    nextMinorNumber = version.minor;
                    nextPatchNumber = version.patch;
                }
                const paddedNextPrereleaseNumber = `${nextPrereleaseNumber}`.padStart(numberLength, '0');
                const nextPrerelease = `${match.groups.type}${paddedNextPrereleaseNumber}`;
                return new version_1.Version(version.major, nextMinorNumber, nextPatchNumber, nextPrerelease, version.build);
            }
        }
        return new version_1.Version(version.major, version.minor + 1, 0, version.preRelease, version.build);
    }
}
class PrereleaseMajorVersionUpdate {
    /**
     * Returns the new bumped version
     *
     * @param {Version} version The current version
     * @returns {Version} The bumped version
     */
    bump(version) {
        if (version.preRelease) {
            const match = version.preRelease.match(PRERELEASE_PATTERN);
            if (match === null || match === void 0 ? void 0 : match.groups) {
                const numberLength = match.groups.number.length;
                const prereleaseNumber = Number(match.groups.number);
                let nextPrereleaseNumber = 1;
                let nextMajorNumber = version.major + 1;
                let nextMinorNumber = 0;
                let nextPatchNumber = 0;
                if (version.patch === 0 && version.minor === 0) {
                    // this is already the next major candidate, then bump the pre-release number
                    nextPrereleaseNumber = prereleaseNumber + 1;
                    nextMajorNumber = version.major;
                    nextMinorNumber = version.minor;
                    nextPatchNumber = version.patch;
                }
                const paddedNextPrereleaseNumber = `${nextPrereleaseNumber}`.padStart(numberLength, '0');
                const nextPrerelease = `${match.groups.type}${paddedNextPrereleaseNumber}`;
                return new version_1.Version(nextMajorNumber, nextMinorNumber, nextPatchNumber, nextPrerelease, version.build);
            }
        }
        return new version_1.Version(version.major + 1, 0, 0, version.preRelease, version.build);
    }
}
/**
 * This versioning strategy will increment the pre-release number for patch
 * bumps if there is a pre-release number (preserving any leading 0s).
 * Example: 1.2.3-beta01 -> 1.2.3-beta02.
 */
class PrereleaseVersioningStrategy extends default_1.DefaultVersioningStrategy {
    determineReleaseType(version, commits) {
        // iterate through list of commits and find biggest commit type
        let breaking = 0;
        let features = 0;
        for (const commit of commits) {
            const releaseAs = commit.notes.find(note => note.title === 'RELEASE AS');
            if (releaseAs) {
                // commits are handled newest to oldest, so take the first one (newest) found
                this.logger.debug(`found Release-As: ${releaseAs.text}, forcing version`);
                return new versioning_strategy_1.CustomVersionUpdate(version_1.Version.parse(releaseAs.text).toString());
            }
            if (commit.breaking) {
                breaking++;
            }
            else if (commit.type === 'feat' || commit.type === 'feature') {
                features++;
            }
        }
        if (breaking > 0) {
            if (version.major < 1 && this.bumpMinorPreMajor) {
                return new PrereleaseMinorVersionUpdate();
            }
            else {
                return new PrereleaseMajorVersionUpdate();
            }
        }
        else if (features > 0) {
            if (version.major < 1 && this.bumpPatchForMinorPreMajor) {
                return new PrereleasePatchVersionUpdate();
            }
            else {
                return new PrereleaseMinorVersionUpdate();
            }
        }
        return new PrereleasePatchVersionUpdate();
    }
}
exports.PrereleaseVersioningStrategy = PrereleaseVersioningStrategy;
//# sourceMappingURL=prerelease.js.map