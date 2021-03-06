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

import {describe, it, afterEach} from 'mocha';

import {Manifest, ManifestConfig} from '../src/manifest';
import * as sinon from 'sinon';
import {GitHub, MergedGitHubPRWithFiles} from '../src/github';
import {buildGitHubFileRaw, buildGitHubFileContent} from './releasers/utils';
import {expect} from 'chai';
import {Commit} from '../src/graphql-to-commits';
import {CheckpointType} from '../src/util/checkpoint';
import {stubSuggesterWithSnapshot, buildMockCommit} from './helpers';

const fixturePath = './test/fixtures/manifest/repo';
const defaultBranch = 'main';
const lastReleaseSha = 'abc123';
const sandbox = sinon.createSandbox();

describe('Manifest', () => {
  afterEach(() => {
    sandbox.restore();
  });

  function mockGithub(options: {
    github: GitHub;
    commits?: Commit[];
    manifest?: string | false;
    lastReleaseSha?: string;
    // used by githubRelease to figure out which packages had actual changes
    mergedPRFiles?: string[];
    fixtureFiles?: string[];
    inlineFiles?: [string, string][];
    addLabel?: string | false;
    removeLabel?: string | false;
    prComments?: string[];
  }) {
    const {
      github,
      commits,
      manifest,
      lastReleaseSha,
      mergedPRFiles,
      fixtureFiles,
      inlineFiles,
      addLabel,
      removeLabel,
      prComments,
    } = options;
    const mock = sandbox.mock(github);
    if (manifest) {
      mock
        .expects('getFileContentsWithSimpleAPI')
        .once()
        .withExactArgs('.release-please-manifest.json', lastReleaseSha, false)
        .resolves(buildGitHubFileRaw(manifest));
    } else if (manifest === false) {
      mock
        .expects('getFileContentsWithSimpleAPI')
        .once()
        .withExactArgs('.release-please-manifest.json', lastReleaseSha, false)
        .rejects(Object.assign(Error('not found'), {status: 404}));
    } else {
      mock.expects('getFileContentsWithSimpleAPI').never();
    }
    let mergedPR: MergedGitHubPRWithFiles | undefined;
    if (lastReleaseSha) {
      mergedPR = {
        sha: lastReleaseSha,
        title: '',
        body: '',
        number: 22,
        baseRefName: '',
        headRefName: '',
        files: mergedPRFiles ?? [],
        labels: [],
      };
    }
    mock
      .expects('lastMergedPRByHeadBranch')
      .atMost(1)
      .withExactArgs('release-please/branches/main')
      .resolves(mergedPR);

    // implementation strips leading `path` from results
    mock
      .expects('findFilesByFilename')
      .atMost(1)
      .withExactArgs('version.py', 'python')
      .resolves(['src/foolib/version.py']);

    // creating a new PR
    mock.expects('findOpenReleasePRs').atMost(1).resolves([]);
    if (commits) {
      mock
        .expects('commitsSinceSha')
        .once()
        .withExactArgs(lastReleaseSha)
        .resolves(commits);
    } else {
      mock.expects('commitsSinceSha').never();
    }
    if (fixtureFiles || inlineFiles) {
      const fixtures = fixtureFiles ?? [];
      const inlines = inlineFiles ?? [];
      for (const fixture of fixtures) {
        mock
          .expects('getFileContentsOnBranch')
          .withExactArgs(fixture, 'main')
          .once()
          .resolves(buildGitHubFileContent(fixturePath, fixture));
      }
      for (const [file, contents] of inlines) {
        mock
          .expects('getFileContentsOnBranch')
          .withExactArgs(file, 'main')
          .once()
          .resolves(buildGitHubFileRaw(contents));
      }
      const expectedNotFound = [
        'node/pkg1/package-lock.json',
        'node/pkg1/samples/package.json',
        'node/pkg1/CHANGELOG.md',
        'node/pkg1/HISTORY.md',
        'node/pkg2/package-lock.json',
        'node/pkg2/samples/package.json',
        'node/pkg2/CHANGELOG.md',
        'python/CHANGELOG.md',
        'python/HISTORY.md',
      ];
      for (const notFound of expectedNotFound) {
        mock
          .expects('getFileContentsOnBranch')
          .withExactArgs(notFound, 'main')
          .atMost(1)
          .rejects(Object.assign(Error('not found'), {status: 404}));
      }
    } else {
      mock.expects('getFileContentsOnBranch').never();
    }

    const addLabelsExp = mock.expects('addLabels');
    const labelToAdd = addLabel ?? 'autorelease: pending';
    if (labelToAdd) {
      addLabelsExp.once().withExactArgs([labelToAdd], 22).resolves(true);
    } else {
      addLabelsExp.never();
    }

    const removeLabelsExp = mock.expects('removeLabels');
    if (removeLabel) {
      removeLabelsExp.once().withExactArgs([removeLabel], 22).resolves(true);
    } else {
      removeLabelsExp.never();
    }

    if (prComments) {
      for (const comment of prComments) {
        mock
          .expects('commentOnIssue')
          .withExactArgs(comment, 22)
          .once()
          .resolves();
      }
    }
    return mock;
  }

  describe('pullRequest', () => {
    it('creates a PR for python and node packages', async function () {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        python: '1.2.3',
      });
      const manifestFileAtHEAD = JSON.stringify({
        'node/pkg1': '3.2.1',
        // test that we overwrite any existing path versions that someone tried
        // to change.
        python: '9.9.9',
      });
      const manifestConfig: ManifestConfig = {
        packages: {
          'node/pkg1': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      };
      const config = JSON.stringify(manifestConfig);
      const commits = [
        buildMockCommit('fix(foolib): bufix python foolib', [
          'python/src/foolib/foo.py',
        ]),
        buildMockCommit('feat(@node/pkg1)!: major new feature', [
          'node/pkg1/src/foo.ts',
        ]),
      ];

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        commits,
        manifest,
        lastReleaseSha,
        fixtureFiles: [
          'node/pkg1/package.json',
          'python/setup.py',
          'python/setup.cfg',
          'python/src/foolib/version.py',
        ],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifestFileAtHEAD],
        ],
      });
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);

      const pr = await new Manifest({github, checkpoint}).pullRequest();

      mock.verify();
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Found version 1.2.3 for python in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Python(foolib)', CheckpointType.Success],
      ]);
    });

    it('respects python releaser specific config over defaults', async function () {
      // https://github.com/googleapis/release-please/pull/790#issuecomment-783792069
      if (process.versions.node.split('.')[0] === '10') {
        this.skip();
      }
      const manifest = JSON.stringify({
        'node/pkg1': '0.1.1',
        python: '0.1.1',
      });
      const manifestConfig: ManifestConfig = {
        'bump-minor-pre-major': true,
        'changelog-sections': [
          {type: 'feat', section: 'Default Features Section'},
          {type: 'fix', section: 'Default Bug Fixes Section'},
        ],
        packages: {
          'node/pkg1': {
            'changelog-path': 'HISTORY.md',
          },
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
            'bump-minor-pre-major': false,
            'changelog-sections': [
              {type: 'feat', section: 'Python Features Section'},
              {type: 'fix', section: 'Python Bug Fixes Section'},
            ],
          },
        },
      };
      const config = JSON.stringify(manifestConfig);
      const commits = [
        buildMockCommit('feat(foolib)!: python feature', [
          'python/src/foolib/foo.py',
        ]),
        buildMockCommit('fix(foolib): python bufix', [
          'python/src/foolib/bar.py',
        ]),
        buildMockCommit('feat(@node/pkg1)!: node feature', [
          'node/pkg1/src/foo.ts',
        ]),
        buildMockCommit('bugfix(@node/pkg1): node bugfix', [
          'node/pkg1/src/bar.ts',
        ]),
      ];

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        commits,
        manifest,
        lastReleaseSha,
        fixtureFiles: [
          'node/pkg1/package.json',
          'python/setup.py',
          'python/setup.cfg',
          'python/src/foolib/version.py',
        ],
        inlineFiles: [
          ['release-please-config.json', config],
          // manifest has not been changed.
          ['.release-please-manifest.json', manifest],
        ],
      });
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const pr = await new Manifest({github, checkpoint}).pullRequest();
      mock.verify();
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        [
          'Found version 0.1.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Found version 0.1.1 for python in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Python(foolib)', CheckpointType.Success],
      ]);
    });

    it('bootstraps a new package from curated manifest', async function () {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        python: '1.2.3',
      });
      const manifestFileAtHEAD = JSON.stringify({
        'node/pkg1': '3.2.1',
        // New package's "previous" version manually added since last release.
        // Candidate release will increment this version.
        'node/pkg2': '0.1.2',
        python: '1.2.3',
      });
      const manifestConfig: ManifestConfig = {
        'release-type': 'node',
        'bump-minor-pre-major': true,
        packages: {
          'node/pkg1': {},
          'node/pkg2': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      };
      const config = JSON.stringify(manifestConfig);
      const commits = [
        buildMockCommit('fix(foolib): bufix python foolib', [
          'python/src/foolib/foo.py',
        ]),
        buildMockCommit('feat(@node/pkg1)!: major new feature', [
          'node/pkg1/src/foo.ts',
        ]),
        buildMockCommit('feat(@node/pkg2): new feature', [
          'node/pkg2/src/bar.ts',
        ]),
      ];

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        commits,
        manifest,
        lastReleaseSha,
        fixtureFiles: [
          'node/pkg1/package.json',
          'node/pkg2/package.json',
          'python/setup.py',
          'python/setup.cfg',
          'python/src/foolib/version.py',
        ],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifestFileAtHEAD],
        ],
      });
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const pr = await new Manifest({github, checkpoint}).pullRequest();
      mock.verify();
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Failed to find version for node/pkg2 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Failure,
        ],
        [
          'Found version 1.2.3 for python in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Bootstrapping from .release-please-manifest.json at tip of main ' +
            'for missing paths [node/pkg2]',
          CheckpointType.Failure,
        ],
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Node(@node/pkg2)', CheckpointType.Success],
        ['Processing package: Python(foolib)', CheckpointType.Success],
      ]);
    });

    it('bootstraps a new package using default version', async function () {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        python: '1.2.3',
      });
      const manifestConfig: ManifestConfig = {
        packages: {
          'node/pkg1': {},
          'node/pkg2': {}, // should default to Node.defaultInitialVersion
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      };
      const config = JSON.stringify(manifestConfig);
      const commits = [
        buildMockCommit('fix(foolib): bufix python foolib', [
          'python/src/foolib/foo.py',
        ]),
        buildMockCommit('feat(@node/pkg1)!: major new feature', [
          'node/pkg1/src/foo.ts',
        ]),
        buildMockCommit('feat(@node/pkg2): new feature', [
          'node/pkg2/src/bar.ts',
        ]),
      ];

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        commits,
        manifest,
        lastReleaseSha,
        fixtureFiles: [
          'node/pkg1/package.json',
          'node/pkg2/package.json',
          'python/setup.py',
          'python/setup.cfg',
          'python/src/foolib/version.py',
        ],
        inlineFiles: [
          ['release-please-config.json', config],
          // manifest has not been changed.
          ['.release-please-manifest.json', manifest],
        ],
      });
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const pr = await new Manifest({github, checkpoint}).pullRequest();
      mock.verify();
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Failed to find version for node/pkg2 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Failure,
        ],
        [
          'Found version 1.2.3 for python in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Bootstrapping from .release-please-manifest.json at tip of main ' +
            'for missing paths [node/pkg2]',
          CheckpointType.Failure,
        ],
        [
          'Failed to find version for node/pkg2 in ' +
            '.release-please-manifest.json at tip of main',
          CheckpointType.Failure,
        ],
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Node(@node/pkg2)', CheckpointType.Success],
        [
          'Falling back to default version for Node(@node/pkg2): 1.0.0',
          CheckpointType.Failure,
        ],
        ['Processing package: Python(foolib)', CheckpointType.Success],
      ]);
    });

    it('only includes packages that have version bumps', async function () {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        'node/pkg2': '0.1.2',
        python: '1.2.3',
      });
      const config = JSON.stringify({
        'release-type': 'node',
        'bump-minor-pre-major': true,
        packages: {
          'node/pkg1': {},
          'node/pkg2': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      });
      const commits = [
        buildMockCommit('feat(@node/pkg2): new feature', [
          'node/pkg2/src/bar.ts',
        ]),
      ];

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        commits,
        manifest,
        lastReleaseSha,
        fixtureFiles: ['node/pkg2/package.json'],
        inlineFiles: [
          ['release-please-config.json', config],
          // manifest has not been changed.
          ['.release-please-manifest.json', manifest],
        ],
      });
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const pr = await new Manifest({github, checkpoint}).pullRequest();
      mock.verify();
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        [
          'Found version 0.1.2 for node/pkg2 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        ['Processing package: Node(@node/pkg2)', CheckpointType.Success],
      ]);
    });

    it('does not create a PR if no changes', async function () {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        'node/pkg2': '0.1.2',
        python: '1.2.3',
      });
      const config = JSON.stringify({
        'release-type': 'node',
        'bump-minor-pre-major': true,
        packages: {
          'node/pkg1': {},
          'node/pkg2': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      });
      // nothing user facing
      const commits = [
        buildMockCommit('chore(foolib): python foolib docs', [
          'python/src/foolib/README.md',
        ]),
        buildMockCommit('refactor(@node/pkg1): internal refactor', [
          'node/pkg1/src/foo.ts',
        ]),
        buildMockCommit('ci(@node/pkg2): build tweaks', [
          'node/pkg2/src/bar.ts',
        ]),
      ];

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        commits,
        manifest,
        lastReleaseSha,
        fixtureFiles: ['node/pkg1/package.json', 'node/pkg2/package.json'],
        inlineFiles: [
          ['release-please-config.json', config],
          // manifest has not been changed.
          ['.release-please-manifest.json', manifest],
        ],
        addLabel: false,
      });
      // there should be no snapshot created for this test
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const pr = await new Manifest({github, checkpoint}).pullRequest();
      mock.verify();
      expect(pr).to.be.undefined;
      expect(logs).to.eql([
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Found version 0.1.2 for node/pkg2 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Found version 1.2.3 for python in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Node(@node/pkg2)', CheckpointType.Success],
        ['Processing package: Python(foolib)', CheckpointType.Success],
        ['No user facing changes to release', CheckpointType.Success],
      ]);
    });

    it('boostraps from HEAD manifest if first PR', async function () {
      // no previously merged PR found, will use this as bootstrap
      const manifestFileAtHEAD = JSON.stringify({
        'node/pkg1': '3.2.1',
        'node/pkg2': '0.1.2',
        python: '1.2.3',
      });
      const manifestConfig: ManifestConfig = {
        'release-type': 'node',
        'bump-minor-pre-major': true,
        packages: {
          'node/pkg1': {},
          'node/pkg2': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      };
      const config = JSON.stringify(manifestConfig);
      const commits = [
        buildMockCommit('fix(foolib): bufix python foolib', [
          'python/src/foolib/foo.py',
        ]),
        buildMockCommit('feat(@node/pkg1)!: major new feature', [
          'node/pkg1/src/foo.ts',
        ]),
        buildMockCommit('feat(@node/pkg2): new feature', [
          'node/pkg2/src/bar.ts',
        ]),
      ];

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      // no lastReleaseSha/manifest
      const mock = mockGithub({
        github,
        commits,
        fixtureFiles: [
          'node/pkg1/package.json',
          'node/pkg2/package.json',
          'python/setup.py',
          'python/setup.cfg',
          'python/src/foolib/version.py',
        ],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifestFileAtHEAD],
        ],
      });
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const pr = await new Manifest({github, checkpoint}).pullRequest();
      mock.verify();
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        [
          'Bootstrapping from .release-please-manifest.json at tip of main',
          CheckpointType.Failure,
        ],
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at tip of main',
          CheckpointType.Success,
        ],
        [
          'Found version 0.1.2 for node/pkg2 in ' +
            '.release-please-manifest.json at tip of main',
          CheckpointType.Success,
        ],
        [
          'Found version 1.2.3 for python in ' +
            '.release-please-manifest.json at tip of main',
          CheckpointType.Success,
        ],
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Node(@node/pkg2)', CheckpointType.Success],
        ['Processing package: Python(foolib)', CheckpointType.Success],
      ]);
    });

    it('boostraps from HEAD manifest if manifest was deleted in last release PR', async function () {
      // no previously merged PR found, will use this as bootstrap
      const manifestFileAtHEAD = JSON.stringify({
        'node/pkg1': '3.2.1',
        'node/pkg2': '0.1.2',
        python: '1.2.3',
      });
      const manifestConfig: ManifestConfig = {
        'release-type': 'node',
        'bump-minor-pre-major': true,
        packages: {
          'node/pkg1': {},
          'node/pkg2': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      };
      const config = JSON.stringify(manifestConfig);
      const commits = [
        buildMockCommit('fix(foolib): bufix python foolib', [
          'python/src/foolib/foo.py',
        ]),
        buildMockCommit('feat(@node/pkg1)!: major new feature', [
          'node/pkg1/src/foo.ts',
        ]),
        buildMockCommit('feat(@node/pkg2): new feature', [
          'node/pkg2/src/bar.ts',
        ]),
      ];

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        commits,
        manifest: false,
        lastReleaseSha,
        fixtureFiles: [
          'node/pkg1/package.json',
          'node/pkg2/package.json',
          'python/setup.py',
          'python/setup.cfg',
          'python/src/foolib/version.py',
        ],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifestFileAtHEAD],
        ],
      });
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const pr = await new Manifest({github, checkpoint}).pullRequest();
      mock.verify();
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        [
          'Failed to get .release-please-manifest.json at abc123: 404',
          CheckpointType.Failure,
        ],
        [
          'Bootstrapping from .release-please-manifest.json at tip of main',
          CheckpointType.Failure,
        ],
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at tip of main',
          CheckpointType.Success,
        ],
        [
          'Found version 0.1.2 for node/pkg2 in ' +
            '.release-please-manifest.json at tip of main',
          CheckpointType.Success,
        ],
        [
          'Found version 1.2.3 for python in ' +
            '.release-please-manifest.json at tip of main',
          CheckpointType.Success,
        ],
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Node(@node/pkg2)', CheckpointType.Success],
        ['Processing package: Python(foolib)', CheckpointType.Success],
      ]);
    });
  });

  describe('githubRelease', () => {
    it('releases python and node packages', async () => {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        'node/pkg2': '0.1.2',
        python: '1.2.3',
      });
      const manifestConfig: ManifestConfig = {
        packages: {
          'node/pkg1': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
            'release-draft': true,
          },
        },
      };
      const config = JSON.stringify(manifestConfig);

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        manifest,
        lastReleaseSha,
        fixtureFiles: ['node/pkg1/package.json'],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifest],
          ['node/pkg1/CHANGELOG.md', '#Changelog\n\n## v3.2.1\n\n* entry'],
          ['python/CHANGELOG.md', '#Changelog\n\n## v1.2.3\n\n* entry'],
        ],
        mergedPRFiles: [
          // lack of any "node/pkg2/ files indicates that package did not
          // change in the last merged PR.
          'node/pkg1/package.json',
          'node/pkg1/CHANGELOG.md',
          'python/setup.py',
          'python/CHANGELOG.md',
          'python/setup.cfg',
          'python/src/foolib/version.py',
          '.release-please-manifest.json',
        ],
        addLabel: 'autorelease: tagged',
        removeLabel: 'autorelease: pending',
        prComments: [
          ':robot: Release for @node/pkg1 is at https://pkg1@3.2.1:html :sunflower:',
          ':robot: Release for foolib is at https://foolib@1.2.3:html :sunflower:',
        ],
      });
      mock
        .expects('createRelease')
        .withArgs(
          '@node/pkg1',
          'pkg1-v3.2.1',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .resolves({
          name: '@node/pkg1 pkg1-v3.2.1',
          tag_name: 'pkg1-v3.2.1',
          draft: false,
          body: '',
          html_url: 'https://pkg1@3.2.1:html',
          upload_url: 'https://pkg1@3.2.1:upload',
        });
      mock
        .expects('createRelease')
        .withArgs(
          'foolib',
          'foolib-v1.2.3',
          lastReleaseSha,
          sinon.match.string,
          true
        )
        .once()
        .resolves({
          name: 'foolib foolib-v1.2.3',
          tag_name: 'foolib-v1.2.3',
          draft: true,
          body: '',
          html_url: 'https://foolib@1.2.3:html',
          upload_url: 'https://foolib@1.2.3:upload',
        });

      const releases = await new Manifest({github}).githubRelease();
      mock.verify();
      expect(releases).to.eql({
        'node/pkg1': {
          version: '3.2.1',
          major: 3,
          minor: 2,
          patch: 1,
          pr: 22,
          draft: false,
          body: '',
          sha: 'abc123',
          html_url: 'https://pkg1@3.2.1:html',
          tag_name: 'pkg1-v3.2.1',
          name: '@node/pkg1 pkg1-v3.2.1',
          upload_url: 'https://pkg1@3.2.1:upload',
        },
        python: {
          version: '1.2.3',
          major: 1,
          minor: 2,
          patch: 3,
          pr: 22,
          draft: true,
          body: '',
          sha: 'abc123',
          html_url: 'https://foolib@1.2.3:html',
          tag_name: 'foolib-v1.2.3',
          name: 'foolib foolib-v1.2.3',
          upload_url: 'https://foolib@1.2.3:upload',
        },
      });
    });

    it('logs when no mergedPR found', async () => {
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        addLabel: false,
        removeLabel: false,
        inlineFiles: [
          // minimal manifest/config to pass validation
          ['.release-please-manifest.json', '{}'],
          ['release-please-config.json', '{"packages": {"path":{}}}'],
        ],
      });
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const releases = await new Manifest({github, checkpoint}).githubRelease();
      mock.verify();
      expect(releases).to.be.undefined;
      expect(logs).to.eql([
        [
          'Unable to find last merged Manifest PR for tagging',
          CheckpointType.Failure,
        ],
      ]);
    });

    it('logs a user deleting a manifest entry before merging last PR', async () => {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        // python: '1.2.3', - user deleted this one
      });
      const manifestConfig: ManifestConfig = {
        packages: {
          'node/pkg1': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      };
      const config = JSON.stringify(manifestConfig);

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        manifest,
        lastReleaseSha,
        fixtureFiles: ['node/pkg1/package.json'],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifest],
          ['node/pkg1/CHANGELOG.md', '#Changelog\n\n## v3.2.1\n\n* entry'],
        ],
        mergedPRFiles: [
          'node/pkg1/package.json',
          'node/pkg1/CHANGELOG.md',
          'python/setup.py',
          'python/CHANGELOG.md',
          'python/setup.cfg',
          'python/src/foolib/version.py',
          '.release-please-manifest.json',
        ],
        addLabel: 'autorelease: tagged',
        removeLabel: 'autorelease: pending',
        prComments: [
          ':robot: Release for @node/pkg1 is at https://pkg1@3.2.1:html :sunflower:',
        ],
      });
      mock
        .expects('createRelease')
        .withArgs(
          '@node/pkg1',
          'pkg1-v3.2.1',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .resolves({
          name: '@node/pkg1 pkg1-v3.2.1',
          tag_name: 'pkg1-v3.2.1',
          draft: false,
          body: '',
          html_url: 'https://pkg1@3.2.1:html',
          upload_url: 'https://pkg1@3.2.1:upload',
        });
      mock
        .expects('createRelease')
        .withArgs(
          'foolib',
          'foolib-v1.2.3',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .never();
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);

      const releases = await new Manifest({github, checkpoint}).githubRelease();
      mock.verify();
      expect(releases).to.eql({
        'node/pkg1': {
          version: '3.2.1',
          major: 3,
          minor: 2,
          patch: 1,
          pr: 22,
          draft: false,
          body: '',
          sha: 'abc123',
          html_url: 'https://pkg1@3.2.1:html',
          tag_name: 'pkg1-v3.2.1',
          name: '@node/pkg1 pkg1-v3.2.1',
          upload_url: 'https://pkg1@3.2.1:upload',
        },
        python: undefined,
      });
      // python entry was manually deleted from manifest (user error)
      // log the problem, continue releasing other pkgs from manifest
      expect(logs).to.eql([
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Failed to find version for python in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Failure,
        ],
        [
          'Bootstrapping from .release-please-manifest.json at tip of main ' +
            'for missing paths [python]',
          CheckpointType.Failure,
        ],
        [
          'Failed to find version for python in ' +
            '.release-please-manifest.json at tip of main',
          CheckpointType.Failure,
        ],
        ['Creating release for Node(@node/pkg1)@3.2.1', CheckpointType.Success],
        [
          'Unable to find last version for Python(foolib).',
          CheckpointType.Failure,
        ],
      ]);
    });

    it('logs transient pkg release creation errors', async () => {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        'node/pkg2': '0.1.2',
        python: '1.2.3',
      });
      const manifestConfig: ManifestConfig = {
        packages: {
          'node/pkg1': {},
          'node/pkg2': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      };
      const config = JSON.stringify(manifestConfig);

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        manifest,
        lastReleaseSha,
        fixtureFiles: ['node/pkg1/package.json', 'node/pkg2/package.json'],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifest],
          ['node/pkg1/CHANGELOG.md', '#Changelog\n\n## v3.2.1\n\n* entry'],
          ['node/pkg2/CHANGELOG.md', '#Changelog\n\n## v0.1.2\n\n* entry'],
          ['python/CHANGELOG.md', '#Changelog\n\n## v1.2.3\n\n* entry'],
        ],
        mergedPRFiles: [
          'node/pkg1/package.json',
          'node/pkg1/CHANGELOG.md',
          'node/pkg2/package.json',
          'node/pkg2/CHANGELOG.md',
          'python/setup.py',
          'python/CHANGELOG.md',
          'python/setup.cfg',
          'python/src/foolib/version.py',
          '.release-please-manifest.json',
        ],

        // labels only swapped when every package is successfully released
        // or its release has been found to already exist
        addLabel: false,
        removeLabel: false,

        prComments: [
          ':robot: Release for @node/pkg1 is at https://pkg1@3.2.1:html :sunflower:',
          ':robot: Failed to create release for @node/pkg2 :cloud:',
          ':robot: Release for foolib is at https://foolib@1.2.3:html :sunflower:',
        ],
      });
      mock
        .expects('createRelease')
        .withArgs(
          '@node/pkg1',
          'pkg1-v3.2.1',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .resolves({
          name: '@node/pkg1 pkg1-v3.2.1',
          tag_name: 'pkg1-v3.2.1',
          draft: false,
          body: '',
          html_url: 'https://pkg1@3.2.1:html',
          upload_url: 'https://pkg1@3.2.1:upload',
        });
      mock
        .expects('createRelease')
        .withArgs(
          '@node/pkg2',
          'pkg2-v0.1.2',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .rejects(new Error('Boom!'));
      mock
        .expects('createRelease')
        .withArgs(
          'foolib',
          'foolib-v1.2.3',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .resolves({
          name: 'foolib foolib-v1.2.3',
          tag_name: 'foolib-v1.2.3',
          draft: false,
          body: '',
          html_url: 'https://foolib@1.2.3:html',
          upload_url: 'https://foolib@1.2.3:upload',
        });
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);

      const releases = await new Manifest({github, checkpoint}).githubRelease();
      mock.verify();
      expect(releases).to.eql({
        'node/pkg1': {
          version: '3.2.1',
          major: 3,
          minor: 2,
          patch: 1,
          pr: 22,
          draft: false,
          body: '',
          sha: 'abc123',
          html_url: 'https://pkg1@3.2.1:html',
          tag_name: 'pkg1-v3.2.1',
          name: '@node/pkg1 pkg1-v3.2.1',
          upload_url: 'https://pkg1@3.2.1:upload',
        },
        'node/pkg2': undefined,
        python: {
          version: '1.2.3',
          major: 1,
          minor: 2,
          patch: 3,
          pr: 22,
          draft: false,
          body: '',
          sha: 'abc123',
          html_url: 'https://foolib@1.2.3:html',
          tag_name: 'foolib-v1.2.3',
          name: 'foolib foolib-v1.2.3',
          upload_url: 'https://foolib@1.2.3:upload',
        },
      });
      expect(logs).to.eql([
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Found version 0.1.2 for node/pkg2 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Found version 1.2.3 for python in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        ['Creating release for Node(@node/pkg1)@3.2.1', CheckpointType.Success],
        ['Creating release for Node(@node/pkg2)@0.1.2', CheckpointType.Success],
        [
          // node/pkg2 failed when we tried to create it.
          'Failed to create release for Node(@node/pkg2)@0.1.2: Boom!',
          CheckpointType.Failure,
        ],
        ['Creating release for Python(foolib)@1.2.3', CheckpointType.Success],
      ]);
    });

    it('gracefully handles re-running after node/pkg2 failure', async () => {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
        'node/pkg2': '0.1.2',
        python: '1.2.3',
      });
      const manifestConfig: ManifestConfig = {
        packages: {
          'node/pkg1': {},
          'node/pkg2': {},
          python: {
            'release-type': 'python',
            'package-name': 'foolib',
          },
        },
      };
      const config = JSON.stringify(manifestConfig);

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        manifest,
        lastReleaseSha,
        fixtureFiles: ['node/pkg1/package.json', 'node/pkg2/package.json'],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifest],
          ['node/pkg1/CHANGELOG.md', '#Changelog\n\n## v3.2.1\n\n* entry'],
          ['node/pkg2/CHANGELOG.md', '#Changelog\n\n## v0.1.2\n\n* entry'],
          ['python/CHANGELOG.md', '#Changelog\n\n## v1.2.3\n\n* entry'],
        ],
        mergedPRFiles: [
          'node/pkg1/package.json',
          'node/pkg1/CHANGELOG.md',
          'node/pkg2/package.json',
          'node/pkg2/CHANGELOG.md',
          'python/setup.py',
          'python/CHANGELOG.md',
          'python/setup.cfg',
          'python/src/foolib/version.py',
          '.release-please-manifest.json',
        ],
        addLabel: 'autorelease: tagged',
        removeLabel: 'autorelease: pending',
        prComments: [
          ':robot: Release for @node/pkg2 is at https://pkg2@0.1.2:html :sunflower:',
        ],
      });

      class AlreadyExistsError extends Error {
        status = 422;
        errors = [{code: 'already_exists', field: 'tag_name'}];
      }

      // @node/pkg1 and foolib releases were created successfully in last run but
      // @node/pkg2 had errored out. Rerunning we get 422/already_exists errors
      // for the first two.
      mock
        .expects('createRelease')
        .withArgs(
          '@node/pkg1',
          'pkg1-v3.2.1',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .rejects(new AlreadyExistsError('Invalid Input'));
      mock
        .expects('createRelease')
        .withArgs(
          '@node/pkg2',
          'pkg2-v0.1.2',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .resolves({
          name: '@node/pkg2 pkg2-v0.1.2',
          tag_name: 'pkg2-v0.1.2',
          draft: false,
          body: '',
          html_url: 'https://pkg2@0.1.2:html',
          upload_url: 'https://pkg2@0.1.2:upload',
        });
      mock
        .expects('createRelease')
        .withArgs(
          'foolib',
          'foolib-v1.2.3',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .rejects(new AlreadyExistsError('Invalid Input'));

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);

      const releases = await new Manifest({github, checkpoint}).githubRelease();
      mock.verify();
      expect(releases).to.eql({
        'node/pkg1': undefined,
        'node/pkg2': {
          version: '0.1.2',
          major: 0,
          minor: 1,
          patch: 2,
          pr: 22,
          draft: false,
          body: '',
          sha: 'abc123',
          html_url: 'https://pkg2@0.1.2:html',
          tag_name: 'pkg2-v0.1.2',
          name: '@node/pkg2 pkg2-v0.1.2',
          upload_url: 'https://pkg2@0.1.2:upload',
        },
        python: undefined,
      });
      expect(logs).to.eql([
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Found version 0.1.2 for node/pkg2 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        [
          'Found version 1.2.3 for python in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        ['Creating release for Node(@node/pkg1)@3.2.1', CheckpointType.Success],
        [
          'Release for Node(@node/pkg1)@3.2.1 already exists',
          CheckpointType.Success,
        ],
        ['Creating release for Node(@node/pkg2)@0.1.2', CheckpointType.Success],
        ['Creating release for Python(foolib)@1.2.3', CheckpointType.Success],
        [
          'Release for Python(foolib)@1.2.3 already exists',
          CheckpointType.Success,
        ],
      ]);
    });

    it('handles non-already_exists 422 error ', async () => {
      const manifest = JSON.stringify({
        'node/pkg1': '3.2.1',
      });
      const manifestConfig: ManifestConfig = {
        packages: {
          'node/pkg1': {},
        },
      };
      const config = JSON.stringify(manifestConfig);

      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch,
      });
      const mock = mockGithub({
        github,
        manifest,
        lastReleaseSha,
        fixtureFiles: ['node/pkg1/package.json'],
        inlineFiles: [
          ['release-please-config.json', config],
          ['.release-please-manifest.json', manifest],
          ['node/pkg1/CHANGELOG.md', '#Changelog\n\n## v3.2.1\n\n* entry'],
        ],
        mergedPRFiles: [
          'node/pkg1/package.json',
          'node/pkg1/CHANGELOG.md',
          '.release-please-manifest.json',
        ],
        addLabel: false,
        removeLabel: false,
        prComments: [':robot: Failed to create release for @node/pkg1 :cloud:'],
      });

      class ValidationError extends Error {
        status = 422;
      }

      mock
        .expects('createRelease')
        .withArgs(
          '@node/pkg1',
          'pkg1-v3.2.1',
          lastReleaseSha,
          sinon.match.string,
          false
        )
        .once()
        .rejects(new ValidationError('A different 422'));

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const releases = await new Manifest({github, checkpoint}).githubRelease();
      mock.verify();
      expect(releases).to.eql({'node/pkg1': undefined});
      expect(logs).to.eql([
        [
          'Found version 3.2.1 for node/pkg1 in ' +
            '.release-please-manifest.json at abc123 of main',
          CheckpointType.Success,
        ],
        ['Creating release for Node(@node/pkg1)@3.2.1', CheckpointType.Success],
        [
          // an 'already_exists' 422 would have logged as:
          // "Release ... already exists" / CheckpointType.Success
          'Failed to create release for Node(@node/pkg1)@3.2.1: A different 422',
          CheckpointType.Failure,
        ],
      ]);
    });
  });

  describe('validate', () => {
    const entryPoints: ('pullRequest' | 'githubRelease')[] = [
      'pullRequest',
      'githubRelease',
    ];
    const invalidConfigs = [
      {
        setupName: 'invalid json',
        manifest: 'foo',
        config: 'bar',
        expectedLogs: [
          [
            'Invalid JSON in release-please-config.json',
            CheckpointType.Failure,
          ],
          [
            'Invalid JSON in .release-please-manifest.json',
            CheckpointType.Failure,
          ],
        ],
      },
      {
        setupName: 'no config.packages, bad manifest format',
        manifest: '{"path": 1}',
        config: '{"release-type": "node"}',
        expectedLogs: [
          [
            'No packages found: release-please-config.json',
            CheckpointType.Failure,
          ],
          [
            '.release-please-manifest.json must only contain string values',
            CheckpointType.Failure,
          ],
        ],
      },
      {
        setupName: 'valid config, invalid manifest',
        manifest: '{"path": 1}',
        config: '{"packages":{"foo":{}}}',
        expectedLogs: [
          [
            '.release-please-manifest.json must only contain string values',
            CheckpointType.Failure,
          ],
        ],
      },
    ];
    for (const method of entryPoints) {
      for (const test of invalidConfigs) {
        const {config, manifest, expectedLogs, setupName} = test;
        it(`validates manifest and config in ${method} for ${setupName}`, async () => {
          const github = new GitHub({
            owner: 'fake',
            repo: 'repo',
            defaultBranch,
          });
          const mock = mockGithub({
            github,
            inlineFiles: [
              ['release-please-config.json', config],
              ['.release-please-manifest.json', manifest],
            ],
            addLabel: false,
          });
          const logs: [string, CheckpointType][] = [];
          const checkpoint = (msg: string, type: CheckpointType) =>
            logs.push([msg, type]);

          const m = new Manifest({github, checkpoint});
          const result = await m[method]();
          mock.verify();

          expect(result).to.be.undefined;
          expect(logs).to.eql(expectedLogs);
        });
      }
      it(`is missing config for ${method}`, async () => {
        const github = new GitHub({
          owner: 'fake',
          repo: 'repo',
          defaultBranch,
        });
        sandbox
          .stub(github, 'getFileContentsOnBranch')
          .rejects(Object.assign(Error('not found'), {status: 404}));
        const logs: [string, CheckpointType][] = [];
        const checkpoint = (msg: string, type: CheckpointType) =>
          logs.push([msg, type]);
        const m = new Manifest({github, checkpoint});
        let caught = false;
        try {
          await m[method]();
        } catch (e) {
          caught = true;
        }
        expect(caught).to.be.true;
        expect(logs).to.eql([
          [
            'Failed to get release-please-config.json at HEAD: 404',
            CheckpointType.Failure,
          ],
        ]);
      });
      it(`is missing manifest for ${method}`, async () => {
        const github = new GitHub({
          owner: 'fake',
          repo: 'repo',
          defaultBranch,
        });
        const stub = sandbox.stub(github, 'getFileContentsOnBranch');
        stub.withArgs('release-please-config.json', defaultBranch).resolves({
          sha: '',
          content: '',
          parsedContent: '{"packages": {"path":{}}}',
        });
        stub
          .withArgs('.release-please-manifest.json', defaultBranch)
          .rejects(Object.assign(Error('not found'), {status: 404}));
        const logs: [string, CheckpointType][] = [];
        const checkpoint = (msg: string, type: CheckpointType) =>
          logs.push([msg, type]);
        const m = new Manifest({github, checkpoint});
        let caught = false;
        try {
          await m[method]();
        } catch (e) {
          caught = true;
        }
        expect(caught).to.be.true;
        expect(logs).to.eql([
          [
            'Failed to get .release-please-manifest.json at HEAD: 404',
            CheckpointType.Failure,
          ],
        ]);
      });
    }
  });
});
