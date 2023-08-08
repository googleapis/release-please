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
const ruby_1 = require("../../src/strategies/ruby");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const changelog_1 = require("../../src/updaters/changelog");
const version_rb_1 = require("../../src/updaters/ruby/version-rb");
const gemfile_lock_1 = require("../../src/updaters/ruby/gemfile-lock");
const pull_request_body_1 = require("../../src/util/pull-request-body");
const sandbox = sinon.createSandbox();
const COMMITS = [
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('Ruby', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'ruby-test-repo',
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
            const strategy = new ruby_1.Ruby({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new ruby_1.Ruby({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'google-cloud-automl'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new ruby_1.Ruby({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, chai_1.expect)(updates).lengthOf(3);
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'lib/google/cloud/automl/version.rb', version_rb_1.VersionRB);
            (0, helpers_1.assertHasUpdate)(updates, 'Gemfile.lock', gemfile_lock_1.GemfileLock);
        });
        (0, mocha_1.it)('allows overriding version file', async () => {
            const strategy = new ruby_1.Ruby({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                versionFile: 'lib/foo/version.rb',
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, chai_1.expect)(updates).lengthOf(3);
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'lib/foo/version.rb', version_rb_1.VersionRB);
            (0, helpers_1.assertHasUpdate)(updates, 'Gemfile.lock', gemfile_lock_1.GemfileLock);
        });
        // TODO: add tests for tag separator
        // TODO: add tests for post-processing commit messages
    });
    (0, mocha_1.describe)('buildRelease', () => {
        (0, mocha_1.it)('overrides the tag separator', async () => {
            const strategy = new ruby_1.Ruby({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const release = await strategy.buildRelease({
                title: 'chore(main): release v1.2.3',
                headBranchName: 'release-please/branches/main',
                baseBranchName: 'main',
                number: 1234,
                body: new pull_request_body_1.PullRequestBody([]).toString(),
                labels: [],
                files: [],
                sha: 'abc123',
            });
            (0, chai_1.expect)(release, 'Release').to.not.be.undefined;
            (0, chai_1.expect)(release.tag.separator).to.eql('/');
        });
    });
});
//# sourceMappingURL=ruby.js.map