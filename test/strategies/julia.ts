import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import * as sinon from 'sinon';
import snapshot = require('snap-shot-it');

import {GitHub} from '../../src/github';
import {Julia} from '../../src/strategies/julia';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {ProjectToml} from '../../src/updaters/julia/project-toml';
import {
  assertHasUpdate,
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

    it('supports packages in subdirectories', async () => {
      const strategy = new Julia({
        targetBranch: 'main',
        github,
        path: 'packages/ExampleJuliaPkg',
      });
      sandbox
        .stub(github, 'getFileContentsOnBranch')
        .withArgs('packages/ExampleJuliaPkg/Project.toml', 'main')
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
        'packages/ExampleJuliaPkg/Project.toml',
        ProjectToml
      );
    });
  });
});
