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
exports.manifestSchema = exports.configSchema = exports.GitHub = exports.setLogger = exports.registerVersioningStrategy = exports.getVersioningStrategyTypes = exports.registerPlugin = exports.getPluginTypes = exports.registerChangelogNotes = exports.getChangelogTypes = exports.registerReleaseType = exports.getReleaserTypes = exports.Manifest = exports.Errors = void 0;
exports.Errors = require("./errors");
var manifest_1 = require("./manifest");
Object.defineProperty(exports, "Manifest", { enumerable: true, get: function () { return manifest_1.Manifest; } });
var factory_1 = require("./factory");
Object.defineProperty(exports, "getReleaserTypes", { enumerable: true, get: function () { return factory_1.getReleaserTypes; } });
Object.defineProperty(exports, "registerReleaseType", { enumerable: true, get: function () { return factory_1.registerReleaseType; } });
var changelog_notes_factory_1 = require("./factories/changelog-notes-factory");
Object.defineProperty(exports, "getChangelogTypes", { enumerable: true, get: function () { return changelog_notes_factory_1.getChangelogTypes; } });
Object.defineProperty(exports, "registerChangelogNotes", { enumerable: true, get: function () { return changelog_notes_factory_1.registerChangelogNotes; } });
var plugin_factory_1 = require("./factories/plugin-factory");
Object.defineProperty(exports, "getPluginTypes", { enumerable: true, get: function () { return plugin_factory_1.getPluginTypes; } });
Object.defineProperty(exports, "registerPlugin", { enumerable: true, get: function () { return plugin_factory_1.registerPlugin; } });
var versioning_strategy_factory_1 = require("./factories/versioning-strategy-factory");
Object.defineProperty(exports, "getVersioningStrategyTypes", { enumerable: true, get: function () { return versioning_strategy_factory_1.getVersioningStrategyTypes; } });
Object.defineProperty(exports, "registerVersioningStrategy", { enumerable: true, get: function () { return versioning_strategy_factory_1.registerVersioningStrategy; } });
var logger_1 = require("./util/logger");
Object.defineProperty(exports, "setLogger", { enumerable: true, get: function () { return logger_1.setLogger; } });
var github_1 = require("./github");
Object.defineProperty(exports, "GitHub", { enumerable: true, get: function () { return github_1.GitHub; } });
exports.configSchema = require('../../schemas/config.json');
exports.manifestSchema = require('../../schemas/manifest.json');
//# sourceMappingURL=index.js.map