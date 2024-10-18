import { describe, it, afterEach, beforeEach } from 'mocha';
import * as sinon from 'sinon';
import { GitHub } from '../../src/github';
import { CandidateReleasePullRequest } from '../../src/manifest';
import { Update } from '../../src/update';
import {
  buildGitHubFileContent,
  buildMockCandidatePullRequest,
  assertHasUpdate,
  dateSafe,
  stubFilesFromFixtures,
  assertNoHasUpdate,
  safeSnapshot,
} from '../helpers';
import { Version } from '../../src/version';
import { ManifestPlugin } from '../../src/plugin';
import { GoWorkspace } from '../../src/plugins/go-workspace';
import { expect } from 'chai';
import snapshot = require('snap-shot-it');
import { RawContent } from '../../src/updaters/raw-content';
import { parseGoWorkspace } from '../../src/updaters/go/common';
import { ConfigurationError } from '../../src/errors';
import assert = require('assert');
import { GoMod } from '../../src/updaters/go/go-mod';
import { log } from 'console';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/plugins/go-workspace';

export function buildMockPackageUpdate(
  path: string,
  fixtureName: string,
  version: string
): Update {
  const cachedFileContents = buildGitHubFileContent(fixturesPath, fixtureName);
  return {
    path,
    createIfMissing: false,
    cachedFileContents,
    updater: new GoMod({
      version: Version.parse(version),
    }),
  };
}

describe('GoWorkspace plugin', () => {
  let github: GitHub;
  let plugin: ManifestPlugin;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'go-test-repo',
      defaultBranch: 'main',
    });
    plugin = new GoWorkspace(github, 'main', {
      'libs/lib-a': {
        releaseType: 'go',
      },
      'libs/lib-b': {
        releaseType: 'go',
      },
      'apps/app-c': {
        releaseType: 'go',
      },
      'apps/app-d': {
        releaseType: 'go',
      },
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    // TODO implement or remove these two
    it('rejects if not a workspace', async () => { });
    it('rejects if no workspace members', async () => { });

    it('does nothing for non-go strategies', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0'),
      ];
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).to.eql(candidates);
    });
    it('handles a single go package', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0'),
        buildMockCandidatePullRequest('libs/lib-a', 'go', '1.1.2', {
          component: 'example.com/libs/lib-a',
          updates: [
            buildMockPackageUpdate(
              'libs/lib-a/go.mod',
              'libs/lib-a/go.mod',
              '1.1.1'
            )
          ],
        }),
      ];

      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'libs/lib-a/go.mod',
          'libs/lib-a/CHANGELOG.md',
        ],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [['go.workspace', 'libs/lib-a\n']],
      });
      plugin = new GoWorkspace(github, 'main', {
        python: {
          releaseType: 'python',
        },
        'libs/lib-a': {
          releaseType: 'go',
        },
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('libs/lib-a', 'main')
        .resolves(['libs/lib-a']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(2);
      const goCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'go'
      );
      expect(goCandidate).to.not.be.undefined;
      const updates = goCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'libs/lib-a/go.mod');
      snapshot(dateSafe(goCandidate!.pullRequest.body.toString()));
    });
    it('handles glob paths', async () => {
      // libs/*
      assert.fail('not implemented');
    });
    it('walks dependency tree and updates previously untouched packages', async () => {
      assert.fail('not implemented');
    });
    it('appends dependency notes to an updated module', async () => {
      assert.fail('not implemented');
    });
    it('skips component if not touched', async () => {
      assert.fail('not implemented');
    });
  });
});
