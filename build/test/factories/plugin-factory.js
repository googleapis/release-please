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
const mocha_1 = require("mocha");
const plugin_factory_1 = require("../../src/factories/plugin-factory");
const chai_1 = require("chai");
const linked_versions_1 = require("../../src/plugins/linked-versions");
const plugin_1 = require("../../src/plugin");
const src_1 = require("../../src");
const group_priority_1 = require("../../src/plugins/group-priority");
(0, mocha_1.describe)('PluginFactory', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await src_1.GitHub.create({
            owner: 'fake-owner',
            repo: 'fake-repo',
            defaultBranch: 'main',
            token: 'fake-token',
        });
    });
    (0, mocha_1.describe)('buildPlugin', () => {
        const simplePluginTypes = [
            'cargo-workspace',
            'maven-workspace',
            'node-workspace',
        ];
        const repositoryConfig = {
            '.': { releaseType: 'simple' },
        };
        for (const pluginType of simplePluginTypes) {
            (0, mocha_1.it)(`should build a simple ${pluginType}`, () => {
                const plugin = (0, plugin_factory_1.buildPlugin)({
                    github,
                    type: pluginType,
                    targetBranch: 'target-branch',
                    repositoryConfig,
                    manifestPath: '.manifest.json',
                });
                (0, chai_1.expect)(plugin).to.not.be.undefined;
            });
        }
        (0, mocha_1.it)('should throw for unknown type', () => {
            (0, chai_1.expect)(() => (0, plugin_factory_1.buildPlugin)({
                github,
                type: 'non-existent',
                targetBranch: 'target-branch',
                repositoryConfig,
                manifestPath: '.manifest.json',
            })).to.throw();
        });
        (0, mocha_1.it)('should build a linked-versions config', () => {
            const plugin = (0, plugin_factory_1.buildPlugin)({
                github,
                type: {
                    type: 'linked-versions',
                    groupName: 'group-name',
                    components: ['pkg1', 'pkg2'],
                },
                targetBranch: 'target-branch',
                repositoryConfig,
                manifestPath: '.manifest.json',
            });
            (0, chai_1.expect)(plugin).to.not.be.undefined;
            (0, chai_1.expect)(plugin).instanceof(linked_versions_1.LinkedVersions);
        });
        (0, mocha_1.it)('should build a group-priority config', () => {
            const plugin = (0, plugin_factory_1.buildPlugin)({
                github,
                type: {
                    type: 'group-priority',
                    groups: ['snapshot'],
                },
                targetBranch: 'target-branch',
                repositoryConfig,
                manifestPath: '.manifest.json',
            });
            (0, chai_1.expect)(plugin).to.not.be.undefined;
            (0, chai_1.expect)(plugin).instanceof(group_priority_1.GroupPriority);
        });
    });
    (0, mocha_1.describe)('getPluginTypes', () => {
        (0, mocha_1.it)('should return default types', () => {
            const defaultTypes = [
                'cargo-workspace',
                'node-workspace',
                'linked-versions',
            ];
            const types = (0, plugin_factory_1.getPluginTypes)();
            defaultTypes.forEach(type => (0, chai_1.expect)(types).to.contain(type));
        });
    });
    (0, mocha_1.describe)('registerPlugin', () => {
        const pluginType = 'custom-test';
        class CustomTest extends plugin_1.ManifestPlugin {
        }
        afterEach(() => {
            (0, plugin_factory_1.unregisterPlugin)(pluginType);
        });
        (0, mocha_1.it)('should register new releaser', async () => {
            (0, plugin_factory_1.registerPlugin)(pluginType, options => new CustomTest(options.github, options.targetBranch, options.repositoryConfig));
            const pluginOptions = {
                type: pluginType,
                github,
                repositoryConfig: {},
                targetBranch: 'main',
                manifestPath: '.manifest.json',
            };
            const strategy = await (0, plugin_factory_1.buildPlugin)(pluginOptions);
            (0, chai_1.expect)(strategy).to.be.instanceof(CustomTest);
        });
        (0, mocha_1.it)('should return custom type', () => {
            (0, plugin_factory_1.registerPlugin)(pluginType, options => new CustomTest(options.github, options.targetBranch, options.repositoryConfig));
            const allTypes = (0, plugin_factory_1.getPluginTypes)();
            (0, chai_1.expect)(allTypes).to.contain(pluginType);
        });
    });
});
//# sourceMappingURL=plugin-factory.js.map