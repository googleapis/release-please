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
exports.getChangelogTypes = exports.unregisterChangelogNotes = exports.registerChangelogNotes = exports.buildChangelogNotes = void 0;
const github_1 = require("../changelog-notes/github");
const default_1 = require("../changelog-notes/default");
const errors_1 = require("../errors");
const changelogNotesFactories = {
    github: options => new github_1.GitHubChangelogNotes(options.github),
    default: options => new default_1.DefaultChangelogNotes(options),
};
function buildChangelogNotes(options) {
    const builder = changelogNotesFactories[options.type];
    if (builder) {
        return builder(options);
    }
    throw new errors_1.ConfigurationError(`Unknown changelog type: ${options.type}`, 'core', `${options.github.repository.owner}/${options.github.repository.repo}`);
}
exports.buildChangelogNotes = buildChangelogNotes;
function registerChangelogNotes(name, changelogNotesBuilder) {
    changelogNotesFactories[name] = changelogNotesBuilder;
}
exports.registerChangelogNotes = registerChangelogNotes;
function unregisterChangelogNotes(name) {
    delete changelogNotesFactories[name];
}
exports.unregisterChangelogNotes = unregisterChangelogNotes;
function getChangelogTypes() {
    return Object.keys(changelogNotesFactories).sort();
}
exports.getChangelogTypes = getChangelogTypes;
//# sourceMappingURL=changelog-notes-factory.js.map