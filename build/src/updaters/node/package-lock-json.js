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
exports.PackageLockJson = void 0;
const json_stringify_1 = require("../../util/json-stringify");
const logger_1 = require("../../util/logger");
const default_1 = require("../default");
/**
 * Updates a Node.js package-lock.json file's version and '' package
 * version (for a v2 lock file).
 */
class PackageLockJson extends default_1.DefaultUpdater {
    updateContent(content, logger = logger_1.logger) {
        const parsed = JSON.parse(content);
        logger.info(`updating from ${parsed.version} to ${this.version}`);
        parsed.version = this.version.toString();
        if (parsed.lockfileVersion === 2 || parsed.lockfileVersion === 3) {
            parsed.packages[''].version = this.version.toString();
        }
        return (0, json_stringify_1.jsonStringify)(parsed, content);
    }
}
exports.PackageLockJson = PackageLockJson;
//# sourceMappingURL=package-lock-json.js.map