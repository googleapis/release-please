import {describe, it, afterEach, beforeEach} from 'mocha';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {CandidateReleasePullRequest} from '../../src/manifest';
import {Update} from '../../src/update';
import {
  buildGitHubFileContent,
  buildMockCandidatePullRequest,
  assertHasUpdate,
  dateSafe,
  stubFilesFromFixtures,
  assertNoHasUpdate,
} from '../helpers';
import {Version} from '../../src/version';
import {ManifestPlugin} from '../../src/plugin';
import {GoWorkspace} from '../../src/plugins/go-workspace';
import {expect} from 'chai';
import snapshot = require('snap-shot-it');
import {RawContent} from '../../src/updaters/raw-content';
import {GoMod} from '../../src/updaters/go/go-mod';

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
      'packages/goA': {
        releaseType: 'go',
      },
      'packages/goB': {
        releaseType: 'go',
      },
      'packages/goC': {
        releaseType: 'go',
      },
      'packages/goD': {
        releaseType: 'go',
      },
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    // TODO implement or remove these two
    it('rejects if not a workspace', async () => {});
    it('rejects if no workspace members', async () => {});

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
        buildMockCandidatePullRequest('packages/goA', 'go', '1.1.2', {
          component: 'example.com/packages/goA',
          updates: [
            buildMockPackageUpdate(
              'packages/goA/go.mod',
              'packages/goA/go.mod',
              '1.1.1'
            ),
          ],
        }),
      ];

      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: ['packages/goA/go.mod', 'packages/goA/CHANGELOG.md'],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [['go.workspace', 'packages/goA\n']],
      });
      plugin = new GoWorkspace(github, 'main', {
        python: {
          releaseType: 'python',
        },
        'packages/goA': {
          releaseType: 'go',
        },
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/goA', 'main')
        .resolves(['packages/goA']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(2);
      const goCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'go'
      );
      expect(goCandidate).to.not.be.undefined;
      const updates = goCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'packages/goA/go.mod');
      snapshot(dateSafe(goCandidate!.pullRequest.body.toString()));
    });
    it('handles glob paths', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/goA', 'go', '1.1.2', {
          component: 'example.com/packages/goA',
          updates: [
            buildMockPackageUpdate(
              'packages/goA/go.mod',
              'packages/goA/go.mod',
              '1.1.1'
            ),
          ],
        }),
        buildMockCandidatePullRequest('packages/goB', 'go', '4.4.5', {
          component: 'example.com/packages/goB',
          updates: [
            buildMockPackageUpdate(
              'packages/goB/go.mod',
              'packages/goB/go.mod',
              '2.2.2'
            ),
          ],
        }),
      ];

      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'packages/goA/go.mod',
          'packages/goA/CHANGELOG.md',
          'packages/goB/go.mod',
          'packages/goB/CHANGELOG.md',
        ],
        flatten: false,
        targetBranch: 'main',
        inlineFiles: [['go.workspace', 'packages/*\n']],
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/*', 'main')
        .resolves(['packages/goA', 'packages/goB']);
      plugin = new GoWorkspace(github, 'main', {
        'packages/goA': {
          releaseType: 'go',
        },
        'packages/goB': {
          releaseType: 'go',
        },
      });
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const goCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'go'
      );
      expect(goCandidate).to.not.be.undefined;
      const updates = goCandidate!.pullRequest.updates;
      assertHasUpdate(updates, 'packages/goA/go.mod');
      assertHasUpdate(updates, 'packages/goB/go.mod');
      snapshot(dateSafe(goCandidate!.pullRequest.body.toString()));
    });
    it('walks dependency tree and updates previously untouched packages', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/goA', 'go', '1.1.2', {
          component: 'example.com/packages/goA',
          updates: [
            buildMockPackageUpdate(
              'packages/goA/go.mod',
              'packages/goA/go.mod',
              '1.1.1'
            ),
          ],
        }),
        buildMockCandidatePullRequest('packages/goD', 'go', '4.4.5', {
          component: 'example.com/packages/goD',
          updates: [
            buildMockPackageUpdate(
              'packages/goD/go.mod',
              'packages/goD/go.mod',
              '4.4.4'
            ),
          ],
        }),
      ];

      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'go.workspace',
          'packages/goA/go.mod',
          'packages/goA/CHANGELOG.md',
          'packages/goB/go.mod',
          'packages/goB/CHANGELOG.md',
          'packages/goC/go.mod',
          'packages/goC/CHANGELOG.md',
          'packages/goD/go.mod',
          'packages/goD/CHANGELOG.md',
          'packages/goE/go.mod',
          'packages/goE/CHANGELOG.md',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/goA', 'main')
        .resolves(['packages/goA'])
        .withArgs('packages/goB', 'main')
        .resolves(['packages/goB'])
        .withArgs('packages/goC', 'main')
        .resolves(['packages/goC'])
        .withArgs('packages/goD', 'main')
        .resolves(['packages/goD'])
        .withArgs('packages/goE', 'main')
        .resolves(['packages/goE']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const goCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'go'
      );
      expect(goCandidate).to.not.be.undefined;
      const updates = goCandidate!.pullRequest.updates;
      // Check that transitive dependencies are updated
      assertHasUpdate(updates, 'packages/goA/go.mod', RawContent);
      assertHasUpdate(updates, 'packages/goB/go.mod', RawContent);
      assertHasUpdate(updates, 'packages/goC/go.mod', RawContent);
      assertHasUpdate(updates, 'packages/goD/go.mod', RawContent);
      assertHasUpdate(updates, 'packages/goE/go.mod', RawContent);
      snapshot(dateSafe(goCandidate!.pullRequest.body.toString()));
    });
    it('appends dependency notes to an updated module', async () => {
      const existingNotes =
        '### Dependencies\n\n* update dependency foo/bar to 1.2.3';
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/goA', 'go', '1.1.2', {
          component: 'example.com/packages/goA',
          updates: [
            buildMockPackageUpdate(
              'packages/goA/go.mod',
              'packages/goA/go.mod',
              '1.1.1'
            ),
          ],
        }),
        buildMockCandidatePullRequest('packages/goB', 'go', '2.2.3', {
          component: 'example.com/packages/goB',
          updates: [
            buildMockPackageUpdate(
              'packages/goB/go.mod',
              'packages/goB/go.mod',
              '2.2.2'
            ),
          ],
          notes: existingNotes,
        }),
      ];

      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'go.workspace',
          'packages/goA/go.mod',
          'packages/goA/CHANGELOG.md',
          'packages/goB/go.mod',
          'packages/goB/CHANGELOG.md',
          'packages/goC/go.mod',
          'packages/goC/CHANGELOG.md',
          'packages/goD/go.mod',
          'packages/goD/CHANGELOG.md',
          'packages/goE/go.mod',
          'packages/goE/CHANGELOG.md',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/goA', 'main')
        .resolves(['packages/goA'])
        .withArgs('packages/goB', 'main')
        .resolves(['packages/goB'])
        .withArgs('packages/goC', 'main')
        .resolves(['packages/goC'])
        .withArgs('packages/goD', 'main')
        .resolves(['packages/goD'])
        .withArgs('packages/goE', 'main')
        .resolves(['packages/goE']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const goCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'go'
      );
      expect(goCandidate).to.not.be.undefined;
      const updates = goCandidate!.pullRequest.updates;
      // Also checks transitive dependencies are updated
      assertHasUpdate(updates, 'packages/goA/go.mod', RawContent);
      assertHasUpdate(updates, 'packages/goB/go.mod', RawContent);
      assertHasUpdate(updates, 'packages/goC/go.mod', RawContent);
      assertHasUpdate(updates, 'packages/goE/go.mod', RawContent);
      snapshot(dateSafe(goCandidate!.pullRequest.body.toString()));
    });
    it('skips component if not touched', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/goB', 'go', '2.3.0', {
          component: 'example.com/packages/goB',
          updates: [
            buildMockPackageUpdate(
              'packages/goB/go.mod',
              'packages/goB/go.mod',
              '2.2.2'
            ),
          ],
        }),
      ];

      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'go.workspace',
          'packages/goA/go.mod',
          'packages/goA/CHANGELOG.md',
          'packages/goB/go.mod',
          'packages/goB/CHANGELOG.md',
          'packages/goC/go.mod',
          'packages/goC/CHANGELOG.md',
          'packages/goD/go.mod',
          'packages/goD/CHANGELOG.md',
          'packages/goE/go.mod',
          'packages/goE/CHANGELOG.md',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .withArgs('packages/goA', 'main')
        .resolves(['packages/goA'])
        .withArgs('packages/goB', 'main')
        .resolves(['packages/goB'])
        .withArgs('packages/goC', 'main')
        .resolves(['packages/goC'])
        .withArgs('packages/goD', 'main')
        .resolves(['packages/goD'])
        .withArgs('packages/goE', 'main')
        .resolves(['packages/goE']);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const goCandidate = newCandidates.find(
        candidate => candidate.config.releaseType === 'go'
      );
      expect(goCandidate).to.not.be.undefined;
      const updates = goCandidate!.pullRequest.updates;
      // goA is not touched and does not have a dependency on goD
      assertNoHasUpdate(updates, 'packages/goA/go.mod');
      assertNoHasUpdate(updates, 'packages/goE/go.mod');
      assertHasUpdate(updates, 'packages/goB/go.mod', RawContent);
      snapshot(dateSafe(goCandidate!.pullRequest.body.toString()));
    });
  });
});
