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
const chai_1 = require("chai");
const commit_split_1 = require("../../src/util/commit-split");
(0, mocha_1.describe)('CommitSplit', () => {
    const commits = [
        {
            sha: 'abc123',
            message: 'commit abc123',
            files: ['pkg1/foo.txt', 'pkg2/bar.txt'],
        },
        {
            sha: 'def234',
            message: 'commit def234',
            files: ['pkg1/foo2.txt', 'pkg3/asdf.txt'],
        },
        {
            sha: 'efg',
            message: 'empty files',
            files: [],
        },
        {
            sha: 'hij',
            message: 'path prefixes',
            files: ['pkg5/foo.txt', 'pkg6/pkg5/foo.txt'],
        },
    ];
    (0, mocha_1.it)('defaults to excluding empty commits', () => {
        const commitSplit = new commit_split_1.CommitSplit();
        (0, chai_1.expect)(commitSplit.includeEmpty).to.be.false;
    });
    (0, mocha_1.it)('uses path prefixes', () => {
        const commitSplit = new commit_split_1.CommitSplit({
            packagePaths: ['pkg5', 'pkg6/pkg5'],
        });
        const splitCommits = commitSplit.split(commits);
        (0, chai_1.expect)(splitCommits['pkg1']).to.be.undefined;
        (0, chai_1.expect)(splitCommits['pkg2']).to.be.undefined;
        (0, chai_1.expect)(splitCommits['pkg3']).to.be.undefined;
        (0, chai_1.expect)(splitCommits['pkg4']).to.be.undefined;
        (0, chai_1.expect)(splitCommits['pkg5']).lengthOf(1);
        (0, chai_1.expect)(splitCommits['pkg6/pkg5']).lengthOf(1);
    });
    (0, mocha_1.it)('handles nested folders', () => {
        const commits = [
            {
                sha: 'abc123',
                message: 'commit abc123',
                files: ['core/foo.txt', 'pkg2/bar.txt'],
            },
            {
                sha: 'def234',
                message: 'commit def234',
                files: ['core/subpackage/foo2.txt', 'pkg3/asdf.txt'],
            },
        ];
        const commitSplit = new commit_split_1.CommitSplit({
            packagePaths: ['core', 'core/subpackage'],
        });
        const splitCommits = commitSplit.split(commits);
        (0, chai_1.expect)(splitCommits['core']).lengthOf(1);
        (0, chai_1.expect)(splitCommits['core/subpackage']).lengthOf(1);
    });
    (0, mocha_1.describe)('including empty commits', () => {
        (0, mocha_1.it)('should separate commits', () => {
            const commitSplit = new commit_split_1.CommitSplit({
                includeEmpty: true,
            });
            const splitCommits = commitSplit.split(commits);
            (0, chai_1.expect)(splitCommits['pkg1']).lengthOf(3);
            (0, chai_1.expect)(splitCommits['pkg2']).lengthOf(2);
            (0, chai_1.expect)(splitCommits['pkg3']).lengthOf(2);
            (0, chai_1.expect)(splitCommits['pkg4']).to.be.undefined;
        });
        (0, mocha_1.it)('should separate commits with limited list of paths', () => {
            const commitSplit = new commit_split_1.CommitSplit({
                includeEmpty: true,
                packagePaths: ['pkg1', 'pkg4'],
            });
            const splitCommits = commitSplit.split(commits);
            (0, chai_1.expect)(splitCommits['pkg1']).lengthOf(3);
            (0, chai_1.expect)(splitCommits['pkg2']).to.be.undefined;
            (0, chai_1.expect)(splitCommits['pkg3']).to.be.undefined;
            (0, chai_1.expect)(splitCommits['pkg4']).lengthOf(1);
        });
    });
    (0, mocha_1.describe)('excluding empty commits', () => {
        (0, mocha_1.it)('should separate commits', () => {
            const commitSplit = new commit_split_1.CommitSplit({
                includeEmpty: false,
            });
            const splitCommits = commitSplit.split(commits);
            (0, chai_1.expect)(splitCommits['pkg1']).lengthOf(2);
            (0, chai_1.expect)(splitCommits['pkg2']).lengthOf(1);
            (0, chai_1.expect)(splitCommits['pkg3']).lengthOf(1);
            (0, chai_1.expect)(splitCommits['pkg4']).to.be.undefined;
        });
        (0, mocha_1.it)('should separate commits with limited list of paths', () => {
            const commitSplit = new commit_split_1.CommitSplit({
                includeEmpty: false,
                packagePaths: ['pkg1', 'pkg4'],
            });
            const splitCommits = commitSplit.split(commits);
            (0, chai_1.expect)(splitCommits['pkg1']).lengthOf(2);
            (0, chai_1.expect)(splitCommits['pkg2']).to.be.undefined;
            (0, chai_1.expect)(splitCommits['pkg3']).to.be.undefined;
            (0, chai_1.expect)(splitCommits['pkg4']).to.be.undefined;
        });
    });
});
//# sourceMappingURL=commit-split.js.map