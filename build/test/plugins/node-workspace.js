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
exports.buildMockPackageUpdate = void 0;
const mocha_1 = require("mocha");
const sinon = require("sinon");
const github_1 = require("../../src/github");
const node_workspace_1 = require("../../src/plugins/node-workspace");
const chai_1 = require("chai");
const version_1 = require("../../src/version");
const package_json_1 = require("../../src/updaters/node/package-json");
const helpers_1 = require("../helpers");
const raw_content_1 = require("../../src/updaters/raw-content");
const snapshot = require("snap-shot-it");
const changelog_1 = require("../../src/updaters/changelog");
const release_please_manifest_1 = require("../../src/updaters/release-please-manifest");
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/plugins/node-workspace';
function buildMockPackageUpdate(path, fixtureName) {
    const cachedFileContents = (0, helpers_1.buildGitHubFileContent)(fixturesPath, fixtureName);
    return {
        path,
        createIfMissing: false,
        cachedFileContents,
        updater: new package_json_1.PackageJson({
            version: version_1.Version.parse(JSON.parse(cachedFileContents.parsedContent).version),
        }),
    };
}
exports.buildMockPackageUpdate = buildMockPackageUpdate;
function buildMockChangelogUpdate(path, versionString, changelogEntry) {
    const cachedFileContents = (0, helpers_1.buildGitHubFileRaw)(changelogEntry);
    return {
        path,
        createIfMissing: false,
        cachedFileContents,
        updater: new changelog_1.Changelog({
            changelogEntry,
            version: version_1.Version.parse(versionString),
        }),
    };
}
function assertHasVersionUpdate(update, expectedVersion) {
    (0, chai_1.expect)(update.updater).instanceof(raw_content_1.RawContent);
    const updater = update.updater;
    const data = JSON.parse(updater.rawContent);
    (0, chai_1.expect)(data.version).to.eql(expectedVersion);
}
(0, mocha_1.describe)('NodeWorkspace plugin', () => {
    let github;
    let plugin;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'node-test-repo',
            defaultBranch: 'main',
        });
        plugin = new node_workspace_1.NodeWorkspace(github, 'main', {
            node1: {
                releaseType: 'node',
            },
            node2: {
                releaseType: 'node',
            },
            node3: {
                releaseType: 'node',
            },
            node4: {
                releaseType: 'node',
            },
            node5: {
                releaseType: 'node',
            },
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('run', () => {
        (0, mocha_1.it)('does nothing for non-node strategies', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('python', 'python', '1.0.0'),
            ];
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).to.eql(candidates);
        });
        (0, mocha_1.it)('handles a single node package', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('python', 'python', '1.0.0'),
                (0, helpers_1.buildMockCandidatePullRequest)('node1', 'node', '3.3.4', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
                    ],
                }),
            ];
            plugin = new node_workspace_1.NodeWorkspace(github, 'main', {
                python: {
                    releaseType: 'python',
                },
                node1: {
                    releaseType: 'node',
                },
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(2);
            const nodeCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'node');
            (0, chai_1.expect)(nodeCandidate).to.not.be.undefined;
            const updates = nodeCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'node1/package.json');
            snapshot((0, helpers_1.dateSafe)(nodeCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('respects version prefix', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('plugin1', 'node', '4.4.4', {
                    component: '@here/plugin1',
                    updates: [
                        buildMockPackageUpdate('plugin1/package.json', 'plugin1/package.json'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('node1', 'node', '2.2.2', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
                    ],
                }),
            ];
            plugin = new node_workspace_1.NodeWorkspace(github, 'main', {
                plugin1: { releaseType: 'node' },
                node1: { releaseType: 'node' },
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const nodeCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'node');
            (0, chai_1.expect)(nodeCandidate).to.not.be.undefined;
            const updates = nodeCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'node1/package.json');
            const update = (0, helpers_1.assertHasUpdate)(updates, 'plugin1/package.json', raw_content_1.RawContent);
            const updater = update.updater;
            snapshot(updater.rawContent);
        });
        (0, mocha_1.it)('combines node packages', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('.', 'node', '5.5.6', {
                    component: '@here/root',
                    updates: [buildMockPackageUpdate('package.json', 'package.json')],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('node1', 'node', '3.3.4', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('node4', 'node', '4.4.5', {
                    component: '@here/pkgD',
                    updates: [
                        buildMockPackageUpdate('node4/package.json', 'node4/package.json'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: ['package.json', 'node1/package.json', 'node4/package.json'],
                flatten: false,
                targetBranch: 'main',
            });
            plugin = new node_workspace_1.NodeWorkspace(github, 'main', {
                '.': {
                    releaseType: 'node',
                },
                node1: {
                    releaseType: 'node',
                },
                node4: {
                    releaseType: 'node',
                },
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const nodeCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'node');
            (0, chai_1.expect)(nodeCandidate).to.not.be.undefined;
            const updates = nodeCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'package.json');
            (0, helpers_1.assertHasUpdate)(updates, 'node1/package.json');
            (0, helpers_1.assertHasUpdate)(updates, 'node4/package.json');
            snapshot((0, helpers_1.dateSafe)(nodeCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('walks dependency tree and updates previously untouched packages', async () => {
            var _a, _b, _c, _d, _e, _f;
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('node1', 'node', '3.3.4', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('node4', 'node', '4.4.5', {
                    component: '@here/pkgD',
                    updates: [
                        buildMockPackageUpdate('node4/package.json', 'node4/package.json'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'node1/package.json',
                    'node2/package.json',
                    'node3/package.json',
                    'node4/package.json',
                    'node5/package.json',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const nodeCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'node');
            (0, chai_1.expect)(nodeCandidate).to.not.be.undefined;
            const updates = nodeCandidate.pullRequest.updates;
            assertHasVersionUpdate((0, helpers_1.assertHasUpdate)(updates, 'node1/package.json', raw_content_1.RawContent), '3.3.4');
            assertHasVersionUpdate((0, helpers_1.assertHasUpdate)(updates, 'node2/package.json', raw_content_1.RawContent), '2.2.3');
            assertHasVersionUpdate((0, helpers_1.assertHasUpdate)(updates, 'node3/package.json', raw_content_1.RawContent), '1.1.2');
            assertHasVersionUpdate((0, helpers_1.assertHasUpdate)(updates, 'node4/package.json', raw_content_1.RawContent), '4.4.5');
            assertHasVersionUpdate((0, helpers_1.assertHasUpdate)(updates, 'node5/package.json', raw_content_1.RawContent), '1.0.1');
            const updater = (0, helpers_1.assertHasUpdate)(updates, '.release-please-manifest.json', release_please_manifest_1.ReleasePleaseManifest).updater;
            (0, chai_1.expect)((_b = (_a = updater.versionsMap) === null || _a === void 0 ? void 0 : _a.get('node2')) === null || _b === void 0 ? void 0 : _b.toString()).to.eql('2.2.3');
            (0, chai_1.expect)((_d = (_c = updater.versionsMap) === null || _c === void 0 ? void 0 : _c.get('node3')) === null || _d === void 0 ? void 0 : _d.toString()).to.eql('1.1.2');
            (0, chai_1.expect)((_f = (_e = updater.versionsMap) === null || _e === void 0 ? void 0 : _e.get('node5')) === null || _f === void 0 ? void 0 : _f.toString()).to.eql('1.0.1');
            snapshot((0, helpers_1.dateSafe)(nodeCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('appends dependency notes to an updated module', async () => {
            const existingNotes = '### Dependencies\n\n* update dependency foo/bar to 1.2.3';
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('node1', 'node', '3.3.4', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
                        buildMockChangelogUpdate('node1/CHANGELOG.md', '3.3.4', 'other notes'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('node2', 'node', '2.2.3', {
                    component: '@here/pkgB',
                    updates: [
                        buildMockPackageUpdate('node2/package.json', 'node2/package.json'),
                        buildMockChangelogUpdate('node2/CHANGELOG.md', '3.3.4', existingNotes),
                    ],
                    notes: existingNotes,
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'node1/package.json',
                    'node2/package.json',
                    'node3/package.json',
                    'node4/package.json',
                    'node5/package.json',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const nodeCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'node');
            (0, chai_1.expect)(nodeCandidate).to.not.be.undefined;
            const updates = nodeCandidate.pullRequest.updates;
            assertHasVersionUpdate((0, helpers_1.assertHasUpdate)(updates, 'node1/package.json', raw_content_1.RawContent), '3.3.4');
            assertHasVersionUpdate((0, helpers_1.assertHasUpdate)(updates, 'node2/package.json', raw_content_1.RawContent), '2.2.3');
            assertHasVersionUpdate((0, helpers_1.assertHasUpdate)(updates, 'node3/package.json', raw_content_1.RawContent), '1.1.2');
            (0, helpers_1.assertNoHasUpdate)(updates, 'node4/package.json');
            snapshot((0, helpers_1.dateSafe)(nodeCandidate.pullRequest.body.toString()));
            const update = (0, helpers_1.assertHasUpdate)(updates, 'node1/CHANGELOG.md', changelog_1.Changelog);
            snapshot(update.updater.changelogEntry);
            const update2 = (0, helpers_1.assertHasUpdate)(updates, 'node2/CHANGELOG.md', changelog_1.Changelog);
            snapshot(update2.updater.changelogEntry);
            const update3 = (0, helpers_1.assertHasUpdate)(updates, 'node3/CHANGELOG.md', changelog_1.Changelog);
            snapshot(update3.updater.changelogEntry);
        });
        (0, mocha_1.it)('should ignore peer dependencies', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('node1', 'node', '3.3.4', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('node1/package.json', 'node1/package.json'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: ['node1/package.json', 'plugin1/package.json'],
                flatten: false,
                targetBranch: 'main',
            });
            plugin = new node_workspace_1.NodeWorkspace(github, 'main', {
                node1: {
                    releaseType: 'node',
                },
                plugin1: {
                    releaseType: 'node',
                },
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const nodeCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'node');
            (0, chai_1.expect)(nodeCandidate).to.not.be.undefined;
            const updates = nodeCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'node1/package.json');
            (0, helpers_1.assertNoHasUpdate)(updates, 'plugin1/package.json');
            snapshot((0, helpers_1.dateSafe)(nodeCandidate.pullRequest.body.toString()));
        });
    });
});
//# sourceMappingURL=node-workspace.js.map