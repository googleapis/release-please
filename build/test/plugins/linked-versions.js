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
exports.buildMockPackageUpdate = void 0;
const mocha_1 = require("mocha");
const sinon = require("sinon");
const github_1 = require("../../src/github");
const manifest_1 = require("../../src/manifest");
const helpers_1 = require("../helpers");
const version_1 = require("../../src/version");
const cargo_toml_1 = require("../../src/updaters/rust/cargo-toml");
const common_1 = require("../../src/updaters/rust/common");
const chai_1 = require("chai");
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/plugins/cargo-workspace';
function buildMockPackageUpdate(path, fixtureName) {
    var _a;
    const cachedFileContents = (0, helpers_1.buildGitHubFileContent)(fixturesPath, fixtureName);
    const manifest = (0, common_1.parseCargoManifest)(cachedFileContents.parsedContent);
    return {
        path,
        createIfMissing: false,
        cachedFileContents,
        updater: new cargo_toml_1.CargoToml({
            version: version_1.Version.parse(((_a = manifest.package) === null || _a === void 0 ? void 0 : _a.version) || 'FIXME'),
        }),
    };
}
exports.buildMockPackageUpdate = buildMockPackageUpdate;
(0, mocha_1.describe)('LinkedVersions plugin', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'fake-owner',
            repo: 'fake-repo',
            defaultBranch: 'main',
        });
        (0, helpers_1.mockReleases)(sandbox, github, [
            {
                id: 1,
                sha: 'abc123',
                tagName: 'pkg1-v1.0.0',
                url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
            },
            {
                id: 2,
                sha: 'def234',
                tagName: 'pkg2-v0.2.3',
                url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg2-v0.2.3',
            },
            {
                id: 3,
                sha: 'def234',
                tagName: 'pkg3-v0.2.3',
                url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg3-v0.2.3',
            },
            {
                id: 4,
                sha: 'abc123',
                tagName: 'pkg4-v1.0.0',
                url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkg1-v1.0.0',
            },
        ]);
        (0, helpers_1.mockCommits)(sandbox, github, [
            {
                sha: 'aaaaaa',
                message: 'fix: some bugfix',
                files: ['path/a/foo'],
            },
            {
                sha: 'abc123',
                message: 'chore: release main',
                files: [],
                pullRequest: {
                    headBranchName: 'release-please/branches/main',
                    baseBranchName: 'main',
                    number: 123,
                    title: 'chore: release main',
                    body: '',
                    labels: [],
                    files: [],
                    sha: 'abc123',
                },
            },
            {
                sha: 'bbbbbb',
                message: 'fix: some bugfix',
                files: ['path/b/foo'],
            },
            {
                sha: 'cccccc',
                message: 'fix: some bugfix',
                files: ['path/a/foo'],
            },
            {
                sha: 'def234',
                message: 'chore: release main',
                files: [],
                pullRequest: {
                    headBranchName: 'release-please/branches/main',
                    baseBranchName: 'main',
                    number: 123,
                    title: 'chore: release main',
                    body: '',
                    labels: [],
                    files: [],
                    sha: 'def234',
                },
            },
        ]);
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.it)('should sync versions pull requests', async () => {
        const manifest = new manifest_1.Manifest(github, 'target-branch', {
            'path/a': {
                releaseType: 'simple',
                component: 'pkg1',
            },
            'path/b': {
                releaseType: 'simple',
                component: 'pkg2',
            },
            'path/c': {
                releaseType: 'simple',
                component: 'pkg3',
            },
        }, {
            'path/a': version_1.Version.parse('1.0.0'),
            'path/b': version_1.Version.parse('0.2.3'),
            'path/c': version_1.Version.parse('0.2.3'),
        }, {
            plugins: [
                {
                    type: 'linked-versions',
                    groupName: 'group name',
                    components: ['pkg2', 'pkg3'],
                },
            ],
        });
        const pullRequests = await manifest.buildPullRequests();
        (0, chai_1.expect)(pullRequests).lengthOf(1);
        const pullRequest = pullRequests[0];
        const packageData2 = pullRequest.body.releaseData.find(data => data.component === 'pkg2');
        (0, chai_1.expect)(packageData2).to.not.be.undefined;
        const packageData3 = pullRequest.body.releaseData.find(data => data.component === 'pkg3');
        (0, chai_1.expect)(packageData3).to.not.be.undefined;
        (0, chai_1.expect)(packageData2 === null || packageData2 === void 0 ? void 0 : packageData2.version).to.eql(packageData3 === null || packageData3 === void 0 ? void 0 : packageData3.version);
        (0, helpers_1.safeSnapshot)(pullRequest.body.toString());
    });
    (0, mocha_1.it)('should group pull requests', async () => {
        const manifest = new manifest_1.Manifest(github, 'target-branch', {
            'path/a': {
                releaseType: 'simple',
                component: 'pkg1',
            },
            'path/b': {
                releaseType: 'simple',
                component: 'pkg2',
            },
            'path/c': {
                releaseType: 'simple',
                component: 'pkg3',
            },
        }, {
            'path/a': version_1.Version.parse('1.0.0'),
            'path/b': version_1.Version.parse('0.2.3'),
            'path/c': version_1.Version.parse('0.2.3'),
        }, {
            separatePullRequests: true,
            plugins: [
                {
                    type: 'linked-versions',
                    groupName: 'group name',
                    components: ['pkg2', 'pkg3'],
                },
            ],
        });
        const pullRequests = await manifest.buildPullRequests();
        (0, chai_1.expect)(pullRequests).lengthOf(2);
        const singlePullRequest = pullRequests[0];
        (0, helpers_1.safeSnapshot)(singlePullRequest.body.toString());
        const pullRequest = pullRequests[1];
        const packageData2 = pullRequest.body.releaseData.find(data => data.component === 'pkg2');
        (0, chai_1.expect)(packageData2).to.not.be.undefined;
        const packageData3 = pullRequest.body.releaseData.find(data => data.component === 'pkg3');
        (0, chai_1.expect)(packageData3).to.not.be.undefined;
        (0, chai_1.expect)(packageData2 === null || packageData2 === void 0 ? void 0 : packageData2.version).to.eql(packageData3 === null || packageData3 === void 0 ? void 0 : packageData3.version);
        (0, helpers_1.safeSnapshot)(pullRequest.body.toString());
    });
    (0, mocha_1.it)('can skip grouping pull requests', async () => {
        const manifest = new manifest_1.Manifest(github, 'target-branch', {
            'path/a': {
                releaseType: 'simple',
                component: 'pkg1',
            },
            'path/b': {
                releaseType: 'simple',
                component: 'pkg2',
            },
            'path/c': {
                releaseType: 'simple',
                component: 'pkg3',
            },
        }, {
            'path/a': version_1.Version.parse('1.0.0'),
            'path/b': version_1.Version.parse('0.2.3'),
            'path/c': version_1.Version.parse('0.2.3'),
        }, {
            separatePullRequests: true,
            plugins: [
                {
                    type: 'linked-versions',
                    groupName: 'group name',
                    components: ['pkg2', 'pkg3'],
                    merge: false,
                },
            ],
        });
        const pullRequests = await manifest.buildPullRequests();
        for (const pullRequest of pullRequests) {
            (0, helpers_1.safeSnapshot)(pullRequest.body.toString());
        }
    });
    (0, mocha_1.it)('should allow multiple groups of linked versions', async () => {
        const manifest = new manifest_1.Manifest(github, 'target-branch', {
            'path/a': {
                releaseType: 'simple',
                component: 'pkg1',
            },
            'path/b': {
                releaseType: 'simple',
                component: 'pkg2',
            },
            'path/c': {
                releaseType: 'simple',
                component: 'pkg3',
            },
            'path/d': {
                releaseType: 'simple',
                component: 'pkg4',
            },
        }, {
            'path/a': version_1.Version.parse('1.0.0'),
            'path/b': version_1.Version.parse('0.2.3'),
            'path/c': version_1.Version.parse('0.2.3'),
            'path/d': version_1.Version.parse('1.0.0'),
        }, {
            separatePullRequests: true,
            plugins: [
                {
                    type: 'linked-versions',
                    groupName: 'group name',
                    components: ['pkg2', 'pkg3'],
                },
                {
                    type: 'linked-versions',
                    groupName: 'second group name',
                    components: ['pkg1', 'pkg4'],
                },
            ],
        });
        const pullRequests = await manifest.buildPullRequests();
        (0, chai_1.expect)(pullRequests).lengthOf(2);
        const groupPullRequest1 = pullRequests[1];
        const packageData1 = groupPullRequest1.body.releaseData.find(data => data.component === 'pkg1');
        (0, chai_1.expect)(packageData1).to.not.be.undefined;
        const packageData4 = groupPullRequest1.body.releaseData.find(data => data.component === 'pkg4');
        (0, chai_1.expect)(packageData4).to.not.be.undefined;
        (0, helpers_1.safeSnapshot)(groupPullRequest1.body.toString());
        const groupPullRequest2 = pullRequests[0];
        const packageData2 = groupPullRequest2.body.releaseData.find(data => data.component === 'pkg2');
        (0, chai_1.expect)(packageData2).to.not.be.undefined;
        const packageData3 = groupPullRequest2.body.releaseData.find(data => data.component === 'pkg3');
        (0, chai_1.expect)(packageData3).to.not.be.undefined;
        (0, chai_1.expect)(packageData2 === null || packageData2 === void 0 ? void 0 : packageData2.version).to.eql(packageData3 === null || packageData3 === void 0 ? void 0 : packageData3.version);
        (0, helpers_1.safeSnapshot)(groupPullRequest2.body.toString());
        (0, chai_1.expect)(groupPullRequest1.headRefName).not.to.eql(groupPullRequest2.headRefName);
        (0, chai_1.expect)(groupPullRequest1.headRefName).to.not.include(' ');
        (0, chai_1.expect)(groupPullRequest2.headRefName).to.not.include(' ');
    });
});
//# sourceMappingURL=linked-versions.js.map