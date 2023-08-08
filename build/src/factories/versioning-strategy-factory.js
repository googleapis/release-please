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
exports.getVersioningStrategyTypes = exports.unregisterVersioningStrategy = exports.registerVersioningStrategy = exports.buildVersioningStrategy = void 0;
const default_1 = require("../versioning-strategies/default");
const always_bump_patch_1 = require("../versioning-strategies/always-bump-patch");
const always_bump_minor_1 = require("../versioning-strategies/always-bump-minor");
const always_bump_major_1 = require("../versioning-strategies/always-bump-major");
const service_pack_1 = require("../versioning-strategies/service-pack");
const errors_1 = require("../errors");
const prerelease_1 = require("../versioning-strategies/prerelease");
const versioningTypes = {
    default: options => new default_1.DefaultVersioningStrategy(options),
    'always-bump-patch': options => new always_bump_patch_1.AlwaysBumpPatch(options),
    'always-bump-minor': options => new always_bump_minor_1.AlwaysBumpMinor(options),
    'always-bump-major': options => new always_bump_major_1.AlwaysBumpMajor(options),
    'service-pack': options => new service_pack_1.ServicePackVersioningStrategy(options),
    prerelease: options => new prerelease_1.PrereleaseVersioningStrategy(options),
};
function buildVersioningStrategy(options) {
    const builder = versioningTypes[options.type || 'default'];
    if (builder) {
        return builder(options);
    }
    throw new errors_1.ConfigurationError(`Unknown versioning strategy type: ${options.type}`, 'core', `${options.github.repository.owner}/${options.github.repository.repo}`);
}
exports.buildVersioningStrategy = buildVersioningStrategy;
function registerVersioningStrategy(name, versioningStrategyBuilder) {
    versioningTypes[name] = versioningStrategyBuilder;
}
exports.registerVersioningStrategy = registerVersioningStrategy;
function unregisterVersioningStrategy(name) {
    delete versioningTypes[name];
}
exports.unregisterVersioningStrategy = unregisterVersioningStrategy;
function getVersioningStrategyTypes() {
    return Object.keys(versioningTypes).sort();
}
exports.getVersioningStrategyTypes = getVersioningStrategyTypes;
//# sourceMappingURL=versioning-strategy-factory.js.map