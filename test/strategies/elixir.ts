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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {Elixir} from '../../src/strategies/elixir';
import {buildMockConventionalCommit, assertHasUpdate} from '../helpers';
import * as nock from 'nock';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {Version} from '../../src/version';
import {TagName} from '../../src/util/tag-name';
import {expect} from 'chai';
import {Changelog} from '../../src/updaters/changelog';
import {ElixirMixExs} from '../../src/updaters/elixir/elixir-mix-exs';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();

describe('Elixir', () => {
  let github: GitHub;
  const commits = [
    ...buildMockConventionalCommit(
      'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
    ),
  ];
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'elixir-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const strategy = new Elixir({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits,
        latestRelease,
      });
      expect(release?.version?.toString()).to.eql(expectedVersion);
    });
    it('builds a release pull request', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Elixir({
        targetBranch: 'main',
        github,
        component: 'some-elixir-package',
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'some-elixir-package'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest({
        commits,
        latestRelease,
      });
      expect(release?.version?.toString()).to.eql(expectedVersion);
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new Elixir({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits,
        latestRelease,
      });
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'mix.exs', ElixirMixExs);
    });
  });
});
