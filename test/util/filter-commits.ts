// Copyright 2023 Google LLC
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

import {filterCommits} from '../../src/util/filter-commits';
import {describe, it} from 'mocha';
import {expect} from 'chai';

const BREAKING_CHANGE_NOTE = 'BREAKING CHANGE';

describe('filterCommits', () => {
  it('removes unknown commit types', () => {
    const commits = filterCommits([
      {
        type: 'User-Name',
        notes: [],
        references: [],
        bareMessage: '',
        message: '',
        scope: null,
        breaking: false,
        sha: 'deadbeef',
      },
    ]);
    expect(commits.length).to.equal(0);
  });
  it('removes unknown commit type for breaking change', () => {
    const commits = filterCommits([
      {
        type: 'User-Name',
        notes: [
          {
            title: BREAKING_CHANGE_NOTE,
            text: 'foo breaking change',
          },
        ],
        references: [],
        bareMessage: '',
        message: '',
        scope: null,
        breaking: false,
        sha: 'deadbeef',
      },
    ]);
    expect(commits.length).to.equal(0);
  });
  it('removes hidden commit types for non-breaking changes', () => {
    const commits = filterCommits([
      {
        type: 'chore',
        notes: [],
        references: [],
        bareMessage: '',
        message: '',
        scope: null,
        breaking: false,
        sha: 'deadbeef',
      },
    ]);
    expect(commits.length).to.equal(0);
  });
  it('includes hidden commit types for non-breaking changes', () => {
    const commits = filterCommits([
      {
        type: 'chore',
        notes: [
          {
            title: BREAKING_CHANGE_NOTE,
            text: 'foo breaking change',
          },
        ],
        references: [],
        bareMessage: '',
        message: '',
        scope: null,
        breaking: false,
        sha: 'deadbeef',
      },
    ]);
    expect(commits.length).to.equal(1);
  });
  it('includes commits with fix type', () => {
    const commits = filterCommits([
      {
        type: 'fix',
        notes: [],
        references: [],
        bareMessage: 'update readme',
        message: 'update readme',
        scope: null,
        breaking: false,
        sha: 'abc123',
      },
    ]);
    expect(commits.length).to.equal(1);
  });
  it('includes commits with feat type', () => {
    const commits = filterCommits([
      {
        type: 'feat',
        notes: [],
        references: [],
        bareMessage: 'add new feature',
        message: 'add new feature',
        scope: null,
        breaking: false,
        sha: 'def456',
      },
    ]);
    expect(commits.length).to.equal(1);
  });
  it('excludes commits with chore type', () => {
    const commits = filterCommits([
      {
        type: 'chore',
        notes: [],
        references: [],
        bareMessage: 'update dependencies',
        message: 'update dependencies',
        scope: null,
        breaking: false,
        sha: 'ghi789',
      },
    ]);
    expect(commits.length).to.equal(0);
  });
});
