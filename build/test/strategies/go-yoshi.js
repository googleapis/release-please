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
const chai_1 = require("chai");
const github_1 = require("../../src/github");
const go_yoshi_1 = require("../../src/strategies/go-yoshi");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const changelog_1 = require("../../src/updaters/changelog");
const snapshot = require("snap-shot-it");
const version_go_1 = require("../../src/updaters/go/version-go");
const sandbox = sinon.createSandbox();
const COMMITS = [
    ...(0, helpers_2.buildMockConventionalCommit)('fix(iam): update dependency com.google.cloud:google-cloud-storage to v1.120.0', ['iam/foo.go']),
    ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('GoYoshi', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'google-cloud-go',
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
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
                component: 'iam',
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
                component: 'iam',
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'iam'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
                component: 'iam',
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGES.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'internal/version.go', version_go_1.VersionGo);
        });
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.it)('filters out submodule commits', async () => {
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('go.mod', 'main')
                .resolves(['go.mod', 'internal/go.mod', 'logging/go.mod']);
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
                includeComponentInTag: false,
            });
            const commits = [
                ...(0, helpers_2.buildMockConventionalCommit)('fix: some generic fix'),
                ...(0, helpers_2.buildMockConventionalCommit)('fix(translate): some translate fix'),
                ...(0, helpers_2.buildMockConventionalCommit)('fix(logging): some logging fix'),
                ...(0, helpers_2.buildMockConventionalCommit)('feat: some generic feature'),
            ];
            const pullRequest = await strategy.buildReleasePullRequest(commits);
            const pullRequestBody = pullRequest.body.toString();
            (0, chai_1.expect)(pullRequestBody).to.not.include('logging');
            snapshot((0, helpers_1.dateSafe)(pullRequestBody));
        });
        (0, mocha_1.it)('filters out touched files not matching submodule commits', async () => {
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('go.mod', 'main')
                .resolves(['go.mod', 'internal/go.mod', 'logging/go.mod']);
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
                includeComponentInTag: false,
            });
            const commits = [
                ...(0, helpers_2.buildMockConventionalCommit)('fix: some generic fix'),
                ...(0, helpers_2.buildMockConventionalCommit)('fix(iam/apiv1): some firestore fix', [
                    'accessapproval/apiv1/access_approval_client.go',
                    'iam/apiv1/admin/firestore_admin_client.go',
                ]),
                ...(0, helpers_2.buildMockConventionalCommit)('feat: some generic feature'),
            ];
            const pullRequest = await strategy.buildReleasePullRequest(commits);
            const pullRequestBody = pullRequest.body.toString();
            (0, chai_1.expect)(pullRequestBody).to.not.include('access');
            (0, chai_1.expect)(pullRequestBody).to.include('iam');
            snapshot((0, helpers_1.dateSafe)(pullRequestBody));
        });
        (0, mocha_1.it)('combines google-api-go-client autogenerated PR', async () => {
            github = await github_1.GitHub.create({
                owner: 'googleapis',
                repo: 'google-api-go-client',
                defaultBranch: 'main',
            });
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
            });
            const commits = [
                ...(0, helpers_2.buildMockConventionalCommit)('feat(all): auto-regenerate discovery clients (#1281)'),
                ...(0, helpers_2.buildMockConventionalCommit)('feat(all): auto-regenerate discovery clients (#1280)'),
                ...(0, helpers_2.buildMockConventionalCommit)('feat(all): auto-regenerate discovery clients (#1279)'),
                ...(0, helpers_2.buildMockConventionalCommit)('feat(all): auto-regenerate discovery clients (#1278)'),
            ];
            const pullRequest = await strategy.buildReleasePullRequest(commits);
            const pullRequestBody = pullRequest.body.toString();
            snapshot((0, helpers_1.dateSafe)(pullRequestBody));
        });
    });
    (0, mocha_1.describe)('getIgnoredSubModules', () => {
        (0, mocha_1.it)('ignores non-google-cloud-go repos', async () => {
            github = await github_1.GitHub.create({
                owner: 'googleapis',
                repo: 'google-cloud-foo',
                defaultBranch: 'main',
            });
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
                includeComponentInTag: false,
            });
            const ignoredSubModules = await strategy.getIgnoredSubModules();
            (0, chai_1.expect)(ignoredSubModules.size).to.eql(0);
        });
        (0, mocha_1.it)('ignores submodule configurations', async () => {
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
                component: 'storage',
                includeComponentInTag: true,
            });
            const ignoredSubModules = await strategy.getIgnoredSubModules();
            (0, chai_1.expect)(ignoredSubModules.size).to.eql(0);
        });
        (0, mocha_1.it)('fetches the list of submodules', async () => {
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .withArgs('go.mod', 'main')
                .resolves([
                'storage/go.mod',
                'go.mod',
                'internal/foo/go.mod',
                'internal/go.mod',
                'pubsub/go.mod',
            ]);
            const strategy = new go_yoshi_1.GoYoshi({
                targetBranch: 'main',
                github,
                component: 'main',
                includeComponentInTag: false,
            });
            const ignoredSubModules = await strategy.getIgnoredSubModules();
            (0, chai_1.expect)(ignoredSubModules.size).to.eql(2);
            (0, chai_1.expect)(ignoredSubModules.has('storage')).to.be.true;
            (0, chai_1.expect)(ignoredSubModules.has('pubsub')).to.be.true;
        });
    });
});
//# sourceMappingURL=go-yoshi.js.map