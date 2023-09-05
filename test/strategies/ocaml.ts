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
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {OCaml} from '../../src/strategies/ocaml';
import * as sinon from 'sinon';
import {
  assertHasUpdate,
  assertNoHasUpdate,
  stubFilesFromFixtures,
} from '../helpers';
import {buildMockConventionalCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {EsyJson} from '../../src/updaters/ocaml/esy-json';
import {Opam} from '../../src/updaters/ocaml/opam';
import {DuneProject} from '../../src/updaters/ocaml/dune-project';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/ocaml';

const COMMITS = [
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
  ),
  ...buildMockConventionalCommit('chore: update common templates'),
];

describe('OCaml', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'ocaml-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const strategy = new OCaml({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByExtensionAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new OCaml({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByExtensionAndRef').resolves([]);
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'google-cloud-automl'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new OCaml({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByExtensionAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      expect(updates).lengthOf(2);
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'dune-project', DuneProject);
    });

    it('finds and updates a project files', async () => {
      const strategy = new OCaml({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const findFilesStub = sandbox.stub(github, 'findFilesByExtensionAndRef');
      findFilesStub
        .withArgs('json', 'main', '.')
        .resolves(['esy.json', 'other.json']);
      findFilesStub.withArgs('opam', 'main', '.').resolves(['sample.opam']);
      findFilesStub
        .withArgs('opam.locked', 'main', '.')
        .resolves(['sample.opam.locked']);
      stubFilesFromFixtures({
        sandbox,
        github,
        targetBranch: 'main',
        fixturePath: fixturesPath,
        files: ['esy.json', 'other.json', 'sample.opam', 'sample.opam.locked'],
      });
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      expect(updates).lengthOf(5);
      assertHasUpdate(updates, 'esy.json', EsyJson);
      assertNoHasUpdate(updates, 'other.json');
      assertHasUpdate(updates, 'sample.opam', Opam);
      assertHasUpdate(updates, 'sample.opam.locked', Opam);
    });
  });
});
