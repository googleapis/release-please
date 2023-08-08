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
const src_1 = require("../../src");
const java_1 = require("../../src/strategies/java");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const chai_1 = require("chai");
const version_1 = require("../../src/version");
const tag_name_1 = require("../../src/util/tag-name");
const changelog_1 = require("../../src/updaters/changelog");
const manifest_1 = require("../../src/manifest");
const generic_1 = require("../../src/updaters/generic");
const java_released_1 = require("../../src/updaters/java/java-released");
const sandbox = sinon.createSandbox();
(0, mocha_1.describe)('Java', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await src_1.GitHub.create({
            owner: 'googleapis',
            repo: 'java-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.describe)('for default component', () => {
            const COMMITS_NO_SNAPSHOT = [
                ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency'),
                ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency'),
                ...(0, helpers_1.buildMockConventionalCommit)('chore: update common templates'),
            ];
            const COMMITS_WITH_SNAPSHOT = [
                ...COMMITS_NO_SNAPSHOT,
                ...(0, helpers_1.buildMockConventionalCommit)('chore(main): release 2.3.4-SNAPSHOT'),
            ];
            (0, mocha_1.it)('returns release PR changes with defaultInitialVersion', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                });
                const latestRelease = undefined;
                const release = await strategy.buildReleasePullRequest(COMMITS_WITH_SNAPSHOT, latestRelease, false, manifest_1.DEFAULT_LABELS);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.0.0');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.title.toString()).to.eql('chore(main): release 1.0.0');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.headRefName).to.eql('release-please--branches--main');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.draft).to.eql(false);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.labels).to.eql(manifest_1.DEFAULT_LABELS);
                (0, helpers_1.assertHasUpdate)(release.updates, 'CHANGELOG.md', changelog_1.Changelog);
            });
            (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3')),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_WITH_SNAPSHOT, latestRelease, false, manifest_1.DEFAULT_LABELS);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.title.toString()).to.eql('chore(main): release 2.3.4');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.headRefName).to.eql('release-please--branches--main');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.draft).to.eql(false);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.labels).to.eql(manifest_1.DEFAULT_LABELS);
                (0, helpers_1.assertHasUpdate)(release.updates, 'CHANGELOG.md', changelog_1.Changelog);
            });
            (0, mocha_1.it)('returns a snapshot bump PR', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3')),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_NO_SNAPSHOT, latestRelease, false, manifest_1.DEFAULT_LABELS);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4-SNAPSHOT');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.title.toString()).to.eql('chore(main): release 2.3.4-SNAPSHOT');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.headRefName).to.eql('release-please--branches--main');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.draft).to.eql(false);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.labels).to.eql(manifest_1.DEFAULT_SNAPSHOT_LABELS);
                (0, helpers_1.assertNoHasUpdate)(release.updates, 'CHANGELOG.md');
            });
            (0, mocha_1.it)('skips a snapshot bump PR', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                    skipSnapshot: true,
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3')),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_NO_SNAPSHOT, latestRelease, false, manifest_1.DEFAULT_LABELS);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.title.toString()).to.eql('chore(main): release 2.3.4');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.headRefName).to.eql('release-please--branches--main');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.draft).to.eql(false);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.labels).to.eql(manifest_1.DEFAULT_LABELS);
                (0, helpers_1.assertHasUpdate)(release.updates, 'CHANGELOG.md');
            });
            (0, mocha_1.it)('use snapshot latest release', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.4-SNAPSHOT')),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_NO_SNAPSHOT, // no snapshot in commits
                latestRelease);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4');
                (0, helpers_1.assertHasUpdate)(release.updates, 'CHANGELOG.md', changelog_1.Changelog);
            });
            (0, mocha_1.it)('ignores snapshot of another component', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3')),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest([
                    ...(0, helpers_1.buildMockConventionalCommit)('chore(main): release other 2.3.4-SNAPSHOT'),
                    ...COMMITS_NO_SNAPSHOT,
                ], latestRelease);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4-SNAPSHOT');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.title.toString()).to.eql('chore(main): release 2.3.4-SNAPSHOT');
                (0, helpers_1.assertNoHasUpdate)(release.updates, 'CHANGELOG.md');
            });
            (0, mocha_1.it)('uses custom snapshotLabels', async () => {
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                    snapshotLabels: ['bot', 'custom:snapshot'],
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3')),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_NO_SNAPSHOT, latestRelease, false, ['custom:pending']);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.labels).to.eql(['bot', 'custom:snapshot']);
            });
            (0, mocha_1.it)('creates draft snapshot PR', async () => {
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3')),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_NO_SNAPSHOT, latestRelease, true);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.draft).to.eql(true);
            });
            (0, mocha_1.it)('updates released version in extra files', async () => {
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                    extraFiles: ['foo/bar.java', 'pom.xml'],
                });
                const release = await strategy.buildReleasePullRequest(COMMITS_NO_SNAPSHOT, undefined);
                const updates = release.updates;
                (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
                (0, helpers_1.assertHasUpdates)(updates, 'pom.xml', java_released_1.JavaReleased, generic_1.Generic);
                (0, helpers_1.assertHasUpdates)(updates, 'foo/bar.java', java_released_1.JavaReleased, generic_1.Generic);
            });
            (0, mocha_1.it)('does not update released version in extra files for snapshot', async () => {
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                    extraFiles: ['foo/bar.java', 'pom.xml'],
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3')),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_NO_SNAPSHOT, latestRelease);
                const updates = release.updates;
                (0, helpers_1.assertNoHasUpdate)(updates, 'CHANGELOG.md');
                (0, helpers_1.assertHasUpdate)(updates, 'foo/bar.java', generic_1.Generic);
                (0, helpers_1.assertHasUpdate)(updates, 'pom.xml', generic_1.Generic);
            });
        });
        (0, mocha_1.describe)('with includeComponentInTag', () => {
            const COMMITS_NO_SNAPSHOT = [
                ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency'),
                ...(0, helpers_1.buildMockConventionalCommit)('fix(deps): update dependency'),
                ...(0, helpers_1.buildMockConventionalCommit)('chore: update common templates'),
                ...(0, helpers_1.buildMockConventionalCommit)('chore(main): release other-sample 13.3.5'),
            ];
            const COMMITS_WITH_SNAPSHOT = COMMITS_NO_SNAPSHOT.concat(...(0, helpers_1.buildMockConventionalCommit)('chore(main): release other-sample 13.3.6-SNAPSHOT'), ...(0, helpers_1.buildMockConventionalCommit)('chore(main): release test-sample 2.3.4-SNAPSHOT'));
            (0, mocha_1.it)('returns release PR changes with defaultInitialVersion', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                    component: 'test-sample',
                    includeComponentInTag: true,
                });
                const release = await strategy.buildReleasePullRequest(COMMITS_WITH_SNAPSHOT, undefined, false, manifest_1.DEFAULT_LABELS);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.0.0');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.title.toString()).to.eql('chore(main): release test-sample 1.0.0');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.headRefName).to.eql('release-please--branches--main--components--test-sample');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.draft).to.eql(false);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.labels).to.eql(manifest_1.DEFAULT_LABELS);
                (0, helpers_1.assertHasUpdate)(release.updates, 'CHANGELOG.md', changelog_1.Changelog);
            });
            (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                    component: 'test-sample',
                    includeComponentInTag: true,
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3'), 'test-sample'),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_WITH_SNAPSHOT, latestRelease, false, manifest_1.DEFAULT_LABELS);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.title.toString()).to.eql('chore(main): release test-sample 2.3.4');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.headRefName).to.eql('release-please--branches--main--components--test-sample');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.draft).to.eql(false);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.labels).to.eql(manifest_1.DEFAULT_LABELS);
                (0, helpers_1.assertHasUpdate)(release.updates, 'CHANGELOG.md', changelog_1.Changelog);
            });
            (0, mocha_1.it)('returns a snapshot bump PR', async () => {
                var _a;
                const strategy = new java_1.Java({
                    targetBranch: 'main',
                    github,
                    component: 'test-sample',
                    includeComponentInTag: true,
                });
                const latestRelease = {
                    tag: new tag_name_1.TagName(version_1.Version.parse('2.3.3'), 'test-sample'),
                    sha: 'abc123',
                    notes: 'some notes',
                };
                const release = await strategy.buildReleasePullRequest(COMMITS_NO_SNAPSHOT, latestRelease, false, manifest_1.DEFAULT_LABELS);
                (0, chai_1.expect)((_a = release === null || release === void 0 ? void 0 : release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4-SNAPSHOT');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.title.toString()).to.eql('chore(main): release test-sample 2.3.4-SNAPSHOT');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.headRefName).to.eql('release-please--branches--main--components--test-sample');
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.draft).to.eql(false);
                (0, chai_1.expect)(release === null || release === void 0 ? void 0 : release.labels).to.eql(manifest_1.DEFAULT_SNAPSHOT_LABELS);
                (0, helpers_1.assertNoHasUpdate)(release.updates, 'CHANGELOG.md');
            });
        });
    });
});
//# sourceMappingURL=java.js.map