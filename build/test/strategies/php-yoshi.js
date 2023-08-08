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
const php_yoshi_1 = require("../../src/strategies/php-yoshi");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const changelog_1 = require("../../src/updaters/changelog");
const root_composer_update_packages_1 = require("../../src/updaters/php/root-composer-update-packages");
const php_client_version_1 = require("../../src/updaters/php/php-client-version");
const default_1 = require("../../src/updaters/default");
const snapshot = require("snap-shot-it");
const fs_1 = require("fs");
const path_1 = require("path");
const errors_1 = require("../../src/errors");
const sandbox = sinon.createSandbox();
(0, mocha_1.describe)('PHPYoshi', () => {
    let github;
    let getFileStub;
    const commits = [
        ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0', ['Client1/foo.php']),
        ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0', ['Client2/foo.php', 'Client3/bar.php']),
        ...(0, helpers_2.buildMockConventionalCommit)('misc: update common templates'),
    ];
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'php-yoshi-test-repo',
            defaultBranch: 'main',
        });
        getFileStub = sandbox.stub(github, 'getFileContentsOnBranch');
        getFileStub
            .withArgs('Client1/VERSION', 'main')
            .resolves((0, helpers_1.buildGitHubFileRaw)('1.2.3'));
        getFileStub
            .withArgs('Client2/VERSION', 'main')
            .resolves((0, helpers_1.buildGitHubFileRaw)('2.0.0'));
        getFileStub
            .withArgs('Client3/VERSION', 'main')
            .resolves((0, helpers_1.buildGitHubFileRaw)('0.1.2'));
        getFileStub
            .withArgs('Client1/composer.json', 'main')
            .resolves((0, helpers_1.buildGitHubFileRaw)('{"name": "google/client1"}'));
        getFileStub
            .withArgs('Client2/composer.json', 'main')
            .resolves((0, helpers_1.buildGitHubFileRaw)('{"name": "google/client2"}'));
        getFileStub
            .withArgs('Client3/composer.json', 'main')
            .resolves((0, helpers_1.buildGitHubFileRaw)('{"name": "google/client3", "extra": {"component": {"entry": "src/Entry.php"}}}'));
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.it)('returns release PR changes with defaultInitialVersion', async () => {
            var _a;
            const expectedVersion = '1.0.0';
            const strategy = new php_yoshi_1.PHPYoshi({
                targetBranch: 'main',
                github,
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
            snapshot((0, helpers_1.dateSafe)(release.body.toString()));
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new php_yoshi_1.PHPYoshi({
                targetBranch: 'main',
                github,
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'google-cloud-automl'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
            snapshot((0, helpers_1.dateSafe)(release.body.toString()));
        });
        (0, mocha_1.it)('includes misc commits', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new php_yoshi_1.PHPYoshi({
                targetBranch: 'main',
                github,
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'google-cloud-automl'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const release = await strategy.buildReleasePullRequest([
                {
                    sha: 'def234',
                    message: 'misc: some miscellaneous task',
                    files: ['Client3/README.md'],
                },
            ], latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
            snapshot((0, helpers_1.dateSafe)(release.body.toString()));
        });
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new php_yoshi_1.PHPYoshi({
                targetBranch: 'main',
                github,
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'composer.json', root_composer_update_packages_1.RootComposerUpdatePackages);
        });
        (0, mocha_1.it)('finds touched components', async () => {
            const strategy = new php_yoshi_1.PHPYoshi({
                targetBranch: 'main',
                github,
            });
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'Client1/VERSION', default_1.DefaultUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'Client2/VERSION', default_1.DefaultUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'Client3/VERSION', default_1.DefaultUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'Client3/src/Entry.php', php_client_version_1.PHPClientVersion);
        });
        (0, mocha_1.it)('ignores non client top level directories', async () => {
            const strategy = new php_yoshi_1.PHPYoshi({
                targetBranch: 'main',
                github,
            });
            const latestRelease = undefined;
            const commits = [
                ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0', ['Client1/foo.php', '.git/release-please.yml']),
                ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0', ['Client2/foo.php', 'Client3/bar.php']),
                ...(0, helpers_2.buildMockConventionalCommit)('misc: update common templates'),
            ];
            getFileStub
                .withArgs('.git/VERSION', 'main')
                .rejects(new errors_1.FileNotFoundError('.git/VERSION'));
            const release = await strategy.buildReleasePullRequest(commits, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'Client1/VERSION', default_1.DefaultUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'Client2/VERSION', default_1.DefaultUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'Client3/VERSION', default_1.DefaultUpdater);
            (0, helpers_1.assertHasUpdate)(updates, 'Client3/src/Entry.php', php_client_version_1.PHPClientVersion);
        });
    });
    (0, mocha_1.describe)('buildRelease', () => {
        (0, mocha_1.it)('parses the release notes', async () => {
            const strategy = new php_yoshi_1.PHPYoshi({
                targetBranch: 'main',
                github,
            });
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)('./test/fixtures/release-notes/legacy-php-yoshi.txt'), 'utf8').replace(/\r\n/g, '\n');
            const mergedPullRequest = {
                headBranchName: 'release-please--branches--main',
                baseBranchName: 'main',
                number: 123,
                title: 'chore(main): release 0.173.0',
                body,
                labels: ['autorelease: pending'],
                files: [],
                sha: 'abc123',
            };
            const release = await strategy.buildRelease(mergedPullRequest);
            (0, chai_1.expect)(release).to.not.be.undefined;
            snapshot(release.notes);
            (0, chai_1.expect)(release.name).to.eql('v0.173.0');
            (0, chai_1.expect)(release.sha).to.eql('abc123');
            (0, chai_1.expect)(release.tag.toString()).to.eql('v0.173.0');
        });
    });
});
//# sourceMappingURL=php-yoshi.js.map