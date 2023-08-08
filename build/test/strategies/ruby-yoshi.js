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
const ruby_yoshi_1 = require("../../src/strategies/ruby-yoshi");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const changelog_1 = require("../../src/updaters/changelog");
const version_rb_1 = require("../../src/updaters/ruby/version-rb");
const sandbox = sinon.createSandbox();
const COMMITS = [
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0 (#1234)', ['path1/foo.rb']),
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0', ['path1/foo.rb', 'path2/bar.rb']),
    ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('RubyYoshi', () => {
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
            const strategy = new ruby_yoshi_1.RubyYoshi({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const latestRelease = undefined;
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new ruby_yoshi_1.RubyYoshi({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'google-cloud-automl'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
            (0, helpers_1.safeSnapshot)(pullRequest.body.toString());
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new ruby_yoshi_1.RubyYoshi({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const latestRelease = undefined;
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = pullRequest.updates;
            (0, chai_1.expect)(updates).lengthOf(2);
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'lib/google/cloud/automl/version.rb', version_rb_1.VersionRB);
        });
        (0, mocha_1.it)('does not add summary to changelog', async () => {
            const strategy = new ruby_yoshi_1.RubyYoshi({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('v1.2.3')),
                sha: 'abc123',
                notes: 'some notes',
            };
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = pullRequest.updates;
            (0, chai_1.expect)(updates).lengthOf(2);
            const { updater } = (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, chai_1.expect)(updater.changelogEntry).not.to.contain('Files edited since');
        });
        (0, mocha_1.it)('allows overriding version file', async () => {
            const strategy = new ruby_yoshi_1.RubyYoshi({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                versionFile: 'lib/foo/version.rb',
            });
            const latestRelease = undefined;
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = pullRequest.updates;
            (0, chai_1.expect)(updates).lengthOf(2);
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'lib/foo/version.rb', version_rb_1.VersionRB);
        });
        // TODO: add tests for tag separator
        // TODO: add tests for post-processing commit messages
    });
});
//# sourceMappingURL=ruby-yoshi.js.map