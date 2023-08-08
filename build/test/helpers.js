"use strict";
// Copyright 2020 Google LLC
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
exports.MockPullRequestOverflowHandler = exports.mockReleaseData = exports.mockPullRequests = exports.mockTags = exports.mockReleases = exports.mockCommits = exports.buildMockCandidatePullRequest = exports.buildCommitFromFixture = exports.loadCommitFixtures = exports.assertNoHasUpdate = exports.assertHasUpdates = exports.assertHasUpdate = exports.getFilesInDirWithPrefix = exports.getFilesInDir = exports.stubFilesFromFixtures = exports.buildGitHubFileRaw = exports.buildGitHubFileContent = exports.buildMockCommit = exports.buildMockConventionalCommit = exports.readPOJO = exports.stringifyExpectedChanges = exports.dateSafe = exports.safeSnapshot = exports.stubSuggesterWithSnapshot = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const crypto = require("crypto");
const snapshot = require("snap-shot-it");
const suggester = require("code-suggester");
const commit_1 = require("../src/commit");
const chai_1 = require("chai");
const version_1 = require("../src/version");
const pull_request_title_1 = require("../src/util/pull-request-title");
const pull_request_body_1 = require("../src/util/pull-request-body");
const branch_name_1 = require("../src/util/branch-name");
const git_file_utils_1 = require("@google-automations/git-file-utils");
const composite_1 = require("../src/updaters/composite");
function stubSuggesterWithSnapshot(sandbox, snapName) {
    sandbox.replace(suggester, 'createPullRequest', (_octokit, changes, options) => {
        snapshot(snapName + ': changes', stringifyExpectedChanges([...changes]));
        snapshot(snapName + ': options', stringifyExpectedOptions(options));
        return Promise.resolve(22);
    });
}
exports.stubSuggesterWithSnapshot = stubSuggesterWithSnapshot;
function safeSnapshot(content) {
    snapshot(dateSafe(newLine(content)));
}
exports.safeSnapshot = safeSnapshot;
function dateSafe(content) {
    return content.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1983-10-10' // use a fake date, so that we don't break daily.
    );
}
exports.dateSafe = dateSafe;
function stringifyExpectedOptions(expected) {
    expected.description = newLine(expected.description);
    let stringified = '';
    for (const [option, value] of Object.entries(expected)) {
        stringified = `${stringified}\n${option}: ${value}`;
    }
    return dateSafe(stringified);
}
function newLine(content) {
    return content.replace(/\r\n/g, '\n');
}
/*
 * Given an object of changes expected to be made by code-suggester API,
 * stringify content in such a way that it works well for snapshots:
 */
function stringifyExpectedChanges(expected) {
    let stringified = '';
    for (const update of expected) {
        stringified = `${stringified}\nfilename: ${update[0]}`;
        const obj = update[1];
        stringified = `${stringified}\n${newLine(obj.content)}`;
    }
    return dateSafe(stringified);
}
exports.stringifyExpectedChanges = stringifyExpectedChanges;
/*
 * Reads a plain-old-JavaScript object, stored in fixtures directory.
 * these are used to represent responses from the methods in the github.ts
 * wrapper for GitHub API calls:
 */
