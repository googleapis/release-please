// Copyright 2026 Google LLC
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

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {ReleaseAncestry} from '../../src/util/release-ancestry';
import {Commit} from '../../src/commit';

function commit(sha: string, parents?: string[]): Commit {
  return {sha, message: `fix: ${sha}`, parents};
}

function shas(commits: Commit[] | undefined): string[] | undefined {
  return commits?.map(c => c.sha);
}

describe('ReleaseAncestry', () => {
  // Newest committer date first. `branch1` and `branch2` were cut from
  // `base` before release `rel` and merged after it by `merge`.
  const history = [
    commit('merge', ['rel', 'branch2']),
    commit('rel', ['base']),
    commit('branch2', ['branch1']),
    commit('branch1', ['base']),
    commit('base', ['root']),
    commit('root', []),
  ];

  it('stays incomplete until the late branch is walked', () => {
    const ancestry = new ReleaseAncestry(['rel']);
    const completeBefore: Record<string, boolean> = {};
    for (const c of history) {
      completeBefore[c.sha] = ancestry.isComplete();
      ancestry.visit(c);
    }
    expect(completeBefore).to.eql({
      merge: true,
      rel: false,
      branch2: false,
      branch1: false,
      base: true,
      root: true,
    });
  });

  it('filters out exactly what the release contains', () => {
    const ancestry = new ReleaseAncestry(['rel']);
    history.forEach(c => ancestry.visit(c));
    expect(shas(ancestry.notReleasedBy(history, 'rel'))).to.eql([
      'merge',
      'branch2',
      'branch1',
    ]);
  });

  it('filters each release by its own ancestry', () => {
    // `old` released one package, then `mid` landed, then `new` released
    // another package.
    const linear = [
      commit('head', ['new']),
      commit('new', ['mid']),
      commit('mid', ['old']),
      commit('old', ['root']),
      commit('root', []),
    ];
    const ancestry = new ReleaseAncestry(['old', 'new']);
    const completeBefore: Record<string, boolean> = {};
    for (const c of linear) {
      completeBefore[c.sha] = ancestry.isComplete();
      ancestry.visit(c);
    }
    expect(completeBefore.mid).to.be.false;
    expect(completeBefore.root).to.be.true;
    expect(shas(ancestry.notReleasedBy(linear, 'old'))).to.eql([
      'head',
      'new',
      'mid',
    ]);
    expect(shas(ancestry.notReleasedBy(linear, 'new'))).to.eql(['head']);
  });

  it('contains a parent walked before its release', () => {
    // Skewed dates: `a` sorts ahead of its child `rel`.
    const skewed = [
      commit('head', ['rel']),
      commit('a', ['b']),
      commit('rel', ['a']),
      commit('b', []),
    ];
    const ancestry = new ReleaseAncestry(['rel']);
    skewed.forEach(c => ancestry.visit(c));
    expect(shas(ancestry.notReleasedBy(skewed, 'rel'))).to.eql(['head']);
    expect(ancestry.isComplete()).to.be.true;
  });

  it('keeps walking until a commit walked out of order is linked', () => {
    // Skewed dates: `old` sorts ahead of `late` and `p`, though only `q`,
    // walked last, leads to it.
    const skewed = [
      commit('head', ['rel', 'late']),
      commit('rel', ['p']),
      commit('old', []),
      commit('late', ['p']),
      commit('p', ['q']),
      commit('q', ['old']),
    ];
    const ancestry = new ReleaseAncestry(['rel']);
    const completeBefore: Record<string, boolean> = {};
    for (const c of skewed) {
      completeBefore[c.sha] = ancestry.isComplete();
      ancestry.visit(c);
    }
    expect(completeBefore.p).to.be.false;
    expect(completeBefore.q).to.be.false;
    expect(ancestry.isComplete()).to.be.true;
    expect(shas(ancestry.notReleasedBy(skewed, 'rel'))).to.eql([
      'head',
      'late',
    ]);
  });

  it('returns every commit for a path with no release', () => {
    const ancestry = new ReleaseAncestry(['rel']);
    history.forEach(c => ancestry.visit(c));
    expect(shas(ancestry.notReleasedBy(history, undefined))).to.eql(
      shas(history)
    );
  });

  it('gives up when a commit has no parents field', () => {
    const ancestry = new ReleaseAncestry(['rel']);
    ancestry.visit(commit('merge', ['rel', 'branch2']));
    ancestry.visit(commit('rel'));
    expect(ancestry.isComplete()).to.be.true;
    expect(ancestry.notReleasedBy(history, 'rel')).to.be.undefined;
  });
});
