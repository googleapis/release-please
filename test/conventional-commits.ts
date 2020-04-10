// Copyright 2019 Google LLC
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

import {ConventionalCommits} from '../src/conventional-commits';
import {describe, it} from 'mocha';
import {expect} from 'chai';

import * as snapshot from 'snap-shot-it';

describe('ConventionalCommits', () => {
  describe('suggestBump', () => {
    it('suggests minor release for breaking change pre 1.0', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message: 'fix: addressed issues with foo',
            sha: 'abc123',
            files: [],
          },
          {
            message:
              'chore: upgrade to Node 7\n\nBREAKING CHANGE: we were on Node 6',
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        githubRepoUrl: 'https://github.com/bcoe/release-please.git',
        bumpMinorPreMajor: true,
      });
      const bump = await cc.suggestBump('0.3.0');
      expect(bump.releaseType).to.equal('minor');
      expect(bump.reason).to.equal('There is 1 BREAKING CHANGE and 1 features');
    });
  });

  describe('generateChangelogEntry', () => {
    // See: https://github.com/googleapis/nodejs-logging/commit/ce29b498ebb357403c093053d1b9989f1a56f5af
    it('does not include content two newlines after BREAKING CHANGE', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message:
              'chore: upgrade to Node 7\n\nBREAKING CHANGE: we were on Node 6\n\nI should be removed',
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        githubRepoUrl: 'https://github.com/bcoe/release-please.git',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl);
    });
  });
});
