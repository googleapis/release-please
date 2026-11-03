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
import {describe, it} from 'mocha';
import {SentenceCase} from '../../src/plugins/sentence-case';
import {expect} from 'chai';

import {GitHub} from '../../src/github';
import {buildMockConventionalCommit} from '../helpers';

describe('SentenceCase Plugin', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'node-test-repo',
      defaultBranch: 'main',
    });
  });
  describe('processCommits', () => {
    it('converts description to sentence case', async () => {
      const plugin = new SentenceCase(github, 'main', {});
      const commits = await plugin.processCommits([
        ...buildMockConventionalCommit('fix: hello world'),
        ...buildMockConventionalCommit('fix: Goodnight moon'),
      ]);
      expect(commits[0].message).to.equal('fix: Hello world');
      expect(commits[1].message).to.equal('fix: Goodnight moon');
    });
    it('converts breaking changes from the subject to sentence case', () => {
      const plugin = new SentenceCase(github, 'main', {});
      const commits = plugin.processCommits([
        ...buildMockConventionalCommit('feat!: add support for proxies'),
      ]);
      expect(commits[0].message).to.equal('feat!: Add support for proxies');
      expect(commits[0].bareMessage).to.equal('Add support for proxies');
      expect(commits[0].notes).to.deep.equal([
        {title: 'BREAKING CHANGE', text: 'Add support for proxies'},
      ]);
    });
    it('converts explicit breaking change notes to sentence case', () => {
      const plugin = new SentenceCase(github, 'main', {});
      const commits = plugin.processCommits([
        ...buildMockConventionalCommit(
          'feat: update support\n\nBREAKING CHANGE: remove legacy support'
        ),
      ]);
      expect(commits[0].notes).to.deep.equal([
        {title: 'BREAKING CHANGE', text: 'Remove legacy support'},
      ]);
    });
    it('preserves reserved first words in breaking change notes', () => {
      const plugin = new SentenceCase(github, 'main', {});
      const commits = plugin.processCommits([
        ...buildMockConventionalCommit('feat!: npm requires an update'),
        ...buildMockConventionalCommit('feat!: gRPC requires an update'),
      ]);
      expect(commits[0].notes[0].text).to.equal('npm requires an update');
      expect(commits[1].notes[0].text).to.equal('gRPC requires an update');
    });
    it('respects custom specialWords in breaking change notes', () => {
      const plugin = new SentenceCase(github, 'main', {}, ['hello']);
      const commits = plugin.processCommits([
        ...buildMockConventionalCommit('feat!: hello world'),
        ...buildMockConventionalCommit('feat!: npm requires an update'),
      ]);
      expect(commits[0].notes[0].text).to.equal('hello world');
      expect(commits[1].notes[0].text).to.equal('Npm requires an update');
    });
    it('preserves note formatting and unrelated notes', () => {
      const plugin = new SentenceCase(github, 'main', {});
      const commits = buildMockConventionalCommit('feat: update support');
      commits[0].notes = [
        {
          title: 'BREAKING CHANGE',
          text: 'remove legacy support\n\n#### Migration\n- use the new API\n',
        },
        {title: 'BREAKING CHANGE', text: ''},
        {title: 'BREAKING CHANGE', text: 'Already capitalized'},
        {title: 'RELEASE AS', text: 'next'},
      ];
      plugin.processCommits(commits);
      expect(commits[0].notes).to.deep.equal([
        {
          title: 'BREAKING CHANGE',
          text: 'Remove legacy support\n\n#### Migration\n- use the new API\n',
        },
        {title: 'BREAKING CHANGE', text: ''},
        {title: 'BREAKING CHANGE', text: 'Already capitalized'},
        {title: 'RELEASE AS', text: 'next'},
      ]);
    });
    it('leaves reserved words lowercase', async () => {
      const plugin = new SentenceCase(github, 'main', {});
      const commits = await plugin.processCommits([
        ...buildMockConventionalCommit('feat: gRPC can now handle proxies'),
        ...buildMockConventionalCommit('fix: npm now rocks'),
      ]);
      expect(commits[0].message).to.equal('feat: gRPC can now handle proxies');
      expect(commits[1].message).to.equal('fix: npm now rocks');
    });
    it('handles sentences with now breaks', async () => {
      const plugin = new SentenceCase(github, 'main', {});
      const commits = await plugin.processCommits([
        ...buildMockConventionalCommit('feat: beep-boop-hello'),
        ...buildMockConventionalCommit('fix:log4j.foo.bar'),
      ]);
      expect(commits[0].message).to.equal('feat: Beep-boop-hello');
      expect(commits[1].message).to.equal('fix: Log4j.foo.bar');
    });
  });
  it('allows a custom list of specialWords to be provided', async () => {
    const plugin = new SentenceCase(github, 'main', {}, ['hello']);
    const commits = await plugin.processCommits([
      ...buildMockConventionalCommit('fix: hello world'),
      ...buildMockConventionalCommit('fix: Goodnight moon'),
    ]);
    expect(commits[0].message).to.equal('fix: hello world');
    expect(commits[1].message).to.equal('fix: Goodnight moon');
  });
  it('handles subject with multiple : characters', async () => {
    const plugin = new SentenceCase(github, 'main', {}, []);
    const commits = await plugin.processCommits([
      ...buildMockConventionalCommit('abc123'),
      ...buildMockConventionalCommit('fix: hello world:goodnight moon'),
    ]);
    expect(commits[0].message).to.equal('fix: Hello world:goodnight moon');
  });
  it('handles commit with no :', async () => {
    const plugin = new SentenceCase(github, 'main', {}, []);
    const commits = await plugin.processCommits([
      ...buildMockConventionalCommit('hello world goodnight moon'),
    ]);
    // Ensure there's no exception, a commit without a <type> is not
    // a conventional commit, and will not show up in CHANGELOG. We
    // Do not bother sentence-casing:
    console.info(commits);
    expect(commits.length).to.equal(0);
  });
});
