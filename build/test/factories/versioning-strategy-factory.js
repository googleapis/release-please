"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const src_1 = require("../../src");
const default_1 = require("../../src/versioning-strategies/default");
const versioning_strategy_factory_1 = require("../../src/factories/versioning-strategy-factory");
(0, mocha_1.describe)('VersioningStrategyFactory', () => {
    const defaultTypes = [
        'default',
        'always-bump-patch',
        'service-pack',
    ];
    let github;
    beforeEach(async () => {
        github = await src_1.GitHub.create({
            owner: 'test-owner',
            repo: 'test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.describe)('buildVersioningStrategy', () => {
        for (const type of defaultTypes) {
            (0, mocha_1.it)(`should build a simple ${type}`, () => {
                const versioningStrategy = (0, versioning_strategy_factory_1.buildVersioningStrategy)({
                    github,
                    type: type,
                });
                (0, chai_1.expect)(versioningStrategy).to.not.be.undefined;
            });
        }
        (0, mocha_1.it)('should throw for unknown type', () => {
            (0, chai_1.expect)(() => (0, versioning_strategy_factory_1.buildVersioningStrategy)({
                github,
                type: 'non-existent',
            })).to.throw();
        });
    });
    (0, mocha_1.describe)('getVersioningStrategyTypes', () => {
        (0, mocha_1.it)('should return default types', () => {
            const types = (0, src_1.getVersioningStrategyTypes)();
            defaultTypes.forEach(type => (0, chai_1.expect)(types).to.contain(type));
        });
    });
    (0, mocha_1.describe)('registerVersioningStrategy', () => {
        const versioningStrategyType = 'custom-test';
        class CustomTest extends default_1.DefaultVersioningStrategy {
        }
        afterEach(() => {
            (0, versioning_strategy_factory_1.unregisterVersioningStrategy)(versioningStrategyType);
        });
        (0, mocha_1.it)('should register new releaser', async () => {
            (0, src_1.registerVersioningStrategy)(versioningStrategyType, options => new CustomTest(options));
            const versioningStrategyOptions = {
                github,
                type: versioningStrategyType,
            };
            const strategy = await (0, versioning_strategy_factory_1.buildVersioningStrategy)(versioningStrategyOptions);
            (0, chai_1.expect)(strategy).to.be.instanceof(CustomTest);
        });
        (0, mocha_1.it)('should return custom type', () => {
            (0, src_1.registerVersioningStrategy)(versioningStrategyType, options => new CustomTest(options));
            const allTypes = (0, src_1.getVersioningStrategyTypes)();
            (0, chai_1.expect)(allTypes).to.contain(versioningStrategyType);
        });
    });
});
//# sourceMappingURL=versioning-strategy-factory.js.map