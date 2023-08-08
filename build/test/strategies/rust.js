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
const rust_1 = require("../../src/strategies/rust");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const changelog_1 = require("../../src/updaters/changelog");
const cargo_lock_1 = require("../../src/updaters/rust/cargo-lock");
const cargo_toml_1 = require("../../src/updaters/rust/cargo-toml");
const snapshot = require("snap-shot-it");
const sandbox = sinon.createSandbox();
const COMMITS = [
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('Rust', () => {
    const fixturesPath = './test/fixtures/strategies/rust-workspace';
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'rust-test-repo',
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
            const strategy = new rust_1.Rust({
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
            const strategy = new rust_1.Rust({
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
        (0, mocha_1.it)('detects a default component', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new rust_1.Rust({
                targetBranch: 'main',
                github,
            });
            const latestRelease = {
                tag: new tag_name_1.TagName(version_1.Version.parse('0.123.4'), 'rust-test-repo'),
                sha: 'abc123',
                notes: 'some notes',
            };
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('Cargo.toml', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'Cargo-crate1.toml'));
            const pullRequest = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
            snapshot((0, helpers_1.dateSafe)(pullRequest.body.toString()));
        });
    });
});
(0, mocha_1.describe)('Rust Crate', () => {
    const fixturesPath = './test/fixtures/strategies/rust';
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'rust-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new rust_1.Rust({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('Cargo.toml', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'Cargo.toml'))
                .withArgs('Cargo.lock', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'Cargo.lock'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'Cargo.toml', cargo_toml_1.CargoToml);
            const lockUpdate = (0, helpers_1.assertHasUpdate)(updates, 'Cargo.lock', cargo_lock_1.CargoLock);
            const lockUpdater = lockUpdate.updater;
            const versionsMaps = lockUpdater.versionsMap;
            (0, chai_1.expect)(versionsMaps.get('rust_test_repo')).to.eql(release === null || release === void 0 ? void 0 : release.version);
        });
    });
});
(0, mocha_1.describe)('Rust Workspace', () => {
    const fixturesPath = './test/fixtures/strategies/rust-workspace';
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'rust-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildUpdates', () => {
        (0, mocha_1.it)('builds common files', async () => {
            const strategy = new rust_1.Rust({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('Cargo.toml', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'Cargo-workspace.toml'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'Cargo.toml', cargo_toml_1.CargoToml);
            (0, helpers_1.assertHasUpdate)(updates, 'Cargo.lock', cargo_lock_1.CargoLock);
        });
        (0, mocha_1.it)('finds crates from workspace manifest', async () => {
            const strategy = new rust_1.Rust({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .withArgs('Cargo.toml', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'Cargo-workspace.toml'))
                .withArgs('crates/crate1/Cargo.toml', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'Cargo-crate1.toml'))
                .withArgs('crates/crate2/Cargo.toml', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'Cargo-crate2.toml'));
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'crates/crate1/Cargo.toml', cargo_toml_1.CargoToml);
            (0, helpers_1.assertHasUpdate)(updates, 'crates/crate2/Cargo.toml', cargo_toml_1.CargoToml);
            (0, helpers_1.assertHasUpdate)(updates, 'Cargo.toml', cargo_toml_1.CargoToml);
            (0, helpers_1.assertHasUpdate)(updates, 'Cargo.lock', cargo_lock_1.CargoLock);
        });
    });
});
//# sourceMappingURL=rust.js.map