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
const sinon = require("sinon");
const chai_1 = require("chai");
const base_1 = require("../../src/strategies/base");
const github_1 = require("../../src/github");
const pull_request_body_1 = require("../../src/util/pull-request-body");
const snapshot = require("snap-shot-it");
const helpers_1 = require("../helpers");
const generic_json_1 = require("../../src/updaters/generic-json");
const generic_1 = require("../../src/updaters/generic");
const generic_xml_1 = require("../../src/updaters/generic-xml");
const pom_xml_1 = require("../../src/updaters/java/pom-xml");
const generic_yaml_1 = require("../../src/updaters/generic-yaml");
const generic_toml_1 = require("../../src/updaters/generic-toml");
const sandbox = sinon.createSandbox();
class TestStrategy extends base_1.BaseStrategy {
    async buildUpdates() {
        return [];
    }
}
(0, mocha_1.describe)('Strategy', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'googleapis',
            repo: 'base-test-repo',
            defaultBranch: 'main',
        });
    });
    (0, mocha_1.afterEach)(() => {
        sandbox.restore();
    });
    (0, mocha_1.describe)('buildReleasePullRequest', () => {
        (0, mocha_1.it)('should ignore empty commits', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const pullRequest = await strategy.buildReleasePullRequest([]);
            (0, chai_1.expect)(pullRequest).to.be.undefined;
        });
        (0, mocha_1.it)('allows overriding initial version', async () => {
            var _a;
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
            });
            const commits = (0, helpers_1.buildMockConventionalCommit)('chore: initial commit\n\nRelease-As: 2.3.4');
            const pullRequest = await strategy.buildReleasePullRequest(commits);
            (0, chai_1.expect)(pullRequest).to.not.be.undefined;
            (0, chai_1.expect)((_a = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('2.3.4');
            snapshot((0, helpers_1.dateSafe)(pullRequest.body.toString()));
        });
        (0, mocha_1.it)('allows overriding initial version in base constructor', async () => {
            var _a;
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                initialVersion: '0.1.0',
            });
            const commits = (0, helpers_1.buildMockConventionalCommit)('feat: initial commit');
            const pullRequest = await strategy.buildReleasePullRequest(commits);
            (0, chai_1.expect)(pullRequest).to.not.be.undefined;
            (0, chai_1.expect)((_a = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('0.1.0');
            snapshot((0, helpers_1.dateSafe)(pullRequest.body.toString()));
        });
        (0, mocha_1.it)('updates extra files', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraFiles: ['0', 'foo/1.~csv', 'foo/2.bak', 'foo/baz/bar/', '/3.java'],
            });
            const pullRequest = await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
            (0, chai_1.expect)(pullRequest).to.exist;
            (0, chai_1.expect)(pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.updates).to.be.an('array');
            (0, chai_1.expect)(pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.updates.map(update => update.path))
                .to.include.members([
                '0',
                '3.java',
                'foo/1.~csv',
                'foo/2.bak',
                'foo/baz/bar',
            ])
                .and.not.include('foo/baz/bar/', 'expected file but got directory');
        });
        (0, mocha_1.it)('updates extra JSON files', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraFiles: ['0', { type: 'json', path: '/3.json', jsonpath: '$.foo' }],
            });
            const pullRequest = await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
            (0, chai_1.expect)(pullRequest).to.exist;
            const updates = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.updates;
            (0, chai_1.expect)(updates).to.be.an('array');
            (0, helpers_1.assertHasUpdate)(updates, '0', generic_1.Generic);
            (0, helpers_1.assertHasUpdate)(updates, '3.json', generic_json_1.GenericJson);
        });
        (0, mocha_1.it)('updates extra YAML files', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraFiles: ['0', { type: 'yaml', path: '/3.yaml', jsonpath: '$.foo' }],
            });
            const pullRequest = await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
            (0, chai_1.expect)(pullRequest).to.exist;
            const updates = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.updates;
            (0, chai_1.expect)(updates).to.be.an('array');
            (0, helpers_1.assertHasUpdate)(updates, '0', generic_1.Generic);
            (0, helpers_1.assertHasUpdate)(updates, '3.yaml', generic_yaml_1.GenericYaml);
        });
        (0, mocha_1.it)('updates extra TOML files', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraFiles: ['0', { type: 'toml', path: '/3.toml', jsonpath: '$.foo' }],
            });
            const pullRequest = await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
            (0, chai_1.expect)(pullRequest).to.exist;
            const updates = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.updates;
            (0, chai_1.expect)(updates).to.be.an('array');
            (0, helpers_1.assertHasUpdate)(updates, '0', generic_1.Generic);
            (0, helpers_1.assertHasUpdate)(updates, '3.toml', generic_toml_1.GenericToml);
        });
        (0, mocha_1.it)('updates extra Xml files', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraFiles: ['0', { type: 'xml', path: '/3.xml', xpath: '$.foo' }],
            });
            const pullRequest = await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
            (0, chai_1.expect)(pullRequest).to.exist;
            const updates = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.updates;
            (0, chai_1.expect)(updates).to.be.an('array');
            (0, helpers_1.assertHasUpdate)(updates, '0', generic_1.Generic);
            (0, helpers_1.assertHasUpdate)(updates, '3.xml', generic_xml_1.GenericXml);
        });
        (0, mocha_1.it)('updates extra pom.xml files', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraFiles: ['0', { type: 'pom', path: '/3.xml' }],
            });
            const pullRequest = await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
            (0, chai_1.expect)(pullRequest).to.exist;
            const updates = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.updates;
            (0, chai_1.expect)(updates).to.be.an('array');
            (0, helpers_1.assertHasUpdate)(updates, '0', generic_1.Generic);
            (0, helpers_1.assertHasUpdate)(updates, '3.xml', pom_xml_1.PomXml);
        });
        (0, mocha_1.it)('updates extra glob files', async () => {
            const findFilesStub = sandbox
                .stub(github, 'findFilesByGlobAndRef')
                .resolves(['3.xml']);
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraFiles: [
                    '0',
                    {
                        type: 'xml',
                        path: '**/*.xml',
                        xpath: '//project/version',
                        glob: true,
                    },
                ],
            });
            const pullRequest = await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
            (0, chai_1.expect)(pullRequest).to.exist;
            const updates = pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.updates;
            (0, chai_1.expect)(updates).to.be.an('array');
            (0, helpers_1.assertHasUpdate)(updates, '0', generic_1.Generic);
            (0, helpers_1.assertHasUpdate)(updates, '3.xml', generic_xml_1.GenericXml);
            sinon.assert.calledOnceWithExactly(findFilesStub, '**/*.xml', 'main');
        });
        (0, mocha_1.it)('should pass changelogHost to default buildNotes', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                changelogHost: 'https://example.com',
            });
            const commits = (0, helpers_1.buildMockConventionalCommit)('fix: a bugfix');
            const pullRequest = await strategy.buildReleasePullRequest(commits);
            (0, chai_1.expect)(pullRequest).to.exist;
            (0, chai_1.expect)(pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.body.toString()).to.have.string('https://example.com');
            snapshot((0, helpers_1.dateSafe)(pullRequest.body.toString()));
        });
        (0, mocha_1.it)('rejects relative extra files', async () => {
            const extraFiles = [
                './bar',
                './../../../etc/hosts',
                '../../../../etc/hosts',
                '~/./5',
                '~/.ssh/config',
                '~/../../.././level/../../../up',
                '/../../../opt',
                'foo/bar/../baz',
                'foo/baz/../../../../../etc/hostname',
            ];
            for (const file of extraFiles) {
                try {
                    const strategy = new TestStrategy({
                        targetBranch: 'main',
                        github,
                        component: 'google-cloud-automl',
                        extraFiles: [file],
                    });
                    await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
                    chai_1.expect.fail(`expected [addPath] to reject path: ${file}`);
                }
                catch (err) {
                    (0, chai_1.expect)(err).to.be.instanceof(Error);
                    (0, chai_1.expect)(err.message).to.have.string('illegal pathing characters in path');
                }
            }
        });
        (0, mocha_1.it)('handles extra labels', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                extraLabels: ['foo', 'bar'],
            });
            const pullRequest = await strategy.buildReleasePullRequest((0, helpers_1.buildMockConventionalCommit)('fix: a bugfix'), undefined);
            (0, chai_1.expect)(pullRequest).to.exist;
            (0, chai_1.expect)(pullRequest === null || pullRequest === void 0 ? void 0 : pullRequest.labels).to.eql(['foo', 'bar']);
        });
    });
    (0, mocha_1.describe)('buildRelease', () => {
        (0, mocha_1.it)('builds a release tag', async () => {
            const strategy = new TestStrategy({
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
            (0, chai_1.expect)(release.tag.toString()).to.eql('google-cloud-automl-v1.2.3');
        });
        (0, mocha_1.it)('overrides the tag separator', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                tagSeparator: '/',
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
            (0, chai_1.expect)(release.tag.toString()).to.eql('google-cloud-automl/v1.2.3');
        });
        (0, mocha_1.it)('skips component in release tag', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                includeComponentInTag: false,
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
            (0, chai_1.expect)(release.tag.toString()).to.eql('v1.2.3');
        });
        (0, mocha_1.it)('skips v in release tag', async () => {
            const strategy = new TestStrategy({
                targetBranch: 'main',
                github,
                component: 'google-cloud-automl',
                includeComponentInTag: false,
                includeVInTag: false,
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
            (0, chai_1.expect)(release.tag.toString()).to.eql('1.2.3');
        });
    });
});
//# sourceMappingURL=base.js.map