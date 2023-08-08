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
const src_1 = require("../../src");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const changelog_1 = require("../../src/updaters/changelog");
const generic_1 = require("../../src/updaters/generic");
const java_released_1 = require("../../src/updaters/java/java-released");
const maven_1 = require("../../src/strategies/maven");
const pom_xml_1 = require("../../src/updaters/java/pom-xml");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const chai_1 = require("chai");
const sandbox = sinon.createSandbox();
const COMMITS = [
    ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency'),
    ...(0, helpers_1.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('Maven', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await src_1.GitHub.create({
            owner: 'googleapis',
            repo: 'maven-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.it)('updates pom.xml files', async () => {
            var _a;
            const strategy = new maven_1.Maven({
                targetBranch: 'main',
                github,
                extraFiles: ['foo/bar.java'],
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves(['pom.xml', 'submodule/pom.xml']);
            const release = await strategy.buildReleasePullRequest(COMMITS, undefined);
            (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.0.0');
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdates)(updates, 'pom.xml', pom_xml_1.PomXml, java_released_1.JavaReleased, generic_1.Generic);
            (0, helpers_1.assertHasUpdates)(updates, 'submodule/pom.xml', pom_xml_1.PomXml, java_released_1.JavaReleased, generic_1.Generic);
            (0, helpers_1.assertHasUpdates)(updates, 'foo/bar.java', java_released_1.JavaReleased, generic_1.Generic);
        });
        (0, mocha_1.it)('does not update released version for snapshot bump', async () => {
            var _a;
            const strategy = new maven_1.Maven({
                targetBranch: 'main',
                github,
                extraFiles: ['foo/bar.java'],
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves(['pom.xml', 'submodule/pom.xml']);
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3')),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4-SNAPSHOT');
            const updates = release.updates;
            (0, helpers_1.assertHasUpdates)(updates, 'pom.xml', pom_xml_1.PomXml, generic_1.Generic);
            (0, helpers_1.assertHasUpdates)(updates, 'submodule/pom.xml', pom_xml_1.PomXml, generic_1.Generic);
            (0, helpers_1.assertHasUpdates)(updates, 'foo/bar.java', generic_1.Generic);
        });
    });
});
//# sourceMappingURL=maven.js.map