"use strict";
// Copyright 2022 Google LLC
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
exports.AlwaysBumpMinor = void 0;
const default_1 = require("./default");
const versioning_strategy_1 = require("../versioning-strategy");
/**
 * This VersioningStrategy always bumps the minor version.
 */
class AlwaysBumpMinor extends default_1.DefaultVersioningStrategy {
    determineReleaseType(_version, _commits) {
        return new versioning_strategy_1.MinorVersionUpdate();
    }
}
exports.AlwaysBumpMinor = AlwaysBumpMinor;
//# sourceMappingURL=always-bump-minor.js.map