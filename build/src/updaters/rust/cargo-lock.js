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
exports.CargoLock = void 0;
const toml_edit_1 = require("../../util/toml-edit");
const common_1 = require("./common");
const logger_1 = require("../../util/logger");
/**
 * Updates `Cargo.lock` lockfiles, preserving formatting and comments.
 */
class CargoLock {
    constructor(versionsMap) {
        this.versionsMap = versionsMap;
    }
    /**
     * Given initial file contents, return updated contents.
     * @param {string} content The initial content
     * @returns {string} The updated content
     */
    updateContent(content, logger = logger_1.logger) {
        let payload = content;
        const parsed = (0, common_1.parseCargoLockfile)(payload);
        if (!parsed.package) {
            logger.error('is not a Cargo lockfile');
            throw new Error('is not a Cargo lockfile');
        }
        // n.b for `replaceTomlString`, we need to keep track of the index
        // (position) of the package we're considering.
        for (let i = 0; i < parsed.package.length; i++) {
            const pkg = parsed.package[i];
            if (!pkg.name) {
                // all `[[package]]` entries should have a name,
                // but if they don't, ignore them silently.
                continue; // to next package
            }
            const nextVersion = this.versionsMap.get(pkg.name);
            if (!nextVersion) {
                // this package is not upgraded.
                continue; // to next package
            }
            // note: in ECMAScript, using strings to index arrays is perfectly valid,
            // which is lucky because `replaceTomlString` expect "all strings" in its
            // `path` argument.
            const packageIndex = i.toString();
            logger.info(`updating ${pkg.name} in`);
            payload = (0, toml_edit_1.replaceTomlValue)(payload, ['package', packageIndex, 'version'], nextVersion.toString());
        }
        return payload;
    }
}
exports.CargoLock = CargoLock;
//# sourceMappingURL=cargo-lock.js.map