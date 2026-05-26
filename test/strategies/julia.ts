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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import * as sinon from 'sinon';
import snapshot = require('snap-shot-it');

import {GitHub} from '../../src/github';
import {Julia} from '../../src/strategies/julia';
import {FileNotFoundError} from '../../src/errors';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {ProjectToml} from '../../src/updaters/julia/project-toml';
import {
  assertHasUpdate,
  assertNoHasUpdate,
  buildGitHubFileContent,
  buildMockConventionalCommit,
  dateSafe,
} from '../helpers';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/julia';
const COMMITS = [
  ...buildMockConventionalCommit('feat: add symbolic thing'),
  ...buildMockConventionalCommit('fix: patch symbolic thing'),
];

describe('Julia', () => {
  let github: GitHub;

  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'julia-test-repo',
      defaultBranch: 'main',
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with default initial version', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        component: 'ExampleJuliaPkg',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('Project.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));

      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        undefined
      );
      expect(release!.version?.toString()).to.eql('0.1.0');
    });

    it('detects the default component from Project.toml', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('Project.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));

      const latestRelease = {
        tag: new TagName(Version.parse('0.3.4'), 'ExampleJuliaPkg'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const pullRequest = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(pullRequest!.version?.toString()).to.eql('0.4.0');
      snapshot(dateSafe(pullRequest!.body.toString()));
    });

    it('detects the default component from JuliaProject.toml', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
      });
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('Project.toml', 'main')
        .rejects(new FileNotFoundError('Project.toml'));
      getFileContentsStub
        .withArgs('JuliaProject.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));

      const latestRelease = {
        tag: new TagName(Version.parse('0.3.4'), 'ExampleJuliaPkg'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const pullRequest = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      expect(pullRequest!.version?.toString()).to.eql('0.4.0');
      expect(pullRequest!.title.toString()).to.contain('ExampleJuliaPkg');
    });
  });

  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('Project.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));

      const latestRelease = {
        tag: new TagName(Version.parse('0.3.4'), 'ExampleJuliaPkg'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'Project.toml', ProjectToml);
    });

    it('updates JuliaProject.toml when Project.toml is missing', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
      });
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('Project.toml', 'main')
        .rejects(new FileNotFoundError('Project.toml'));
      getFileContentsStub
        .withArgs('JuliaProject.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));

      const latestRelease = {
        tag: new TagName(Version.parse('0.3.4'), 'ExampleJuliaPkg'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'JuliaProject.toml', ProjectToml);
      assertNoHasUpdate(updates, 'Project.toml');
    });

    it('supports JuliaProject.toml in subdirectories', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        path: 'packages/ExampleJuliaPkg',
      });
      const getFileContentsStub = sandbox.stub(
        github,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('packages/ExampleJuliaPkg/Project.toml', 'main')
        .rejects(
          new FileNotFoundError('packages/ExampleJuliaPkg/Project.toml')
        );
      getFileContentsStub
        .withArgs('packages/ExampleJuliaPkg/JuliaProject.toml', 'main')
        .resolves(buildGitHubFileContent(fixturesPath, 'Project.toml'));

      const latestRelease = {
        tag: new TagName(Version.parse('0.3.4'), 'ExampleJuliaPkg'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(
        updates,
        'packages/ExampleJuliaPkg/CHANGELOG.md',
        Changelog
      );
      assertHasUpdate(
        updates,
        'packages/ExampleJuliaPkg/JuliaProject.toml',
        ProjectToml
      );
      assertNoHasUpdate(updates, 'packages/ExampleJuliaPkg/Project.toml');
    });
  });
});
