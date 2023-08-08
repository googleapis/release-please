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
const fs_1 = require("fs");
const path_1 = require("path");
const pull_request_body_1 = require("../../src/util/pull-request-body");
const snapshot = require("snap-shot-it");
const version_1 = require("../../src/version");
const fixturesPath = './test/fixtures/release-notes';
(0, mocha_1.describe)('PullRequestBody', () => {
    (0, mocha_1.describe)('parse', () => {
        (0, mocha_1.it)('should parse multiple components', () => {
            var _a, _b, _c, _d;
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './multiple.txt'), 'utf8');
            const pullRequestBody = pull_request_body_1.PullRequestBody.parse(body);
            (0, chai_1.expect)(pullRequestBody).to.not.be.undefined;
            const releaseData = pullRequestBody.releaseData;
            (0, chai_1.expect)(releaseData).lengthOf(4);
            (0, chai_1.expect)(releaseData[0].component).to.eql('@google-automations/bot-config-utils');
            (0, chai_1.expect)((_a = releaseData[0].version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('3.2.0');
            (0, chai_1.expect)(releaseData[0].notes).matches(/^### Features/);
            (0, chai_1.expect)(releaseData[1].component).to.eql('@google-automations/label-utils');
            (0, chai_1.expect)((_b = releaseData[1].version) === null || _b === void 0 ? void 0 : _b.toString()).to.eql('1.1.0');
            (0, chai_1.expect)(releaseData[1].notes).matches(/^### Features/);
            (0, chai_1.expect)(releaseData[2].component).to.eql('@google-automations/object-selector');
            (0, chai_1.expect)((_c = releaseData[2].version) === null || _c === void 0 ? void 0 : _c.toString()).to.eql('1.1.0');
            (0, chai_1.expect)(releaseData[2].notes).matches(/^### Features/);
            (0, chai_1.expect)(releaseData[3].component).to.eql('@google-automations/datastore-lock');
            (0, chai_1.expect)((_d = releaseData[3].version) === null || _d === void 0 ? void 0 : _d.toString()).to.eql('2.1.0');
            (0, chai_1.expect)(releaseData[3].notes).matches(/^### Features/);
        });
        (0, mocha_1.it)('should parse multiple components mixed with componentless', () => {
            var _a, _b;
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './mixed-componentless-manifest.txt'), 'utf8');
            const pullRequestBody = pull_request_body_1.PullRequestBody.parse(body);
            (0, chai_1.expect)(pullRequestBody).to.not.be.undefined;
            const releaseData = pullRequestBody.releaseData;
            (0, chai_1.expect)(releaseData).lengthOf(2);
            (0, chai_1.expect)(releaseData[0].component).to.be.undefined;
            (0, chai_1.expect)((_a = releaseData[0].version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('3.2.0');
            (0, chai_1.expect)(releaseData[0].notes).matches(/^### Features/);
            (0, chai_1.expect)(releaseData[1].component).to.eql('@google-automations/label-utils');
            (0, chai_1.expect)((_b = releaseData[1].version) === null || _b === void 0 ? void 0 : _b.toString()).to.eql('1.1.0');
            (0, chai_1.expect)(releaseData[1].notes).matches(/^### Features/);
        });
        (0, mocha_1.it)('should parse single component from legacy manifest release', () => {
            var _a;
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './single-manifest.txt'), 'utf8');
            const pullRequestBody = pull_request_body_1.PullRequestBody.parse(body);
            (0, chai_1.expect)(pullRequestBody).to.not.be.undefined;
            const releaseData = pullRequestBody.releaseData;
            (0, chai_1.expect)(releaseData).lengthOf(1);
            (0, chai_1.expect)(releaseData[0].component).to.eql('@google-cloud/release-brancher');
            (0, chai_1.expect)((_a = releaseData[0].version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.3.1');
            (0, chai_1.expect)(releaseData[0].notes).matches(/^### Bug Fixes/);
        });
        (0, mocha_1.it)('should parse standalone release', () => {
            var _a;
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './single.txt'), 'utf8');
            const pullRequestBody = pull_request_body_1.PullRequestBody.parse(body);
            (0, chai_1.expect)(pullRequestBody).to.not.be.undefined;
            const releaseData = pullRequestBody.releaseData;
            (0, chai_1.expect)(releaseData).lengthOf(1);
            (0, chai_1.expect)(releaseData[0].component).to.be.undefined;
            (0, chai_1.expect)((_a = releaseData[0].version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('3.2.7');
            (0, chai_1.expect)(releaseData[0].notes).matches(/^### \[3\.2\.7\]/);
        });
        (0, mocha_1.it)('should parse legacy PHP body', () => {
            var _a;
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './legacy-php-yoshi.txt'), 'utf8');
            const pullRequestBody = pull_request_body_1.PullRequestBody.parse(body);
            (0, chai_1.expect)(pullRequestBody).to.not.be.undefined;
            const releaseData = pullRequestBody.releaseData;
            (0, chai_1.expect)(releaseData).lengthOf(109);
            (0, chai_1.expect)(releaseData[0].component).to.eql('google/cloud-access-approval');
            (0, chai_1.expect)((_a = releaseData[0].version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('0.3.0');
            (0, chai_1.expect)(releaseData[0].notes).matches(/Database operations/);
        });
        (0, mocha_1.it)('can parse initial release pull rqeuest body', () => {
            var _a;
            const body = (0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, './initial-version.txt'), 'utf8');
            const pullRequestBody = pull_request_body_1.PullRequestBody.parse(body);
            (0, chai_1.expect)(pullRequestBody).to.not.be.undefined;
            const releaseData = pullRequestBody.releaseData;
            (0, chai_1.expect)(releaseData).lengthOf(1);
            (0, chai_1.expect)(releaseData[0].component).to.be.undefined;
            (0, chai_1.expect)((_a = releaseData[0].version) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('0.1.0');
            (0, chai_1.expect)(releaseData[0].notes).matches(/initial generation/);
        });
    });
    (0, mocha_1.describe)('toString', () => {
        (0, mocha_1.it)('can handle multiple entries', () => {
            const data = [
                {
                    component: 'pkg1',
                    version: version_1.Version.parse('1.2.3'),
                    notes: 'some special notes go here',
                },
                {
                    component: 'pkg2',
                    version: version_1.Version.parse('2.0.0'),
                    notes: 'more special notes go here',
                },
            ];
            const pullRequestBody = new pull_request_body_1.PullRequestBody(data);
            snapshot(pullRequestBody.toString());
        });
        (0, mocha_1.it)('can handle a single entries', () => {
            const data = [
                {
                    component: 'pkg1',
                    version: version_1.Version.parse('1.2.3'),
                    notes: 'some special notes go here',
                },
            ];
            const pullRequestBody = new pull_request_body_1.PullRequestBody(data);
            snapshot(pullRequestBody.toString());
        });
        (0, mocha_1.it)('can handle a single entries forced components', () => {
            const data = [
                {
                    component: 'pkg1',
                    version: version_1.Version.parse('1.2.3'),
                    notes: 'some special notes go here',
                },
            ];
            const pullRequestBody = new pull_request_body_1.PullRequestBody(data, { useComponents: true });
            snapshot(pullRequestBody.toString());
        });
        (0, mocha_1.it)('can handle a custom header and footer', () => {
            const data = [
                {
                    component: 'pkg1',
                    version: version_1.Version.parse('1.2.3'),
                    notes: 'some special notes go here',
                },
                {
                    component: 'pkg2',
                    version: version_1.Version.parse('2.0.0'),
                    notes: 'more special notes go here',
                },
            ];
            const pullRequestBody = new pull_request_body_1.PullRequestBody(data, {
                header: 'My special header!!!',
                footer: 'A custom footer',
            });
            snapshot(pullRequestBody.toString());
        });
        (0, mocha_1.it)('can parse the generated output', () => {
            const data = [
                {
                    component: 'pkg1',
                    version: version_1.Version.parse('1.2.3'),
                    notes: 'some special notes go here',
                },
                {
                    component: 'pkg2',
                    version: version_1.Version.parse('2.0.0'),
                    notes: 'more special notes go here',
                },
            ];
            const pullRequestBody = new pull_request_body_1.PullRequestBody(data, {
                header: 'My special header!!!',
                footer: 'A custom footer',
            });
            const pullRequestBody2 = pull_request_body_1.PullRequestBody.parse(pullRequestBody.toString());
            (0, chai_1.expect)(pullRequestBody2 === null || pullRequestBody2 === void 0 ? void 0 : pullRequestBody2.releaseData).to.eql(data);
            (0, chai_1.expect)(pullRequestBody2 === null || pullRequestBody2 === void 0 ? void 0 : pullRequestBody2.header).to.eql('My special header!!!');
            (0, chai_1.expect)(pullRequestBody2 === null || pullRequestBody2 === void 0 ? void 0 : pullRequestBody2.footer).to.eql('A custom footer');
        });
        (0, mocha_1.it)('can handle componently entries', () => {
            const data = [
                {
                    version: version_1.Version.parse('1.2.3'),
                    notes: 'some special notes go here',
                },
                {
                    component: 'pkg2',
                    version: version_1.Version.parse('2.0.0'),
                    notes: 'more special notes go here',
                },
            ];
            const pullRequestBody = new pull_request_body_1.PullRequestBody(data);
            snapshot(pullRequestBody.toString());
        });
    });
});
//# sourceMappingURL=pull-request-body.js.map