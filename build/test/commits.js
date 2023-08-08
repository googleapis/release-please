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
const commit_1 = require("../src/commit");
const helpers_1 = require("./helpers");
(0, mocha_1.describe)('parseConventionalCommits', () => {
    (0, mocha_1.it)('can parse plain commit messages', async () => {
        const commits = [
            (0, helpers_1.buildMockCommit)('feat: some feature'),
            (0, helpers_1.buildMockCommit)('fix: some bugfix'),
            (0, helpers_1.buildMockCommit)('docs: some documentation'),
        ];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(3);
        (0, chai_1.expect)(conventionalCommits[0].type).to.equal('feat');
        (0, chai_1.expect)(conventionalCommits[0].scope).is.null;
        (0, chai_1.expect)(conventionalCommits[1].type).to.equal('fix');
        (0, chai_1.expect)(conventionalCommits[1].scope).is.null;
        (0, chai_1.expect)(conventionalCommits[2].type).to.equal('docs');
        (0, chai_1.expect)(conventionalCommits[2].scope).is.null;
    });
    (0, mocha_1.it)('can parse a breaking change', async () => {
        const commits = [(0, helpers_1.buildMockCommit)('fix!: some breaking fix')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].type).to.equal('fix');
        (0, chai_1.expect)(conventionalCommits[0].scope).is.null;
        (0, chai_1.expect)(conventionalCommits[0].breaking).to.be.true;
        (0, chai_1.expect)(conventionalCommits[0].notes).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].notes[0].title).to.equal('BREAKING CHANGE');
        (0, chai_1.expect)(conventionalCommits[0].notes[0].text).to.equal('some breaking fix');
    });
    (0, mocha_1.it)('can parse multiple commit messages from a single commit', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('multiple-messages')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(2);
        (0, chai_1.expect)(conventionalCommits[0].type).to.equal('fix');
        (0, chai_1.expect)(conventionalCommits[0].scope).is.null;
        (0, chai_1.expect)(conventionalCommits[1].type).to.equal('feat');
        (0, chai_1.expect)(conventionalCommits[1].scope).is.null;
    });
    (0, mocha_1.it)('handles BREAKING CHANGE body', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('breaking-body')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].type).to.eql('feat');
        (0, chai_1.expect)(conventionalCommits[0].breaking).to.be.true;
        (0, chai_1.expect)(conventionalCommits[0].notes).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].notes[0].title).to.eql('BREAKING CHANGE');
        (0, chai_1.expect)(conventionalCommits[0].notes[0].text).to.eql('this is actually a breaking change');
    });
    (0, mocha_1.it)('links bugs', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('bug-link')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].type).to.eql('fix');
        (0, chai_1.expect)(conventionalCommits[0].breaking).to.be.false;
        (0, chai_1.expect)(conventionalCommits[0].references).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].references[0].prefix).to.eql('#');
        (0, chai_1.expect)(conventionalCommits[0].references[0].issue).to.eql('123');
        (0, chai_1.expect)(conventionalCommits[0].references[0].action).to.eql('Fixes');
    });
    (0, mocha_1.it)('captures git trailers', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('git-trailers-with-breaking')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        // the parser detects git trailers as extra semantic commits
        // expect(conventionalCommits).lengthOf(1);
        const mainCommit = conventionalCommits.find(conventionalCommit => conventionalCommit.bareMessage === 'some fix');
        (0, chai_1.expect)(mainCommit).to.not.be.undefined;
        (0, chai_1.expect)(mainCommit.type).to.eql('fix');
        (0, chai_1.expect)(mainCommit.breaking).to.be.true;
        (0, chai_1.expect)(mainCommit.notes).lengthOf(1);
        (0, chai_1.expect)(mainCommit.notes[0].title).to.eql('BREAKING CHANGE');
        (0, chai_1.expect)(mainCommit.notes[0].text).to.eql('this is actually a breaking change');
    });
    (0, mocha_1.it)('parses meta commits', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('meta')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        const fixCommit1 = conventionalCommits.find(conventionalCommit => conventionalCommit.bareMessage === 'fixes bug #733');
        (0, chai_1.expect)(fixCommit1).to.not.be.undefined;
        (0, chai_1.expect)(fixCommit1.type).to.eql('fix');
        (0, chai_1.expect)(fixCommit1.scope).to.be.null;
        const fixCommit2 = conventionalCommits.find(conventionalCommit => conventionalCommit.bareMessage === 'fixes security center.');
        (0, chai_1.expect)(fixCommit2).to.not.be.undefined;
        (0, chai_1.expect)(fixCommit2.type).to.eql('fix');
        (0, chai_1.expect)(fixCommit2.scope).to.eql('securitycenter');
        const featCommit = conventionalCommits.find(conventionalCommit => conventionalCommit.bareMessage === 'migrate microgenerator');
        (0, chai_1.expect)(featCommit).to.not.be.undefined;
        (0, chai_1.expect)(featCommit.breaking).to.be.true;
        (0, chai_1.expect)(featCommit.type).to.eql('feat');
        (0, chai_1.expect)(featCommit.scope).to.eql('recaptchaenterprise');
    });
    (0, mocha_1.it)('includes multi-line breaking changes', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('multi-line-breaking-body')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].breaking).to.be.true;
        (0, chai_1.expect)(conventionalCommits[0].notes).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].notes[0].text).includes('second line');
        (0, chai_1.expect)(conventionalCommits[0].notes[0].text).includes('third line');
    });
    (0, mocha_1.it)('supports additional markdown for breaking change, if prefixed with list', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('multi-line-breaking-body-list')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].breaking).to.be.true;
        (0, chai_1.expect)(conventionalCommits[0].notes).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].notes[0].text).includes('deleted API foo');
        (0, chai_1.expect)(conventionalCommits[0].notes[0].text).includes('deleted API bar');
    });
    (0, mocha_1.it)('does not include content two newlines after BREAKING CHANGE', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('breaking-body-content-after')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].breaking).to.be.true;
        (0, chai_1.expect)(conventionalCommits[0].message).not.include('I should be removed');
    });
    // Refs: #1257
    (0, mocha_1.it)('removes content before and after BREAKING CHANGE in body', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('1257-breaking-change')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        (0, chai_1.expect)(conventionalCommits).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].breaking).to.be.true;
        (0, chai_1.expect)(conventionalCommits[0].notes[0].text).to.equal('my comment');
    });
    (0, mocha_1.it)('handles Release-As footers', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('release-as')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        const metaCommit = conventionalCommits.find(conventionalCommit => conventionalCommit.bareMessage === 'correct release');
        (0, chai_1.expect)(metaCommit).to.not.be.undefined;
        (0, chai_1.expect)(metaCommit.breaking).to.be.false;
        (0, chai_1.expect)(metaCommit.notes).lengthOf(1);
        (0, chai_1.expect)(metaCommit.notes[0].title).to.eql('RELEASE AS');
        (0, chai_1.expect)(metaCommit.notes[0].text).to.eql('v3.0.0');
    });
    (0, mocha_1.it)('can override the commit message from BEGIN_COMMIT_OVERRIDE body', async () => {
        const commit = (0, helpers_1.buildMockCommit)('chore: some commit');
        const body = 'BEGIN_COMMIT_OVERRIDE\nfix: some fix\nEND_COMMIT_OVERRIDE';
        commit.pullRequest = {
            headBranchName: 'fix-something',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: some commit',
            labels: [],
            files: [],
            body,
        };
        const conventionalCommits = (0, commit_1.parseConventionalCommits)([commit]);
        (0, chai_1.expect)(conventionalCommits).lengthOf(1);
        (0, chai_1.expect)(conventionalCommits[0].type).to.eql('fix');
        (0, chai_1.expect)(conventionalCommits[0].bareMessage).to.eql('some fix');
    });
    (0, mocha_1.it)('can override the commit message from BEGIN_COMMIT_OVERRIDE body with a meta commit', async () => {
        const commit = (0, helpers_1.buildMockCommit)('chore: some commit');
        const body = 'BEGIN_COMMIT_OVERRIDE\nfix: some fix\n\nfeat: another feature\nEND_COMMIT_OVERRIDE';
        commit.pullRequest = {
            headBranchName: 'fix-something',
            baseBranchName: 'main',
            number: 123,
            title: 'chore: some commit',
            labels: [],
            files: [],
            body,
        };
        const conventionalCommits = (0, commit_1.parseConventionalCommits)([commit]);
        (0, chai_1.expect)(conventionalCommits).lengthOf(2);
        (0, chai_1.expect)(conventionalCommits[0].type).to.eql('feat');
        (0, chai_1.expect)(conventionalCommits[0].bareMessage).to.eql('another feature');
        (0, chai_1.expect)(conventionalCommits[1].type).to.eql('fix');
        (0, chai_1.expect)(conventionalCommits[1].bareMessage).to.eql('some fix');
    });
    (0, mocha_1.it)('handles a special commit separator', async () => {
        const commits = [(0, helpers_1.buildCommitFromFixture)('multiple-commits-with-separator')];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        let commit = assertHasCommit(conventionalCommits, 'annotating some fields as REQUIRED');
        (0, chai_1.expect)(commit.type).to.eql('fix');
        commit = assertHasCommit(conventionalCommits, 'include metadata file, add exclusions for samples to handwritten libraries');
        (0, chai_1.expect)(commit.type).to.eql('docs');
        (0, chai_1.expect)(commit.scope).to.eql('samples');
        commit = assertHasCommit(conventionalCommits, 'add flag to distinguish autogenerated libs with a handwritten layer');
        (0, chai_1.expect)(commit.type).to.eql('build');
        commit = assertHasCommit(conventionalCommits, 'update v2.14.1 gapic-generator-typescript');
        (0, chai_1.expect)(commit.type).to.eql('chore');
    });
    // it('ignores reverted commits', async () => {
    //   const commits = [
    //     {sha: 'sha1', message: 'feat: some feature', files: ['path1/file1.txt']},
    //     {
    //       sha: 'sha2',
    //       message: 'revert: feat: some feature\nThe reverts commit sha1.\n',
    //       files: ['path1/file1.rb'],
    //     },
    //     {
    //       sha: 'sha3',
    //       message: 'docs: some documentation',
    //       files: ['path1/file1.java'],
    //     },
    //   ];
    //   const conventionalCommits = parseConventionalCommits(commits);
    //   expect(conventionalCommits).lengthOf(1);
    //   expect(conventionalCommits[0].type).to.equal('docs');
    //   expect(conventionalCommits[0].scope).is.null;
    // });
});
function assertHasCommit(commits, bareMessage) {
    const found = commits.find(commit => commit.bareMessage.includes(bareMessage));
    (0, chai_1.expect)(found, `commit with message: '${bareMessage}'`).to.not.be.undefined;
    return found;
}
//# sourceMappingURL=commits.js.map