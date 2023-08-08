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
const github_1 = require("../../../src/github");
const manifest_1 = require("../../../src/manifest");
const helpers_1 = require("../../helpers");
const version_1 = require("../../../src/version");
const cargo_toml_1 = require("../../../src/updaters/rust/cargo-toml");
const common_1 = require("../../../src/updaters/rust/common");
const chai_1 = require("chai");
const changelog_1 = require("../../../src/updaters/changelog");
const release_please_manifest_1 = require("../../../src/updaters/release-please-manifest");
const composite_1 = require("../../../src/updaters/composite");
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
(0, mocha_1.describe)('Plugin compatibility', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'fake-owner',
            repo: 'fake-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('linked-versions and workspace', () => {
        (0, mocha_1.it)('should version bump dependencies together', async () => {
            // Scenario:
            //   - package b depends on a
            //   - package a receives a new feature
            //   - package b version bumps its dependency on a
            //   - package a and b should both use a minor version bump
            (0, helpers_1.mockReleases)(sandbox, github, [
                {
                    id: 123456,
                    sha: 'abc123',
                    tagName: 'pkgA-v1.0.0',
                    url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkgA-v1.0.0',
                },
                {
                    id: 654321,
                    sha: 'abc123',
                    tagName: 'pkgB-v1.0.0',
                    url: 'https://github.com/fake-owner/fake-repo/releases/tag/pkgB-v1.0.0',
                },
            ]);
            (0, helpers_1.mockCommits)(sandbox, github, [
                {
                    sha: 'aaaaaa',
                    message: 'feat: some feature',
                    files: ['packages/rustA/foo'],
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
            ]);
            (0, helpers_1.stubFilesFromFixtures)({
                sandbox,
                github,
                fixturePath: fixturesPath,
                files: [],
                flatten: false,
                targetBranch: 'main',
                inlineFiles: [
                    [
                        'Cargo.toml',
                        '[workspace]\nmembers = ["packages/rustA", "packages/rustB"]',
                    ],
                    [
                        'packages/rustA/Cargo.toml',
                        '[package]\nname = "pkgA"\nversion = "1.0.0"',
                    ],
                    [
                        'packages/rustB/Cargo.toml',
                        '[package]\nname = "pkgB"\nversion = "1.0.0"\n\n[dependencies]\npkgA = { version = "1.0.0", path = "../pkgA" }',
                    ],
                ],
            });
            sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .withArgs('packages/rustA', 'main')
                .resolves(['packages/rustA'])
                .withArgs('packages/rustB', 'main')
                .resolves(['packages/rustB']);
            const manifest = new manifest_1.Manifest(github, 'main', {
                'packages/rustA': {
                    releaseType: 'rust',
                    component: 'pkgA',
                },
                'packages/rustB': {
                    releaseType: 'rust',
                    component: 'pkgB',
                },
            }, {
                'packages/rustA': version_1.Version.parse('1.0.0'),
                'packages/rustB': version_1.Version.parse('1.0.0'),
            }, {
                plugins: [
                    { type: 'cargo-workspace', merge: false },
                    {
                        type: 'linked-versions',
                        groupName: 'my group',
                        components: ['pkgA', 'pkgB'],
                    },
                ],
            });
            const pullRequests = await manifest.buildPullRequests();
            (0, chai_1.expect)(pullRequests).lengthOf(1);
            const pullRequest = pullRequests[0];
            (0, helpers_1.safeSnapshot)(pullRequest.body.toString());
            const updater = (0, helpers_1.assertHasUpdates)(pullRequest.updates, 'packages/rustA/CHANGELOG.md', changelog_1.Changelog).updater;
            (0, chai_1.expect)(updater.version.toString()).to.eql('1.1.0');
            const updaterB = (0, helpers_1.assertHasUpdates)(pullRequest.updates, 'packages/rustB/CHANGELOG.md', changelog_1.Changelog).updater;
            (0, chai_1.expect)(updaterB.version.toString()).to.eql('1.1.0');
            const manifestUpdate = (0, helpers_1.assertHasUpdate)(pullRequest.updates, '.release-please-manifest.json', composite_1.CompositeUpdater);
            (0, chai_1.expect)(manifestUpdate.updater).instanceOf(composite_1.CompositeUpdater);
            const manifestUpdaters = manifestUpdate.updater
                .updaters;
            (0, chai_1.expect)(manifestUpdaters).not.empty;
            for (const manifestUpdater of manifestUpdaters) {
                (0, chai_1.expect)(manifestUpdater).instanceOf(release_please_manifest_1.ReleasePleaseManifest);
                const versionsMap = manifestUpdater
                    .versionsMap;
                (0, chai_1.expect)(versionsMap).to.not.be.undefined;
                for (const [path, version] of versionsMap.entries()) {
                    (0, chai_1.expect)(version.toString(), `${path} version`).to.eql('1.1.0');
                }
            }
        });
    });
});
//# sourceMappingURL=linked-versions-workspace.js.map