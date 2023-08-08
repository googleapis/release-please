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
const default_1 = require("../../src/versioning-strategies/default");
const version_1 = require("../../src/version");
(0, mocha_1.describe)('DefaultVersioningStrategy', () => {
    (0, mocha_1.describe)('with breaking change', () => {
        const commits = [
            {
                sha: 'sha1',
                message: 'feat: some feature',
                files: ['path1/file1.txt'],
                type: 'feat',
                scope: null,
                bareMessage: 'some feature',
                notes: [],
                references: [],
                breaking: false,
            },
            {
                sha: 'sha2',
                message: 'fix!: some bugfix',
                files: ['path1/file1.rb'],
                type: 'fix',
                scope: null,
                bareMessage: 'some bugfix',
                notes: [{ title: 'BREAKING CHANGE', text: 'some bugfix' }],
                references: [],
                breaking: true,
            },
            {
                sha: 'sha3',
                message: 'docs: some documentation',
                files: ['path1/file1.java'],
                type: 'docs',
                scope: null,
                bareMessage: 'some documentation',
                notes: [],
                references: [],
                breaking: false,
            },
        ];
        (0, mocha_1.it)('can bump a major', async () => {
            const strategy = new default_1.DefaultVersioningStrategy();
            const oldVersion = version_1.Version.parse('1.2.3');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('2.0.0');
        });
        (0, mocha_1.it)('can bump a major on pre major for breaking change', async () => {
            const strategy = new default_1.DefaultVersioningStrategy();
            const oldVersion = version_1.Version.parse('0.1.2');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('1.0.0');
        });
        (0, mocha_1.it)('can bump a minor pre major for breaking change', async () => {
            const strategy = new default_1.DefaultVersioningStrategy({ bumpMinorPreMajor: true });
            const oldVersion = version_1.Version.parse('0.1.2');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('0.2.0');
        });
    });
    (0, mocha_1.describe)('with a feature', () => {
        const commits = [
            {
                sha: 'sha1',
                message: 'feat: some feature',
                files: ['path1/file1.txt'],
                type: 'feat',
                scope: null,
                bareMessage: 'some feature',
                notes: [],
                references: [],
                breaking: false,
            },
            {
                sha: 'sha2',
                message: 'fix: some bugfix',
                files: ['path1/file1.rb'],
                type: 'fix',
                scope: null,
                bareMessage: 'some bugfix',
                notes: [],
                references: [],
                breaking: false,
            },
            {
                sha: 'sha3',
                message: 'docs: some documentation',
                files: ['path1/file1.java'],
                type: 'docs',
                scope: null,
                bareMessage: 'some documentation',
                notes: [],
                references: [],
                breaking: false,
            },
        ];
        (0, mocha_1.it)('can bump a minor', async () => {
            const strategy = new default_1.DefaultVersioningStrategy();
            const oldVersion = version_1.Version.parse('1.2.3');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('1.3.0');
        });
        (0, mocha_1.it)('can bump a minor pre-major', async () => {
            const strategy = new default_1.DefaultVersioningStrategy();
            const oldVersion = version_1.Version.parse('0.1.2');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('0.2.0');
        });
        (0, mocha_1.it)('can bump a patch pre-major', async () => {
            const strategy = new default_1.DefaultVersioningStrategy({
                bumpPatchForMinorPreMajor: true,
            });
            const oldVersion = version_1.Version.parse('0.1.2');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('0.1.3');
        });
    });
    (0, mocha_1.describe)('with a fix', () => {
        const commits = [
            {
                sha: 'sha2',
                message: 'fix: some bugfix',
                files: ['path1/file1.rb'],
                type: 'fix',
                scope: null,
                bareMessage: 'some bugfix',
                notes: [],
                references: [],
                breaking: false,
            },
            {
                sha: 'sha3',
                message: 'docs: some documentation',
                files: ['path1/file1.java'],
                type: 'docs',
                scope: null,
                bareMessage: 'some documentation',
                notes: [],
                references: [],
                breaking: false,
            },
        ];
        (0, mocha_1.it)('can bump a patch', async () => {
            const strategy = new default_1.DefaultVersioningStrategy();
            const oldVersion = version_1.Version.parse('1.2.3');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('1.2.4');
        });
    });
    (0, mocha_1.describe)('with release-as', () => {
        (0, mocha_1.it)('sets the version', async () => {
            const commits = [
                {
                    sha: 'sha1',
                    message: 'feat: some feature',
                    files: ['path1/file1.txt'],
                    type: 'feat',
                    scope: null,
                    bareMessage: 'some feature',
                    notes: [],
                    references: [],
                    breaking: false,
                },
                {
                    sha: 'sha2',
                    message: 'fix!: some bugfix',
                    files: ['path1/file1.rb'],
                    type: 'fix',
                    scope: null,
                    bareMessage: 'some bugfix',
                    notes: [{ title: 'RELEASE AS', text: '3.1.2' }],
                    references: [],
                    breaking: true,
                },
                {
                    sha: 'sha3',
                    message: 'docs: some documentation',
                    files: ['path1/file1.java'],
                    type: 'docs',
                    scope: null,
                    bareMessage: 'some documentation',
                    notes: [],
                    references: [],
                    breaking: false,
                },
            ];
            const strategy = new default_1.DefaultVersioningStrategy();
            const oldVersion = version_1.Version.parse('1.2.3');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('3.1.2');
        });
        (0, mocha_1.it)('handles multiple release-as commits', async () => {
            const commits = [
                {
                    sha: 'sha1',
                    message: 'feat: some feature',
                    files: ['path1/file1.txt'],
                    type: 'feat',
                    scope: null,
                    bareMessage: 'some feature',
                    notes: [],
                    references: [],
                    breaking: false,
                },
                {
                    sha: 'sha2',
                    message: 'fix!: some bugfix',
                    files: ['path1/file1.rb'],
                    type: 'fix',
                    scope: null,
                    bareMessage: 'some bugfix',
                    notes: [{ title: 'RELEASE AS', text: '3.1.2' }],
                    references: [],
                    breaking: true,
                },
                {
                    sha: 'sha3',
                    message: 'docs: some documentation',
                    files: ['path1/file1.java'],
                    type: 'docs',
                    scope: null,
                    bareMessage: 'some documentation',
                    notes: [],
                    references: [],
                    breaking: false,
                },
                {
                    sha: 'sha4',
                    message: 'fix!: some bugfix',
                    files: ['path1/file1.rb'],
                    type: 'fix',
                    scope: null,
                    bareMessage: 'some bugfix',
                    notes: [{ title: 'RELEASE AS', text: '2.0.0' }],
                    references: [],
                    breaking: true,
                },
            ];
            const strategy = new default_1.DefaultVersioningStrategy();
            const oldVersion = version_1.Version.parse('1.2.3');
            const newVersion = await strategy.bump(oldVersion, commits);
            (0, chai_1.expect)(newVersion.toString()).to.equal('3.1.2');
        });
    });
});
//# sourceMappingURL=default.js.map