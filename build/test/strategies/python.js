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
const python_1 = require("../../src/strategies/python");
const sinon = require("sinon");
const helpers_1 = require("../helpers");
const helpers_2 = require("../helpers");
const python_file_with_version_1 = require("../../src/updaters/python/python-file-with-version");
const tag_name_1 = require("../../src/util/tag-name");
const version_1 = require("../../src/version");
const pyproject_toml_1 = require("../../src/updaters/python/pyproject-toml");
const setup_cfg_1 = require("../../src/updaters/python/setup-cfg");
const setup_py_1 = require("../../src/updaters/python/setup-py");
const changelog_1 = require("../../src/updaters/changelog");
const changelog_json_1 = require("../../src/updaters/changelog-json");
const snapshot = require("snap-shot-it");
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/python';
const UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
const ISO_DATE_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g; // 2023-01-05T16:42:33.446Z
const COMMITS = [
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
    ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
];
(0, mocha_1.describe)('Python', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'py-test-repo',
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
            const strategy = new python_1.Python({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'setup.py'));
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            (0, chai_1.expect)((_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql(expectedVersion);
        });
        (0, mocha_1.it)('returns release PR changes with semver patch bump', async () => {
            var _a;
            const expectedVersion = '0.123.5';
            const strategy = new python_1.Python({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'setup.py'));
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
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
            const strategy = new python_1.Python({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'setup.py'));
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'CHANGELOG.md', changelog_1.Changelog);
            (0, helpers_1.assertHasUpdate)(updates, 'setup.cfg', setup_cfg_1.SetupCfg);
            (0, helpers_1.assertHasUpdate)(updates, 'setup.py', setup_py_1.SetupPy);
            (0, helpers_1.assertHasUpdate)(updates, 'google-cloud-automl/__init__.py', python_file_with_version_1.PythonFileWithVersion);
            (0, helpers_1.assertHasUpdate)(updates, 'src/google-cloud-automl/__init__.py', python_file_with_version_1.PythonFileWithVersion);
            (0, helpers_1.assertHasUpdate)(updates, 'google_cloud_automl/__init__.py', python_file_with_version_1.PythonFileWithVersion);
            (0, helpers_1.assertHasUpdate)(updates, 'src/google_cloud_automl/__init__.py', python_file_with_version_1.PythonFileWithVersion);
        });
        (0, mocha_1.it)('finds and updates a pyproject.toml', async () => {
            const strategy = new python_1.Python({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .resolves((0, helpers_1.buildGitHubFileContent)('./test/updaters/fixtures', 'pyproject.toml'));
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'pyproject.toml', pyproject_toml_1.PyProjectToml);
        });
        (0, mocha_1.it)('finds and updates a version.py file', async () => {
            const strategy = new python_1.Python({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox
                .stub(github, 'getFileContentsOnBranch')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'setup.py'));
            sandbox
                .stub(github, 'findFilesByFilenameAndRef')
                .resolves(['src/version.py']);
            const latestRelease = undefined;
            const release = await strategy.buildReleasePullRequest(COMMITS, latestRelease);
            const updates = release.updates;
            (0, helpers_1.assertHasUpdate)(updates, 'src/version.py', python_file_with_version_1.PythonFileWithVersion);
        });
        (0, mocha_1.it)('updates changelog.json if present', async () => {
            const COMMITS = [
                ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'),
                ...(0, helpers_2.buildMockConventionalCommit)('chore: update deps'),
                ...(0, helpers_2.buildMockConventionalCommit)('chore!: update a very important dep'),
                ...(0, helpers_2.buildMockConventionalCommit)('fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'),
                ...(0, helpers_2.buildMockConventionalCommit)('chore: update common templates'),
            ];
            const strategy = new python_1.Python({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
            const getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
            getFileContentsStub
                .withArgs('changelog.json', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'changelog.json'));
            getFileContentsStub
                .withArgs('setup.py', 'main')
                .resolves((0, helpers_1.buildGitHubFileContent)(fixturesPath, 'setup.py'));
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
});
//# sourceMappingURL=python.js.map