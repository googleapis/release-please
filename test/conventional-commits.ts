/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ConventionalCommits} from '../src/conventional-commits';

const {expect} = require('chai');

describe('ConventionalCommits', () => {
  describe('suggestBump', () => {
    it('suggests minor release for breaking change pre 1.0', async () => {
      const cc = new ConventionalCommits({
        commits: [
          'fix: addressed issues with foo',
          'chore: upgrade to Node 7\n\nBREAKING CHANGE: we were on Node 6',
          'feat: awesome feature'
        ],
        githubRepoUrl: 'https://github.com/bcoe/release-please.git',
        bumpMinorPreMajor: true
      });
      const bump = await cc.suggestBump('0.3.0');
      expect(bump.releaseType).to.equal('minor');
      expect(bump.reason).to.equal('There is 1 BREAKING CHANGE and 1 features');
    });
  });
});
