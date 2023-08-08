"use strict";
// Copyright 2023 Google LLC
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
const github_1 = require("../../src/github");
const java_yoshi_mono_repo_1 = require("../../src/strategies/java-yoshi-mono-repo");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const changelog_1 = require("../../src/updaters/changelog");
const java_update_1 = require("../../src/updaters/java/java-update");
const versions_manifest_1 = require("../../src/updaters/java/versions-manifest");
const composite_1 = require("../../src/updaters/composite");
const snapshot = require("snap-shot-it");
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/java-yoshi';
const COMMITS = [
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0', ['foo/bar/pom.xml']),
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
];
const UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
const ISO_DATE_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g; // 2023-01-05T16:42:33.446Z
(0, mocha_1.describe)('JavaYoshiMonoRepo', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'java-yoshi-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.it)('returns release PR changes with defaultInitialVersion', async () => {
            var _a;
            const expectedVersion = '0.1.0';
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions.txt'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions.txt'));
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'google-cloud-automl'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('returns a snapshot bump PR', async () => {
            var _a;
            const expectedVersion = '0.123.5-SNAPSHOT';
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions-released.txt'));
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'google-cloud-automl'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('handles promotion to 1.0.0', async () => {
            var _a, _b, _c;
            const commits = [
                ...(0, helpers_2.buildMockConventionalCommit)('feat: promote to 1.0.0\n\nRelease-As: 1.0.0'),
            ];
            const expectedVersion = '1.0.0';
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions-with-beta-artifacts.txt'));
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'google-cloud-automl'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const releasePullRequest = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = releasePullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
            const update = (0, helpers_1.assertHasUpdate)(releasePullRequest.updates, 'versions.txt', versions_manifest_1.VersionsManifest);
            const versionsMap = update.updater.versionsMap;
            (0, chai_1.expect)((_b = versionsMap.get('grpc-google-cloud-trace-v1')) === null || _b === void 0 ? void 0 : _b.toString()).to.eql('1.0.0');
            (0, chai_1.expect)((_c = versionsMap.get('grpc-google-cloud-trace-v1beta1')) === null || _c === void 0 ? void 0 : _c.toString()).to.eql('0.74.0');
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions.txt'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'versions.txt', versions_manifest_1.VersionsManifest);
        });
        (0, mocha_1.it)('finds and updates standard files', async () => {
            var _a, _b;
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const findFilesStub = sandbox.stub(github, 'findFilesByFilenameAndRef');
            findFilesStub
                .withArgs('pom.xml', 'main', '.')
                .resolves(['path1/pom.xml', 'path2/pom.xml']);
            findFilesStub
                .withArgs('build.gradle', 'main', '.')
                .resolves(['path1/build.gradle', 'path2/build.gradle']);
            findFilesStub
                .withArgs('dependencies.properties', 'main', '.')
                .resolves(['dependencies.properties']);
            findFilesStub
                .withArgs('README.md', 'main', '.')
                .resolves(['path1/README.md', 'path2/README.md']);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions.txt'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            const { updater } = (0, helpers_1.assertHasUpdate)(updates, 'path1/pom.xml', java_update_1.JavaUpdate);
            const javaUpdater = updater;
            (0, chai_1.expect)(javaUpdater.isSnapshot).to.be.false;
            (0, chai_1.expect)((_b = (_a = javaUpdater.versionsMap) === null || _a === void 0 ? void 0 : _a.get('google-cloud-trace')) === null || _b === void 0 ? void 0 : _b.toString()).to.eql('0.108.1-beta');
            (0, helpers_1.assertHasUpdate)(updates, 'path2/pom.xml', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/build.gradle', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/build.gradle', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'dependencies.properties', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'versions.txt', versions_manifest_1.VersionsManifest);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/README.md', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'path2/README.md', java_update_1.JavaUpdate);
        });
        (0, mocha_1.it)('finds and updates extra files', async () => {
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraFiles: ['foo/bar.java', 'src/version.java'],
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions.txt'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'foo/bar.java', composite_1.CompositeUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'src/version.java', composite_1.CompositeUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'versions.txt', versions_manifest_1.VersionsManifest);
        });
        (0, mocha_1.it)('updates all files for snapshots', async () => {
            var _a, _b;
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const findFilesStub = sandbox.stub(github, 'findFilesByFilenameAndRef');
            findFilesStub
                .withArgs('pom.xml', 'main', '.')
                .resolves(['path1/pom.xml', 'path2/pom.xml']);
            findFilesStub
                .withArgs('build.gradle', 'main', '.')
                .resolves(['path1/build.gradle', 'path2/build.gradle']);
            findFilesStub
                .withArgs('dependencies.properties', 'main', '.')
                .resolves(['dependencies.properties']);
            findFilesStub
                .withArgs('README.md', 'main', '.')
                .resolves(['path1/README.md', 'path2/README.md']);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions-released.txt'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertNoHasUpdate)(updates, 'CHANGELOG.md');
            const { updater } = (0, helpers_1.assertHasUpdate)(updates, 'path1/pom.xml', java_update_1.JavaUpdate);
            const javaUpdater = updater;
            (0, chai_1.expect)(javaUpdater.isSnapshot).to.be.true;
            (0, chai_1.expect)((_b = (_a = javaUpdater.versionsMap) === null || _a === void 0 ? void 0 : _a.get('google-cloud-trace')) === null || _b === void 0 ? void 0 : _b.toString()).to.eql('0.108.1-beta-SNAPSHOT');
            (0, helpers_1.assertHasUpdate)(updates, 'path2/pom.xml', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/build.gradle', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/build.gradle', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'dependencies.properties', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'versions.txt', versions_manifest_1.VersionsManifest);
            (0, helpers_1.assertHasUpdate)(updates, 'path1/README.md', java_update_1.JavaUpdate);
            (0, helpers_1.assertHasUpdate)(updates, 'path2/README.md', java_update_1.JavaUpdate);
        });
        (0, mocha_1.it)('updates changelog.json', async () => {
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions.txt'));
            getFileContentsStub
                .withArgs('foo/.repo-metadata.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, '.repo-metadata.json'));
            getFileContentsStub
                .withArgs('changelog.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'changelog.json'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'versions.txt', versions_manifest_1.VersionsManifest);
            const update = (0, helpers_1.assertHasUpdate)(updates, 'changelog.json', composite_1.CompositeUpdater);
            const newContent = update.updater.updateContent(JSON.stringify({ entries: [] }));
            snapshot(newContent
                .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
                .replace(UUID_REGEX, 'abc-123-efd-qwerty')
                .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'));
        });
        (0, mocha_1.it)('omits non-breaking chores from changelog.json', async () => {
            const COMMITS = [
                ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0', ['foo/bar/pom.xml']),
                ...(0, helpers_2.buildMockConventionalCommit)('chore: update deps', [
                    'foo/bar/pom.xml',
                ]),
                ...(0, helpers_2.buildMockConventionalCommit)('chore!: update a very important dep', [
                    'foo/bar/pom.xml',
                ]),
                ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
                ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
            ];
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions.txt'));
            getFileContentsStub
                .withArgs('foo/.repo-metadata.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, '.repo-metadata.json'));
            getFileContentsStub
                .withArgs('changelog.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'changelog.json'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'versions.txt', versions_manifest_1.VersionsManifest);
            const update = (0, helpers_1.assertHasUpdate)(updates, 'changelog.json', composite_1.CompositeUpdater);
            const newContent = update.updater.updateContent(JSON.stringify({ entries: [] }));
            snapshot(newContent
                .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
                .replace(UUID_REGEX, 'abc-123-efd-qwerty')
                .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'));
        });
        (0, mocha_1.it)('does not update changelog.json if no .repo-metadata.json is found', async () => {
            const COMMITS = [
                ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0', ['bar/bar/pom.xml']),
                ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
                ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
            ];
            const strategy = new java_yoshi_mono_repo_1.JavaYoshiMonoRepo({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('versions.txt', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'versions.txt'));
            getFileContentsStub
                .withArgs('changelog.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'changelog.json'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'versions.txt', versions_manifest_1.VersionsManifest);
            const update = (0, helpers_1.assertHasUpdate)(updates, 'changelog.json', composite_1.CompositeUpdater);
            const newContent = update.updater.updateContent(JSON.stringify({ entries: [] }));
            snapshot(newContent
                .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
                .replace(UUID_REGEX, 'abc-123-efd-qwerty')
                .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'));
        });
    });
});
//# sourceMappingURL=java-yoshi-mono-repo.js.map