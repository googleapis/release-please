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
const github_1 = require("../../src/github");
const dotnet_yoshi_1 = require("../../src/strategies/dotnet-yoshi");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const changelog_1 = require("../../src/updaters/changelog");
const pull_request_body_1 = require("../../src/util/pull-request-body");
const apis_1 = require("../../src/updaters/dotnet/apis");
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/dotnet-yoshi';
const COMMITS = [
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('DotnetYoshi', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'google-cloud-dotnet',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.beforeEach)(() => {
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('apis/apis.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'apis.json'));
        });
        (0, mocha_1.it)('returns release PR changes with defaultInitialVersion', async () => {
            var _a;
            const expectedVersion = '1.0.0';
            const expectedTitle = 'Release Google.Cloud.SecurityCenter.V1 version 1.0.0';
            const strategy = new dotnet_yoshi_1.DotnetYoshi({
                targetBranch: 'main',
                github,
                component: 'Google.Cloud.SecurityCenter.V1',
            });
            const latestRelease = undefined;
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
            (0, chai_1.expect)(pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.title.toString()).to.eql(expectedTitle);
            (0, helpers_1.safeSnapshot)(pullRequest.body.toString());
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const expectedTitle = 'Release Google.Cloud.SecurityCenter.V1 version 0.123.5';
            const strategy = new dotnet_yoshi_1.DotnetYoshi({
                targetBranch: 'main',
                github,
                component: 'Google.Cloud.SecurityCenter.V1',
            });
            const latestRelease = {
                tag: tag_name_1.TagName.parse('Google.Cloud.SecurityCenter.V1-0.123.4'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
            (0, chai_1.expect)(pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.title.toString()).to.eql(expectedTitle);
            (0, helpers_1.safeSnapshot)(pullRequest.body.toString());
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new dotnet_yoshi_1.DotnetYoshi({
                targetBranch: 'main',
                github,
                path: 'apis/Google.Cloud.SecurityCenter.V1',
                component: 'Google.Cloud.SecurityCenter.V1',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('apis/apis.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'apis.json'));
            const latestRelease = undefined;
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = pullRequest.updates;
            (0, chai_1.expect)(updates).lengthOf(2);
            const changelogUpdate = (0, helpers_1.assertHasUpdate)(updates, 'apis/Google.Cloud.SecurityCenter.V1/docs/history.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'apis/apis.json', apis_1.Apis);
            (0, helpers_1.safeSnapshot)(changelogUpdate.updater.changelogEntry);
        });
        (0, mocha_1.it)('skips changelog for configured libraries', async () => {
            const strategy = new dotnet_yoshi_1.DotnetYoshi({
                targetBranch: 'main',
                github,
                path: 'apis/Google.Cloud.Spanner.Admin.Database.V1',
                component: 'Google.Cloud.Spanner.Admin.Database.V1',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('apis/apis.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'apis.json'));
            const latestRelease = undefined;
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = pullRequest.updates;
            (0, chai_1.expect)(updates).lengthOf(1);
            (0, helpers_1.assertNoHasUpdate)(updates, 'apis/Google.Cloud.SecurityCenter.V1/docs/history.md');
            (0, helpers_1.assertHasUpdate)(updates, 'apis/apis.json', apis_1.Apis);
        });
    });
    (0, mocha_1.describe)('buildRelease', () => {
        (0, mocha_1.it)('overrides the tag separator', async () => {
            const expectedReleaseTag = 'Google.Cloud.SecurityCenter.V1-0.123.5';
            const strategy = new dotnet_yoshi_1.DotnetYoshi({
                targetBranch: 'main',
                github,
                path: 'apis/Google.Cloud.SecurityCenter.V1',
                component: 'Google.Cloud.SecurityCenter.V1',
            });
            const release = await strategy.buildRelease({
                title: 'Release Google.Cloud.SecurityCenter.V1 version 0.123.5',
                headBranchName: 'release-please--branches--main--component--Google.Cloud.SecurityCenter.V1',
                baseBranchName: 'main',
                number: 1234,
                body: new pull_request_body_1.PullRequestBody([]).toString(),
                labels: [],
                files: [],
                sha: 'abc123',
            });
            (0, chai_1.expect)(release, 'Release').to.not.be.undefined;
            (0, chai_1.expect)(release.tag.toString()).to.eql(expectedReleaseTag);
        });
    });
});
//# sourceMappingURL=dotnet-yoshi.js.map