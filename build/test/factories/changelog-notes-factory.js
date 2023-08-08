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
const chai_1 = require("chai");
const src_1 = require("../../src");
const changelog_notes_factory_1 = require("../../src/factories/changelog-notes-factory");
const default_1 = require("../../src/changelog-notes/default");
(0, mocha_1.describe)('ChangelogNotesFactory', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await src_1.GitHub.create({
            owner: 'fake-owner',
            repo: 'fake-repo',
            defaultBranch: 'main',
            token: 'fake-token',
        });
    });
    (0, mocha_1.describe)('buildChangelogNotes', () => {
        const changelogTypes = ['default', 'github'];
        for (const changelogType of changelogTypes) {
            (0, mocha_1.it)(`should build a simple ${changelogType}`, () => {
                const changelogNotes = (0, changelog_notes_factory_1.buildChangelogNotes)({
                    github,
                    type: changelogType,
                });
                (0, chai_1.expect)(changelogNotes).to.not.be.undefined;
            });
        }
        (0, mocha_1.it)('should throw for unknown type', () => {
            (0, chai_1.expect)(() => (0, changelog_notes_factory_1.buildChangelogNotes)({ github, type: 'non-existent' })).to.throw();
        });
    });
    (0, mocha_1.describe)('getChangelogTypes', () => {
        (0, mocha_1.it)('should return default types', () => {
            const defaultTypes = ['default', 'github'];
            const types = (0, src_1.getChangelogTypes)();
            defaultTypes.forEach(type => (0, chai_1.expect)(types).to.contain(type));
        });
    });
    (0, mocha_1.describe)('registerChangelogNotes', () => {
        const changelogType = 'custom-test';
        class CustomTest extends default_1.DefaultChangelogNotes {
        }
        afterEach(() => {
            (0, changelog_notes_factory_1.unregisterChangelogNotes)(changelogType);
        });
        (0, mocha_1.it)('should register new releaser', async () => {
            (0, src_1.registerChangelogNotes)(changelogType, options => new CustomTest(options));
            const changelogNotesOptions = {
                type: changelogType,
                github,
                repositoryConfig: {},
                targetBranch: 'main',
            };
            const strategy = await (0, changelog_notes_factory_1.buildChangelogNotes)(changelogNotesOptions);
            (0, chai_1.expect)(strategy).to.be.instanceof(CustomTest);
        });
        (0, mocha_1.it)('should return custom type', () => {
            (0, src_1.registerChangelogNotes)(changelogType, options => new CustomTest(options));
            const allTypes = (0, src_1.getChangelogTypes)();
            (0, chai_1.expect)(allTypes).to.contain(changelogType);
        });
    });
});
//# sourceMappingURL=changelog-notes-factory.js.map