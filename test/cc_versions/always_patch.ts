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

import {ConventionalChangelogCommit} from '@conventional-commits/parser';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {alwaysPatch} from '../../src/cc_versions/always_patch';

describe('alwaysPatch', () => {
  const expectedResult = {
    level: 2,
    reason: 'Always bump patch strategy: 0 features',
    releaseType: 'patch',
  };
  const commits: ConventionalChangelogCommit[] = [
    {
      type: 'feat',
      scope: null,
      subject: 'some new feature',
      merge: null,
      header: '',
      body: null,
      footer: null,
      notes: [],
      references: [],
      mentions: [],
      revert: null,
    },
    {
      type: 'fix',
      scope: null,
      subject: 'some new feature',
      merge: null,
      header: '',
      body: null,
      footer: null,
      notes: [{title: 'BREAKING CHANGE', text: ''}],
      references: [],
      mentions: [],
      revert: null,
    },
  ];
  for (const commit of commits) {
    it('always only bumps patch', () => {
      const resultMajor = alwaysPatch([commit], false);
      expect(resultMajor).to.eql(expectedResult);
      const resultPreMajor = alwaysPatch([commit], true);
      expect(resultPreMajor).to.eql(expectedResult);
    });
  }
});
