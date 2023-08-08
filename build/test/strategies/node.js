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
const mocha_1 = require("mocha");
const node_1 = require("../../src/strategies/node");
const helpers_1 = require("../helpers");
const nock = require("nock");
const sinon = require("sinon");
const github_1 = require("../../src/github");
const version_1 = require("../../src/version");
const tag_name_1 = require("../../src/util/tag-name");
const chai_1 = require("chai");
const package_lock_json_1 = require("../../src/updaters/node/package-lock-json");
const samples_package_json_1 = require("../../src/updaters/node/samples-package-json");
const changelog_1 = require("../../src/updaters/changelog");
const package_json_1 = require("../../src/updaters/node/package-json");
const changelog_json_1 = require("../../src/updaters/changelog-json");
const assert = require("assert");
const errors_1 = require("../../src/errors");
const snapshot = require("snap-shot-it");
nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/node';
const UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
const ISO_DATE_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g; // 2023-01-05T16:42:33.446Z
(0, mocha_1.describe)('Node', () => {
    let github;
    const commits = [
        ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
    ];
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'node-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.it)('returns release PR changes with defaultInitialVersion', async () => {
            var _a;
            const expectedVersion = '1.0.0';
            const strategy = new node_1.Node({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                packageName: 'google-cloud-automl',
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('builds a release pull request', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new node_1.Node({
                targetBranch: 'main',
                github,
                component: 'some-node-package',
                packageName: 'some-node-package',
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'some-node-package'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const pullRequest = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('detects a default component', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new node_1.Node({
                targetBranch: 'main',
                github,
            });
            const commits = [
                ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
            ];
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'node-test-repo'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('package.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'package.json'));
            const pullRequest = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('detects a default packageName', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new node_1.Node({
                targetBranch: 'main',
                github,
                component: 'abc-123',
            });
            const commits = [
                ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
            ];
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'node-test-repo'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('package.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'package.json'));
            const pullRequest = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('handles missing package.json', async () => {
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .rejects(new errors_1.FileNotFoundError('stub/path'));
            const strategy = new node_1.Node({
                targetBranch: 'main',
                github,
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'some-node-package'),
                sha: 'abc123',
                notes: 'some notes',
            };
            assert.rejects(async () => {
                await strategy.buildReleasePullRequest(commits, latestRelease);
            }, errors_1.MissingRequiredFileError);
        });
        (0, mocha_1.it)('updates changelog.json if present', async () => {
            const COMMITS = [
                ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
                ...(0, helpers_1.buildMockConventionalCommit)('chore: update deps'),
                ...(0, helpers_1.buildMockConventionalCommit)('chore!: update a very important dep'),
                ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
                ...(0, helpers_1.buildMockConventionalCommit)('chore: update common templates'),
            ];
            const strategy = new node_1.Node({
                targetBranch: 'main',
                github,
                component: 'google-cloud-node',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('changelog.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'changelog.json'));
            getFileContentsStub
                .withArgs('package.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'package.json'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            const update = (0, helpers_1.assertHasUpdate)(updates, 'changelog.json', changelog_json_1.ChangelogJson);
            const newContent = update.updater.updateContent(JSON.stringify({ entries: [] }));
            snapshot(newContent
                .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
                .replace(UUID_REGEX, 'abc-123-efd-qwerty')
                .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'));
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new node_1.Node({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                packageName: 'google-cloud-automl-pkg',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'package-lock.json', package_lock_json_1.PackageLockJson);
            (0, helpers_1.assertHasUpdate)(updates, 'npm-shrinkwrap.json', package_lock_json_1.PackageLockJson);
            const update = (0, helpers_1.assertHasUpdate)(updates, 'samples/package.json', samples_package_json_1.SamplesPackageJson);
            const updater = update.updater;
            (0, chai_1.expect)(updater.packageName).to.equal('google-cloud-automl-pkg');
            (0, helpers_1.assertHasUpdate)(updates, 'package.json', package_json_1.PackageJson);
        });
    });
});
//# sourceMappingURL=node.js.map