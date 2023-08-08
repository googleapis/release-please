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
const sinon = require("sinon");
const maven_workspace_1 = require("../../src/plugins/maven-workspace");
const github_1 = require("../../src/github");
const helpers_1 = require("../helpers");
const chai_1 = require("chai");
const version_1 = require("../../src/version");
const pom_xml_1 = require("../../src/updaters/java/pom-xml");
const raw_content_1 = require("../../src/updaters/raw-content");
const release_please_manifest_1 = require("../../src/updaters/release-please-manifest");
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/plugins/maven-workspace';
(0, mocha_1.describe)('MavenWorkspace plugin', () => {
    let github;
    let plugin;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'maven-test-repo',
            defaultBranch: 'main',
        });
        plugin = new maven_workspace_1.MavenWorkspace(github, 'main', {
            bom: {
                releaseType: 'maven',
            },
            maven1: {
                releaseType: 'maven',
            },
            maven2: {
                releaseType: 'maven',
            },
            maven3: {
                releaseType: 'maven',
            },
            maven4: {
                releaseType: 'maven',
            },
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('run', () => {
        (0, mocha_1.it)('handles a single maven package', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('maven4', 'maven', '4.4.5', {
                    component: 'maven4',
                    updates: [
                        buildMockPackageUpdate('maven4/pom.xml', 'maven4/pom.xml', '4.4.5'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'maven1/pom.xml',
                    'maven2/pom.xml',
                    'maven3/pom.xml',
                    'maven4/pom.xml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves([
                'maven1/pom.xml',
                'maven2/pom.xml',
                'maven3/pom.xml',
                'maven4/pom.xml',
            ]);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).length(1);
            (0, helpers_1.safeSnapshot)(newCandidates[0].pullRequest.body.toString());
            (0, chai_1.expect)(newCandidates[0].pullRequest.body.releaseData).length(1);
        });
        (0, mocha_1.it)('appends to existing candidate', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('maven3', 'maven', '3.3.4', {
                    component: 'maven3',
                    updates: [
                        buildMockPackageUpdate('maven3/pom.xml', 'maven3/pom.xml', '3.3.4'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('maven4', 'maven', '4.4.5', {
                    component: 'maven4',
                    updates: [
                        buildMockPackageUpdate('maven4/pom.xml', 'maven4/pom.xml', '4.4.5'),
                    ],
                    notes: '### Dependencies\n\n* Updated foo to v3',
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'maven1/pom.xml',
                    'maven2/pom.xml',
                    'maven3/pom.xml',
                    'maven4/pom.xml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves([
                'maven1/pom.xml',
                'maven2/pom.xml',
                'maven3/pom.xml',
                'maven4/pom.xml',
            ]);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).length(1);
            (0, helpers_1.safeSnapshot)(newCandidates[0].pullRequest.body.toString());
            (0, chai_1.expect)(newCandidates[0].pullRequest.body.releaseData).length(2);
        });
        (0, mocha_1.it)('appends to existing candidate with special updater', async () => {
            const customUpdater = new raw_content_1.RawContent('some content');
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('maven3', 'maven', '3.3.4', {
                    component: 'maven3',
                    updates: [
                        buildMockPackageUpdate('maven3/pom.xml', 'maven3/pom.xml', '3.3.4'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('maven4', 'maven', '4.4.5', {
                    component: 'maven4',
                    updates: [
                        {
                            path: 'maven4/pom.xml',
                            createIfMissing: false,
                            cachedFileContents: (0, helpers_1.buildGitHubFileContent)(fixturesPath, 'maven4/pom.xml'),
                            updater: customUpdater,
                        },
                    ],
                    notes: '### Dependencies\n\n* Updated foo to v3',
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'maven1/pom.xml',
                    'maven2/pom.xml',
                    'maven3/pom.xml',
                    'maven4/pom.xml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves([
                'maven1/pom.xml',
                'maven2/pom.xml',
                'maven3/pom.xml',
                'maven4/pom.xml',
            ]);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).length(1);
            (0, helpers_1.safeSnapshot)(newCandidates[0].pullRequest.body.toString());
            (0, chai_1.expect)(newCandidates[0].pullRequest.body.releaseData).length(2);
            (0, helpers_1.assertHasUpdates)(newCandidates[0].pullRequest.updates, 'maven4/pom.xml', raw_content_1.RawContent, pom_xml_1.PomXml);
            (0, helpers_1.assertHasUpdates)(newCandidates[0].pullRequest.updates, 'maven3/pom.xml', pom_xml_1.PomXml, pom_xml_1.PomXml);
        });
        (0, mocha_1.it)('walks dependency tree and updates previously untouched packages', async () => {
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('maven1', 'maven', '1.1.2', {
                    component: 'maven1',
                    updates: [
                        buildMockPackageUpdate('maven1/pom.xml', 'maven1/pom.xml', '1.1.2'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'maven1/pom.xml',
                    'maven2/pom.xml',
                    'maven3/pom.xml',
                    'maven4/pom.xml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves([
                'maven1/pom.xml',
                'maven2/pom.xml',
                'maven3/pom.xml',
                'maven4/pom.xml',
            ]);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).length(1);
            (0, helpers_1.safeSnapshot)(newCandidates[0].pullRequest.body.toString());
            (0, chai_1.expect)(newCandidates[0].pullRequest.body.releaseData).length(4);
        });
        (0, mocha_1.it)('skips pom files not configured for release', async () => {
            plugin = new maven_workspace_1.MavenWorkspace(github, 'main', {
                bom: {
                    releaseType: 'maven',
                },
                maven1: {
                    releaseType: 'maven',
                },
                maven2: {
                    releaseType: 'maven',
                },
                maven3: {
                    releaseType: 'maven',
                },
                maven4: {
                    releaseType: 'maven',
                },
            }, {
                considerAllArtifacts: false,
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves([
                'maven1/pom.xml',
                'maven2/pom.xml',
                'maven3/pom.xml',
                'maven4/pom.xml',
                'extra/pom.xml',
            ]);
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('maven1', 'maven', '1.1.2', {
                    component: 'maven1',
                    updates: [
                        buildMockPackageUpdate('maven1/pom.xml', 'maven1/pom.xml', '1.1.2'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'maven1/pom.xml',
                    'maven2/pom.xml',
                    'maven3/pom.xml',
                    'maven4/pom.xml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).length(1);
            (0, helpers_1.safeSnapshot)(newCandidates[0].pullRequest.body.toString());
            (0, chai_1.expect)(newCandidates[0].pullRequest.body.releaseData).length(4);
        });
        (0, mocha_1.it)('can consider all artifacts', async () => {
            plugin = new maven_workspace_1.MavenWorkspace(github, 'main', {
                bom: {
                    component: 'my-bom',
                    releaseType: 'java-yoshi',
                },
                multi1: {
                    component: 'multi1',
                    releaseType: 'java-yoshi',
                },
                multi2: {
                    component: 'multi2',
                    releaseType: 'java-yoshi',
                },
            }, {
                considerAllArtifacts: true,
            });
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('multi1', 'java-yoshi', '1.1.2', {
                    component: 'multi1',
                    updates: [
                        buildMockPackageUpdate('multi1/pom.xml', 'multi1/pom.xml', '1.1.2'),
                        buildMockPackageUpdate('multi1/bom/pom.xml', 'multi1/bom/pom.xml', '1.1.2'),
                        buildMockPackageUpdate('multi1/primary/pom.xml', 'multi1/primary/pom.xml', '1.1.2'),
                        buildMockPackageUpdate('multi1/sub1/pom.xml', 'multi1/sub1/pom.xml', '2.2.3'),
                        buildMockPackageUpdate('multi1/sub2/pom.xml', 'multi1/sub2/pom.xml', '3.3.4'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'bom/pom.xml',
                    'multi1/pom.xml',
                    'multi1/bom/pom.xml',
                    'multi1/primary/pom.xml',
                    'multi1/sub1/pom.xml',
                    'multi1/sub2/pom.xml',
                    'multi2/pom.xml',
                    'multi2/bom/pom.xml',
                    'multi2/primary/pom.xml',
                    'multi2/sub1/pom.xml',
                    'multi2/sub2/pom.xml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves([
                'bom/pom.xml',
                'multi1/pom.xml',
                'multi1/bom/pom.xml',
                'multi1/primary/pom.xml',
                'multi1/sub1/pom.xml',
                'multi1/sub2/pom.xml',
                'multi2/pom.xml',
                'multi2/bom/pom.xml',
                'multi2/primary/pom.xml',
                'multi2/sub1/pom.xml',
                'multi2/sub2/pom.xml',
            ]);
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).length(1);
            (0, chai_1.expect)(newCandidates[0].pullRequest.body.releaseData).length(2);
            (0, helpers_1.safeSnapshot)(newCandidates[0].pullRequest.body.toString());
            const bomUpdate = (0, helpers_1.assertHasUpdate)(newCandidates[0].pullRequest.updates, 'bom/pom.xml', pom_xml_1.PomXml);
            (0, helpers_1.safeSnapshot)(await renderUpdate(github, bomUpdate));
        });
        (0, mocha_1.it)('skips updating manifest with snapshot versions', async () => {
            plugin = new maven_workspace_1.MavenWorkspace(github, 'main', {
                bom: {
                    releaseType: 'maven',
                },
                maven1: {
                    releaseType: 'maven',
                },
                maven2: {
                    releaseType: 'maven',
                },
                maven3: {
                    releaseType: 'maven',
                },
                maven4: {
                    releaseType: 'maven',
                },
            });
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('pom.xml', 'main')
                .resolves([
                'maven1/pom.xml',
                'maven2/pom.xml',
                'maven3/pom.xml',
                'maven4/pom.xml',
            ]);
            const candidates = [
                (0, helpers_1.buildMockCandidatePullRequest)('maven1', 'maven', '1.1.2-SNAPSHOT', {
                    component: 'maven1',
                    updates: [
                        buildMockPackageUpdate('maven1/pom.xml', 'maven1/pom.xml', '1.1.2-SNAPSHOT'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('maven2', 'maven', '2.2.3-SNAPSHOT', {
                    component: 'maven2',
                    updates: [
                        buildMockPackageUpdate('maven2/pom.xml', 'maven2/pom.xml', '2.2.3-SNAPSHOT'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('maven3', 'maven', '3.3.4-SNAPSHOT', {
                    component: 'maven3',
                    updates: [
                        buildMockPackageUpdate('maven3/pom.xml', 'maven3/pom.xml', '3.3.4-SNAPSHOT'),
                    ],
                }),
                (0, helpers_1.buildMockCandidatePullRequest)('maven4', 'maven', '4.4.5-SNAPSHOT', {
                    component: 'maven4',
                    updates: [
                        buildMockPackageUpdate('maven4/pom.xml', 'maven4/pom.xml', '4.4.5-SNAPSHOT'),
                    ],
                }),
            ];
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [
                    'maven1/pom.xml',
                    'maven2/pom.xml',
                    'maven3/pom.xml',
                    'maven4/pom.xml',
                ],
                flatten: false,
                targetBranch: 'main',
            });
            const newCandidates = await plugin.run(candidates);
            (0, chai_1.expect)(newCandidates).length(1);
            const update = (0, helpers_1.assertHasUpdate)(newCandidates[0].pullRequest.updates, '.release-please-manifest.json', release_please_manifest_1.ReleasePleaseManifest);
            const updater = update.updater;
            for (const [_, version] of updater.versionsMap) {
                (0, chai_1.expect)(version.toString()).to.not.include('SNAPSHOT');
            }
        });
    });
});
function buildMockPackageUpdate(path, fixtureName, newVersionString) {
    const cachedFileContents = (0, helpers_1.buildGitHubFileContent)(fixturesPath, fixtureName);
    return {
        path,
        createIfMissing: false,
        cachedFileContents,
        updater: new pom_xml_1.PomXml(version_1.Version.parse(newVersionString)),
    };
}
async function renderUpdate(github, update) {
    const fileContents = update.cachedFileContents || (await github.getFileContents(update.path));
    return update.updater.updateContent(fileContents.parsedContent);
}
//# sourceMappingURL=maven-workspace.js.map