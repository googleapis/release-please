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

import {readFileSync} from 'fs';
import * as path from 'path';
import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {expect} from 'chai';

import {CommitSplit, CommitSplitOptions} from '../src/commit-split';
import {GitHub} from '../src/github';
import {Commit, graphqlToCommits} from '../src/graphql-to-commits';
import {buildMockCommit} from './helpers';

const fixturesPath = './test/fixtures';

const github = new GitHub({owner: 'fake', repo: 'fake'});

describe('CommitSplit', () => {
  it('partitions commits based on path from root directory by default', async () => {
    const graphql = JSON.parse(
      readFileSync(
        path.resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
        'utf8'
      )
    );
    const commits: Commit[] = (await graphqlToCommits(github, graphql)).commits;
    const cs = new CommitSplit();
    snapshot(cs.split(commits));
  });

  type ExpectedCommitSplit = Record<string, Commit[]>;
  type PackagePaths = string[];

  // Fixture data and expected results for "partitions commits by ..." tests.
  // Returns a tuple of
  // [
  //   expected CommitSplit.split() output,
  //   input to use for CommitSplitOptions.packagePaths,
  //   input to use for CommitSplit.split()
  // ]
  //
  // includeEmpty == true:
  //   - adds an empty commit to input to use for CommitSplit.split()
  //   - adds that empty commit to each list of expected CommitSplit.split()
  //     output commits
  // usePackagePaths == true:
  //   - populate input to use for CommitSplitOptions.packagePaths
  //   - populate expected CommitSplit.split() keyed by packagePaths entries
  //     and restricted to commits touching child-path files
  // usePackagePaths == false:
  //   - undefined for CommitSplitOptions.packagePaths
  //   - populate expected CommitSplit.split() keyed by top level folders
  const setupPackagePathCommits = (
    includeEmpty: boolean,
    usePackagePaths: boolean
  ): [ExpectedCommitSplit, PackagePaths, Commit[]] => {
    const pkgsPath = 'packages';
    const fooPath = path.join(pkgsPath, 'foo');
    const barPath = path.join(pkgsPath, 'bar');
    const bazPath = 'python';
    const somePath = 'some';
    const fooCommit = buildMockCommit('fix(foo): fix foo', [
      path.join(fooPath, 'foo.ts'),
    ]);
    const barCommit = buildMockCommit('fix(bar): fix bar', [
      path.join(barPath, 'bar.ts'),
    ]);
    const bazCommit = buildMockCommit('fix(baz): fix baz', [
      path.join(bazPath, 'baz', 'baz.py'),
    ]);
    const foobarCommit = buildMockCommit('fix(foobar): fix foobar', [
      path.join(fooPath, 'foo.ts'),
      path.join(barPath, 'bar.ts'),
    ]);
    const foobarbazCommit = buildMockCommit('fix(foobarbaz): fix foobarbaz', [
      path.join(fooPath, 'foo.ts'),
      path.join(barPath, 'bar.ts'),
      path.join(bazPath, 'baz', 'baz.py'),
    ]);
    const someCommit = buildMockCommit('fix(some): fix something', [
      path.join(somePath, 'other', 'file.ts'),
    ]);
    const emptyCommit = buildMockCommit(
      'chore: empty\n\nrelease-packages/foo-as: 1.2.3',
      []
    );
    const topLevelFileCommit = buildMockCommit('fix(file): top level file', [
      'topLevelFile.ts',
    ]);
    const commits = [
      fooCommit,
      barCommit,
      bazCommit,
      foobarCommit,
      foobarbazCommit,
      // should only appear in usePackagePaths == false case
      someCommit,
      emptyCommit,
      // should not appear in any case
      topLevelFileCommit,
    ];

    let packagePaths: string[] = [];
    let perPathCommits: ExpectedCommitSplit = {};

    if (usePackagePaths) {
      // trailing slash to test path normalization.
      packagePaths = [fooPath, barPath, bazPath + '/'];
      // Expected output of commit-split with packagePaths
      // someCommit and topLevelFileCommit not present
      perPathCommits = {
        [fooPath]: [fooCommit, foobarCommit, foobarbazCommit],
        [barPath]: [barCommit, foobarCommit, foobarbazCommit],
        [bazPath]: [bazCommit, foobarbazCommit],
      };
    } else {
      // Expected output of commit-split with default behavior
      // topLevelFileCommit not present
      perPathCommits = {
        [pkgsPath]: [fooCommit, barCommit, foobarCommit, foobarbazCommit],
        [bazPath]: [bazCommit, foobarbazCommit],
        [somePath]: [someCommit],
      };
    }
    if (includeEmpty) {
      // Expected that each splits' Commit[] will have the empty commit appended
      for (const commitPath in perPathCommits) {
        perPathCommits[commitPath].push(emptyCommit);
      }
    }
    return [perPathCommits, packagePaths, commits];
  };

  // Test combinations of commit splitting with CommitSplitOptions.includeEmpty
  // and CommitSplitOptions.packagePaths set to the following values
  const emptyVsPaths = [
    // CommitSplitOptions.includeEmpty == true
    // CommitSplitOptions.packagePaths == ["packages/foo", "packages/bar", "python"]
    [true, true],
    // CommitSplitOptions.includeEmpty == true
    // CommitSplitOptions.packagePaths == undefined
    [true, false],
    // CommitSplitOptions.includeEmpty == undefined
    // CommitSplitOptions.packagePaths == ["packages/foo", "packages/bar", "python"]
    [false, true],
    // CommitSplitOptions.includeEmpty == undefined
    // CommitSplitOptions.packagePaths == undefined
    [false, false],
  ];
  for (const [includeEmpty, usePackagePaths] of emptyVsPaths) {
    it(`partitions commits by ${
      usePackagePaths ? 'specified' : 'top level'
    } paths: includeEmpty(${includeEmpty})`, () => {
      const [
        expectedSplitCommitSplit,
        packagePaths,
        commits,
      ] = setupPackagePathCommits(includeEmpty, usePackagePaths);
      const commitSplitOpts: CommitSplitOptions = {};
      if (usePackagePaths) {
        commitSplitOpts.packagePaths = packagePaths;
      }
      if (includeEmpty) {
        commitSplitOpts.includeEmpty = includeEmpty;
      }
      const cs = new CommitSplit(commitSplitOpts);
      const actualSplitCommits = cs.split(commits);

      expect(actualSplitCommits).to.eql(expectedSplitCommitSplit);
    });
  }

  // Test invalid CommitSplitOptions.packagePaths combinations.
  // Intentionally inconsistent trailing slashes to test path normalization.
  const invalidPaths = [
    // "foo/bar" overlaps "foo"
    ['foo/bar', 'foo/'],
    // ditto, testing order
    ['foo', 'foo/bar/'],
    // "one/two/three" overlaps "one/two"
    ['one/two/', 'foo/bar/', 'one/two/three'],
  ];
  for (const invalid of invalidPaths) {
    it(`validates configured paths: ${invalid}`, () => {
      let caught = false;
      try {
        new CommitSplit({packagePaths: invalid});
      } catch (e) {
        caught = true;
      }
      expect(caught).to.be.true;
    });
  }
});
