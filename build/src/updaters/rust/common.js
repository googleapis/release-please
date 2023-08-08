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
exports.parseCargoLockfile = exports.parseCargoManifest = exports.DEP_KINDS = void 0;
const TOML = require("@iarna/toml");
/**
 * All possible dependency kinds for `CargoManifest`,
 * typed properly.
 */
exports.DEP_KINDS = [
    'dependencies',
    'dev-dependencies',
    'build-dependencies',
];
function parseCargoManifest(content) {
    return TOML.parse(content);
}
exports.parseCargoManifest = parseCargoManifest;
function parseCargoLockfile(content) {
    return TOML.parse(content);
}
exports.parseCargoLockfile = parseCargoLockfile;
//# sourceMappingURL=common.js.map