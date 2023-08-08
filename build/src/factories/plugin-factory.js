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
exports.getPluginTypes = exports.unregisterPlugin = exports.registerPlugin = exports.buildPlugin = void 0;
const linked_versions_1 = require("../plugins/linked-versions");
const cargo_workspace_1 = require("../plugins/cargo-workspace");
const node_workspace_1 = require("../plugins/node-workspace");
const maven_workspace_1 = require("../plugins/maven-workspace");
const errors_1 = require("../errors");
const sentence_case_1 = require("../plugins/sentence-case");
const group_priority_1 = require("../plugins/group-priority");
const pluginFactories = {
    'linked-versions': options => new linked_versions_1.LinkedVersions(options.github, options.targetBranch, options.repositoryConfig, options.type.groupName, options.type.components, {
        ...options,
        ...options.type,
    }),
    'cargo-workspace': options => new cargo_workspace_1.CargoWorkspace(options.github, options.targetBranch, options.repositoryConfig, {
        ...options,
        ...options.type,
    }),
    'node-workspace': options => new node_workspace_1.NodeWorkspace(options.github, options.targetBranch, options.repositoryConfig, {
        ...options,
        ...options.type,
    }),
    'maven-workspace': options => new maven_workspace_1.MavenWorkspace(options.github, options.targetBranch, options.repositoryConfig, {
        ...options,
        ...options.type,
    }),
    'sentence-case': options => new sentence_case_1.SentenceCase(options.github, options.targetBranch, options.repositoryConfig, options.type.specialWords),
    'group-priority': options => new group_priority_1.GroupPriority(options.github, options.targetBranch, options.repositoryConfig, options.type.groups),
};
function buildPlugin(options) {
    if (typeof options.type === 'object') {
        const builder = pluginFactories[options.type.type];
        if (builder) {
            return builder({
                ...options.type,
                ...options,
            });
        }
        throw new errors_1.ConfigurationError(`Unknown plugin type: ${options.type.type}`, 'core', `${options.github.repository.owner}/${options.github.repository.repo}`);
    }
    else {
        const builder = pluginFactories[options.type];
        if (builder) {
            return builder(options);
        }
        throw new errors_1.ConfigurationError(`Unknown plugin type: ${options.type}`, 'core', `${options.github.repository.owner}/${options.github.repository.repo}`);
    }
}
exports.buildPlugin = buildPlugin;
function registerPlugin(name, pluginBuilder) {
    pluginFactories[name] = pluginBuilder;
}
exports.registerPlugin = registerPlugin;
function unregisterPlugin(name) {
    delete pluginFactories[name];
}
exports.unregisterPlugin = unregisterPlugin;
function getPluginTypes() {
    return Object.keys(pluginFactories).sort();
}
exports.getPluginTypes = getPluginTypes;
//# sourceMappingURL=plugin-factory.js.map