function readPOJO(name) {
    const content = (0, fs_1.readFileSync)((0, path_1.resolve)('./test/fixtures/pojos', `${name}.json`), 'utf8');
    return JSON.parse(content);
}
exports.readPOJO = readPOJO;
function buildMockConventionalCommit(message, files = []) {
    return (0, commit_1.parseConventionalCommits)([
        {
            // Ensure SHA is same on Windows with replace:
            sha: crypto
                .createHash('md5')
                .update(message.replace(/\r\n/g, '\n'))
                .digest('hex'),
            message,
            files: files,
        },
    ]);
}
exports.buildMockConventionalCommit = buildMockConventionalCommit;
function buildMockCommit(message, files = []) {
    return {
        // Ensure SHA is same on Windows with replace:
        sha: crypto
            .createHash('md5')
            .update(message.replace(/\r\n/g, '\n'))
            .digest('hex'),
        message,
        files: files,
    };
}
exports.buildMockCommit = buildMockCommit;
function buildGitHubFileContent(fixturesPath, fixture) {
    return buildGitHubFileRaw((0, fs_1.readFileSync)((0, path_1.resolve)(fixturesPath, fixture), 'utf8').replace(/\r\n/g, '\n'));
}
exports.buildGitHubFileContent = buildGitHubFileContent;
function buildGitHubFileRaw(content) {
    return {
        content: Buffer.from(content, 'utf8').toString('base64'),
        parsedContent: content,
        // fake a consistent sha
        sha: crypto.createHash('md5').update(content).digest('hex'),
        mode: git_file_utils_1.DEFAULT_FILE_MODE,
    };
}
exports.buildGitHubFileRaw = buildGitHubFileRaw;
function stubFilesFromFixtures(options) {
    var _a, _b, _c;
    const { fixturePath, sandbox, github, files } = options;
    const inlineFiles = (_a = options.inlineFiles) !== null && _a !== void 0 ? _a : [];
    const overlap = inlineFiles.filter(f => files.includes(f[0]));
    if (overlap.length > 0) {
        throw new Error('Overlap between files and inlineFiles: ' + JSON.stringify(overlap));
    }
    const targetBranch = (_b = options.targetBranch) !== null && _b !== void 0 ? _b : 'master';
    const flatten = (_c = options.flatten) !== null && _c !== void 0 ? _c : true;
    const stub = sandbox.stub(github, 'getFileContentsOnBranch');
    for (const file of files) {
        let fixtureFile = file;
        if (flatten) {
            const parts = file.split('/');
            fixtureFile = parts[parts.length - 1];
        }
        stub
            .withArgs(file, targetBranch)
            .resolves(buildGitHubFileContent(fixturePath, fixtureFile));
    }
    for (const [file, content] of inlineFiles) {
        stub.withArgs(file, targetBranch).resolves(buildGitHubFileRaw(content));
    }
    stub.rejects(Object.assign(Error('not found'), { status: 404 }));
}
exports.stubFilesFromFixtures = stubFilesFromFixtures;
// get list of files in a directory
function getFilesInDir(directory, fileList = []) {
    const items = (0, fs_1.readdirSync)(directory);
    for (const item of items) {
        const stat = (0, fs_1.statSync)(path_1.posix.join(directory, item));
        if (stat.isDirectory())
            fileList = getFilesInDir(path_1.posix.join(directory, item), fileList);
        else
            fileList.push(path_1.posix.join(directory, item));
    }
    return fileList;
}
exports.getFilesInDir = getFilesInDir;
// get list of files with a particular prefix in a directory
function getFilesInDirWithPrefix(directory, prefix) {
    const allFiles = getFilesInDir(directory);
    return allFiles
        .filter(p => {
        return path_1.posix.extname(p) === `.${prefix}`;
    })
        .map(p => path_1.posix.relative(directory, p));
}
exports.getFilesInDirWithPrefix = getFilesInDirWithPrefix;
/* eslint-disable @typescript-eslint/no-explicit-any */
function assertHasUpdate(updates, path, clazz) {
    const found = updates.find(update => {
        return update.path === path;
    });
    (0, chai_1.expect)(found, `update for ${path}`).to.not.be.undefined;
    if (clazz) {
        (0, chai_1.expect)(found === null || found === void 0 ? void 0 : found.updater).instanceof(clazz, `expected update to be of class ${clazz}`);
    }
    return found;
}
exports.assertHasUpdate = assertHasUpdate;
function assertHasUpdates(updates, path, ...clazz) {
    if (clazz.length <= 1) {
        return assertHasUpdate(updates, path, clazz[0]);
    }
    const composite = assertHasUpdate(updates, path, composite_1.CompositeUpdater)
        .updater;
    (0, chai_1.expect)(composite.updaters).to.be.lengthOf(clazz.length, `expected to find exactly ${clazz.length} updaters`);
    for (let i = 0; i < clazz.length; i++) {
        (0, chai_1.expect)(composite.updaters[i]).to.be.instanceof(clazz[i], `expected updaters[${i}] to be of class ${clazz[i]}`);
    }
    return composite;
}
exports.assertHasUpdates = assertHasUpdates;
function assertNoHasUpdate(updates, path) {
    const found = updates.find(update => {
        return update.path === path;
    });
    (0, chai_1.expect)(found, `update for ${path}`).to.be.undefined;
}
exports.assertNoHasUpdate = assertNoHasUpdate;
function loadCommitFixtures(name) {
    const content = (0, fs_1.readFileSync)((0, path_1.resolve)('./test/fixtures/commits', `${name}.json`), 'utf8');
    return JSON.parse(content);
}
exports.loadCommitFixtures = loadCommitFixtures;
function buildCommitFromFixture(name) {
    const message = (0, fs_1.readFileSync)((0, path_1.resolve)('./test/fixtures/commit-messages', `${name}.txt`), 'utf8');
    return buildMockCommit(message);
}
exports.buildCommitFromFixture = buildCommitFromFixture;
function buildMockCandidatePullRequest(path, releaseType, versionString, options = {}) {
    var _a, _b, _c, _d;
    const version = version_1.Version.parse(versionString);
    return {
        path,
        pullRequest: {
            title: pull_request_title_1.PullRequestTitle.ofTargetBranch('main'),
            body: new pull_request_body_1.PullRequestBody([
                {
                    component: options.component,
                    version,
                    notes: (_a = options.notes) !== null && _a !== void 0 ? _a : `Release notes for path: ${path}, releaseType: ${releaseType}`,
                },
            ]),
            updates: (_b = options.updates) !== null && _b !== void 0 ? _b : [],
            labels: (_c = options.labels) !== null && _c !== void 0 ? _c : [],
            headRefName: branch_name_1.BranchName.ofTargetBranch('main').toString(),
            version,
            draft: (_d = options.draft) !== null && _d !== void 0 ? _d : false,
            group: options.group,
        },
        config: {
            releaseType,
        },
    };
}
exports.buildMockCandidatePullRequest = buildMockCandidatePullRequest;
function mockCommits(sandbox, github, commits) {
    async function* fakeGenerator() {
        for (const commit of commits) {
            yield commit;
        }
    }
    return sandbox.stub(github, 'mergeCommitIterator').returns(fakeGenerator());
}
exports.mockCommits = mockCommits;
function mockReleases(sandbox, github, releases) {
    async function* fakeGenerator() {
        for (const release of releases) {
            yield release;
        }
    }
    return sandbox.stub(github, 'releaseIterator').returns(fakeGenerator());
}
exports.mockReleases = mockReleases;
function mockTags(sandbox, github, tags) {
    async function* fakeGenerator() {
        for (const tag of tags) {
            yield tag;
        }
    }
    return sandbox.stub(github, 'tagIterator').returns(fakeGenerator());
}
exports.mockTags = mockTags;
function mockPullRequests(sandbox, github, pullRequests) {
    async function* fakeGenerator() {
        for (const pullRequest of pullRequests) {
            yield pullRequest;
        }
    }
    return sandbox.stub(github, 'pullRequestIterator').returns(fakeGenerator());
}
exports.mockPullRequests = mockPullRequests;
function mockReleaseData(count) {
    const releaseData = [];
    const version = version_1.Version.parse('1.2.3');
    for (let i = 0; i < count; i++) {
        releaseData.push({
            component: `component${i}`,
            version,
            notes: `release notes for component${i}`,
        });
    }
    return releaseData;
}
exports.mockReleaseData = mockReleaseData;
class MockPullRequestOverflowHandler {
    async handleOverflow(pullRequest, _maxSize) {
        return pullRequest.body.toString();
    }
    async parseOverflow(pullRequest) {
        return pull_request_body_1.PullRequestBody.parse(pullRequest.body);
    }
}
exports.MockPullRequestOverflowHandler = MockPullRequestOverflowHandler;
//# sourceMappingURL=helpers.js.map