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
const helpers_1 = require("../helpers");
const version_1 = require("../../src/version");
const cargo_workspace_1 = require("../../src/plugins/cargo-workspace");
const chai_1 = require("chai");
const snapshot = require("snap-shot-it");
const raw_content_1 = require("../../src/updaters/raw-content");
const cargo_toml_1 = require("../../src/updaters/rust/cargo-toml");
const common_1 = require("../../src/updaters/rust/common");
const errors_1 = require("../../src/errors");
const assert = require("assert");
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
(0, mocha_1.describe)('CargoWorkspace plugin', () => {
    let github;
    let plugin;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'rust-test-repo',
            defaultBranch: 'main',
        });
        plugin = new cargo_workspace_1.CargoWorkspace(github, 'main', {
            'packages/rustA': {
                releaseType: 'rust',
            },
            'packages/rustB': {
                releaseType: 'rust',
            },
            'packages/rustC': {
                releaseType: 'rust',
            },
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('run', () => {
        (0, mocha_1.it)('rejects if not a workspace', async () => { });
        (0, mocha_1.it)('rejects if no workspace members', async () => { });
        (0, mocha_1.it)('does nothing for non-rust strategies', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('python', 'python', '1.0.0'),
            ];
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).to.eql(candidates);
        });
        (0, mocha_1.it)('handles a single rust package', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('python', 'python', '1.0.0'),
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustA', 'rust', '1.1.2', {
                    component: 'pkgA',
                    updates: [
                        buildMockPackageUpdate('packages/rustA/Cargo.toml', 'packages/rustA/Cargo.toml'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: ['packages/rustA/Cargo.toml'],
                flatten: false,
                targetBranch: 'main',
                inlineFiles: [
                    ['Cargo.toml', '[workspace]\nmembers = ["packages/rustA"]'],
                ],
            });
            plugin = new cargo_workspace_1.CargoWorkspace(github, 'main', {
                python: {
                    releaseType: 'python',
                },
                'packages/rustA': {
                    releaseType: 'rust',
                },
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA']);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(2);
            const rustCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'rust');
            (0, chai_1.expect)(rustCandidate).to.not.be.undefined;
            const updates = rustCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustA/Cargo.toml');
            (0, helpers_1.assertHasUpdate)(updates, 'Cargo.lock');
            snapshot((0, helpers_1.dateSafe)(rustCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('combines rust packages', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustA', 'rust', '1.1.2', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('packages/rustA/Cargo.toml', 'packages/rustA/Cargo.toml'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustD', 'rust', '4.4.5', {
                    component: '@here/pkgD',
                    updates: [
                        buildMockPackageUpdate('packages/rustD/Cargo.toml', 'packages/rustD/Cargo.toml'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: ['packages/rustA/Cargo.toml', 'packages/rustD/Cargo.toml'],
                flatten: false,
                targetBranch: 'main',
                inlineFiles: [
                    [
                        'Cargo.toml',
                        '[workspace]\nmembers = ["packages/rustA", "packages/rustD"]',
                    ],
                ],
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA'])
                .withArgs('packages/rustD', 'main')
                .resolves(['packages/rustD']);
            plugin = new cargo_workspace_1.CargoWorkspace(github, 'main', {
                'packages/rustA': {
                    releaseType: 'rust',
                },
                'packages/rustD': {
                    releaseType: 'rust',
                },
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const rustCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'rust');
            (0, chai_1.expect)(rustCandidate).to.not.be.undefined;
            const updates = rustCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustA/Cargo.toml');
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustD/Cargo.toml');
            snapshot((0, helpers_1.dateSafe)(rustCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('handles glob paths', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustA', 'rust', '1.1.2', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('packages/rustA/Cargo.toml', 'packages/rustA/Cargo.toml'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustD', 'rust', '4.4.5', {
                    component: '@here/pkgD',
                    updates: [
                        buildMockPackageUpdate('packages/rustD/Cargo.toml', 'packages/rustD/Cargo.toml'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: ['packages/rustA/Cargo.toml', 'packages/rustD/Cargo.toml'],
                flatten: false,
                targetBranch: 'main',
                inlineFiles: [['Cargo.toml', '[workspace]\nmembers = ["packages/*"]']],
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/*', 'main')
                .resolves(['packages/rustA', 'packages/rustD']);
            plugin = new cargo_workspace_1.CargoWorkspace(github, 'main', {
                'packages/rustA': {
                    releaseType: 'rust',
                },
                'packages/rustD': {
                    releaseType: 'rust',
                },
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const rustCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'rust');
            (0, chai_1.expect)(rustCandidate).to.not.be.undefined;
            const updates = rustCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustA/Cargo.toml');
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustD/Cargo.toml');
            snapshot((0, helpers_1.dateSafe)(rustCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('walks dependency tree and updates previously untouched packages', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustA', 'rust', '1.1.2', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('packages/rustA/Cargo.toml', 'packages/rustA/Cargo.toml'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustD', 'rust', '4.4.5', {
                    component: '@here/pkgD',
                    updates: [
                        buildMockPackageUpdate('packages/rustD/Cargo.toml', 'packages/rustD/Cargo.toml'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'Cargo.toml',
                    'packages/rustA/Cargo.toml',
                    'packages/rustB/Cargo.toml',
                    'packages/rustC/Cargo.toml',
                    'packages/rustD/Cargo.toml',
                    'packages/rustE/Cargo.toml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA'])
                .withArgs('packages/rustB', 'main')
                .resolves(['packages/rustB'])
                .withArgs('packages/rustC', 'main')
                .resolves(['packages/rustC'])
                .withArgs('packages/rustD', 'main')
                .resolves(['packages/rustD'])
                .withArgs('packages/rustE', 'main')
                .resolves(['packages/rustE']);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const rustCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'rust');
            (0, chai_1.expect)(rustCandidate).to.not.be.undefined;
            const updates = rustCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustA/Cargo.toml', raw_content_1.RawContent);
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustB/Cargo.toml', raw_content_1.RawContent);
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustC/Cargo.toml', raw_content_1.RawContent);
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustD/Cargo.toml', raw_content_1.RawContent);
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustE/Cargo.toml', raw_content_1.RawContent);
            snapshot((0, helpers_1.dateSafe)(rustCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('can skip merging rust packages', async () => {
            // This is the same setup as 'walks dependency tree and updates previously untouched packages'
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustA', 'rust', '1.1.2', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('packages/rustA/Cargo.toml', 'packages/rustA/Cargo.toml'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustD', 'rust', '4.4.5', {
                    component: '@here/pkgD',
                    updates: [
                        buildMockPackageUpdate('packages/rustD/Cargo.toml', 'packages/rustD/Cargo.toml'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'Cargo.toml',
                    'packages/rustA/Cargo.toml',
                    'packages/rustB/Cargo.toml',
                    'packages/rustC/Cargo.toml',
                    'packages/rustD/Cargo.toml',
                    'packages/rustE/Cargo.toml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA'])
                .withArgs('packages/rustB', 'main')
                .resolves(['packages/rustB'])
                .withArgs('packages/rustC', 'main')
                .resolves(['packages/rustC'])
                .withArgs('packages/rustD', 'main')
                .resolves(['packages/rustD'])
                .withArgs('packages/rustE', 'main')
                .resolves(['packages/rustE']);
            plugin = new cargo_workspace_1.CargoWorkspace(github, 'main', {
                'packages/rustA': {
                    releaseType: 'rust',
                },
                'packages/rustD': {
                    releaseType: 'rust',
                },
            }, {
                merge: false,
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(5);
            for (const newCandidate of newCandidates) {
                (0, helpers_1.safeSnapshot)(newCandidate.pullRequest.body.toString());
            }
        });
        (0, mocha_1.it)('appends dependency notes to an updated module', async () => {
            const existingNotes = '### Dependencies\n\n* update dependency foo/bar to 1.2.3';
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustA', 'rust', '1.1.2', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('packages/rustA/Cargo.toml', 'packages/rustA/Cargo.toml'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustB', 'rust', '2.2.3', {
                    component: '@here/pkgB',
                    updates: [
                        buildMockPackageUpdate('packages/rustB/Cargo.toml', 'packages/rustB/Cargo.toml'),
                    ],
                    notes: existingNotes,
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'Cargo.toml',
                    'packages/rustA/Cargo.toml',
                    'packages/rustB/Cargo.toml',
                    'packages/rustC/Cargo.toml',
                    'packages/rustD/Cargo.toml',
                    'packages/rustE/Cargo.toml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA'])
                .withArgs('packages/rustB', 'main')
                .resolves(['packages/rustB'])
                .withArgs('packages/rustC', 'main')
                .resolves(['packages/rustC'])
                .withArgs('packages/rustD', 'main')
                .resolves(['packages/rustD'])
                .withArgs('packages/rustE', 'main')
                .resolves(['packages/rustE']);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const rustCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'rust');
            (0, chai_1.expect)(rustCandidate).to.not.be.undefined;
            const updates = rustCandidate.pullRequest.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustA/Cargo.toml', raw_content_1.RawContent);
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustB/Cargo.toml', raw_content_1.RawContent);
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustC/Cargo.toml', raw_content_1.RawContent);
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustE/Cargo.toml', raw_content_1.RawContent);
            snapshot((0, helpers_1.dateSafe)(rustCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('skips component if not touched', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustB', 'rust', '2.3.0', {
                    component: 'pkgB',
                    updates: [
                        buildMockPackageUpdate('packages/rustB/Cargo.toml', 'packages/rustB/Cargo.toml'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'Cargo.toml',
                    'packages/rustA/Cargo.toml',
                    'packages/rustB/Cargo.toml',
                    'packages/rustC/Cargo.toml',
                    'packages/rustD/Cargo.toml',
                    'packages/rustE/Cargo.toml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA'])
                .withArgs('packages/rustB', 'main')
                .resolves(['packages/rustB'])
                .withArgs('packages/rustC', 'main')
                .resolves(['packages/rustC'])
                .withArgs('packages/rustD', 'main')
                .resolves(['packages/rustD'])
                .withArgs('packages/rustE', 'main')
                .resolves(['packages/rustE']);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).lengthOf(1);
            const rustCandidate = newCandidates.find(candidate => candidate.config.releaseType === 'rust');
            (0, chai_1.expect)(rustCandidate).to.not.be.undefined;
            const updates = rustCandidate.pullRequest.updates;
            // pkgA is not touched and does not have a dependency on pkgB
            (0, helpers_1.assertNoHasUpdate)(updates, 'packages/rustA/Cargo.toml');
            (0, helpers_1.assertNoHasUpdate)(updates, 'packages/rustE/Cargo.toml');
            (0, helpers_1.assertHasUpdate)(updates, 'packages/rustB/Cargo.toml', raw_content_1.RawContent);
            snapshot((0, helpers_1.dateSafe)(rustCandidate.pullRequest.body.toString()));
        });
        (0, mocha_1.it)('handles packages without version', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustA', 'rust', '1.1.2', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('packages/rustA/Cargo.toml', 'packages/rustA/Cargo.toml'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: ['packages/rustA/Cargo.toml'],
                flatten: false,
                targetBranch: 'main',
                inlineFiles: [
                    [
                        'Cargo.toml',
                        '[workspace]\nmembers = ["packages/rustA", "packages/rustB"]',
                    ],
                    [
                        'packages/rustB/Cargo.toml',
                        '[package]\nname = "pkgB"\n\n[dependencies]\npkgA = { version = "1.1.1", path = "../pkgA" }',
                    ],
                ],
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA'])
                .withArgs('packages/rustB', 'main')
                .resolves(['packages/rustB']);
            plugin = new cargo_workspace_1.CargoWorkspace(github, 'main', {
                'packages/rustA': {
                    releaseType: 'rust',
                },
                'packages/rustB': {
                    releaseType: 'rust',
                },
            });
            await assert.rejects(async () => {
                await plugin.run(candidates);
            }, err => {
                return (err instanceof errors_1.ConfigurationError && err.message.includes('missing'));
            });
        });
        (0, mocha_1.it)('handles packages with invalid version', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('packages/rustA', 'rust', '1.1.2', {
                    component: '@here/pkgA',
                    updates: [
                        buildMockPackageUpdate('packages/rustA/Cargo.toml', 'packages/rustA/Cargo.toml'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: ['packages/rustA/Cargo.toml'],
                flatten: false,
                targetBranch: 'main',
                inlineFiles: [
                    [
                        'Cargo.toml',
                        '[workspace]\nmembers = ["packages/rustA", "packages/rustB"]',
                    ],
                    [
                        'packages/rustB/Cargo.toml',
                        '[package]\nname = "pkgB"\nversion = { major = 1, minor = 2, patch = 3 }\n\n[dependencies]\npkgA = { version = "1.1.1", path = "../pkgA" }',
                    ],
                ],
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA'])
                .withArgs('packages/rustB', 'main')
                .resolves(['packages/rustB']);
            plugin = new cargo_workspace_1.CargoWorkspace(github, 'main', {
                'packages/rustA': {
                    releaseType: 'rust',
                },
                'packages/rustB': {
                    releaseType: 'rust',
                },
            });
            await assert.rejects(async () => {
                await plugin.run(candidates);
            }, err => {
                return (err instanceof errors_1.ConfigurationError && err.message.includes('invalid'));
            });
        });
    });
});
//# sourceMappingURL=cargo-workspace.js.map