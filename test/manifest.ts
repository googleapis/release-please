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
import {stubFilesFromFixtures, buildGitHubFileRaw} from './releasers/utils';
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

  function stubGithub(options: {
    github: GitHub;
    commits?: Commit[];
    manifest?: string;
    lastReleaseSha?: string;
    mergedPRFiles?: string[];
    addLabel?: string | false;
  }) {
    const {
      github,
      commits,
      manifest,
      lastReleaseSha,
      mergedPRFiles,
      addLabel,
    } = options;
    if (manifest !== undefined && lastReleaseSha) {
      sandbox
        .stub(github, 'getFileContentsWithSimpleAPI')
        .withArgs('.release-please-manifest.json', lastReleaseSha, false)
        .resolves(buildGitHubFileRaw(manifest));
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
    sandbox.stub(github, 'lastMergedPRByHeadBranch').resolves(mergedPR);
    sandbox
      .stub(github, 'findFilesByFilename')
      // implementation strips leading `path`
      .resolves(['src/foolib/version.py']);
    // creating a new PR
    sandbox.stub(github, 'findOpenReleasePRs').resolves([]);
    sandbox
      .stub(github, 'commitsSinceSha')
      .withArgs(lastReleaseSha)
      .resolves(commits ?? []);

    const addLabelsStub = sandbox.stub(github, 'addLabels');
    const labelToAdd = addLabel ?? 'autorelease: pending';
    if (labelToAdd) {
      addLabelsStub.withArgs([labelToAdd], 22).resolves(true);
    }
    addLabelsStub.throws(() => {
      const argsArr = addLabelsStub.getCalls().map(c => c.args);
      const unexpected = argsArr.filter(args => args[0][0] !== labelToAdd);
      return new Error(
        'addLabelsStub called with unexpected args: ' +
          JSON.stringify(unexpected[0])
      );
    });
  }

  describe('pullRequest', () => {
    it('python and node package', async function () {
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
      stubGithub({github, commits, manifest, lastReleaseSha});
      stubFilesFromFixtures({
        sandbox,
        github,
        defaultBranch,
        fixturePath,
        flatten: false,
        files: [
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
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Python(foolib)', CheckpointType.Success],
      ]);
    });

    it('python specific releaser config overrides defaults', async function () {
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
      stubGithub({github, commits, manifest, lastReleaseSha});
      stubFilesFromFixtures({
        sandbox,
        github,
        defaultBranch,
        fixturePath,
        flatten: false,
        files: [
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
      expect(pr).to.equal(22);
      expect(logs).to.eql([
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
      stubGithub({github, commits, manifest, lastReleaseSha});
      stubFilesFromFixtures({
        sandbox,
        github,
        defaultBranch,
        fixturePath,
        flatten: false,
        files: [
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
      expect(pr).to.equal(22);
      expect(logs).to.eql([
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
      stubGithub({github, commits, manifest, lastReleaseSha});
      stubFilesFromFixtures({
        sandbox,
        github,
        defaultBranch,
        fixturePath,
        flatten: false,
        files: [
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
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Node(@node/pkg2)', CheckpointType.Success],
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
      stubGithub({github, commits, manifest, lastReleaseSha});
      stubFilesFromFixtures({
        sandbox,
        github,
        defaultBranch,
        fixturePath,
        flatten: false,
        files: ['node/pkg2/package.json'],
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
      expect(pr).to.equal(22);
      expect(logs).to.eql([
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
      stubGithub({github, commits, manifest, lastReleaseSha});
      stubFilesFromFixtures({
        sandbox,
        github,
        defaultBranch,
        fixturePath,
        flatten: false,
        // node releaser looks up its package.json before anything else.
        files: ['node/pkg1/package.json', 'node/pkg2/package.json'],
        inlineFiles: [
          ['release-please-config.json', config],
          // manifest has not been changed.
          ['.release-please-manifest.json', manifest],
        ],
      });
      // there should be no snapshot created for this test
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const pr = await new Manifest({github, checkpoint}).pullRequest();
      expect(pr).to.be.undefined;
      expect(logs).to.eql([
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
      stubGithub({github, commits}); // no lastReleaseSha/manifest
      stubFilesFromFixtures({
        sandbox,
        github,
        defaultBranch,
        fixturePath,
        flatten: false,
        files: [
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
      expect(pr).to.equal(22);
      expect(logs).to.eql([
        ['Processing package: Node(@node/pkg1)', CheckpointType.Success],
        ['Processing package: Node(@node/pkg2)', CheckpointType.Success],
        ['Processing package: Python(foolib)', CheckpointType.Success],
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
          stubGithub({github, manifest, lastReleaseSha});
          stubFilesFromFixtures({
            sandbox,
            github,
            defaultBranch,
            fixturePath,
            flatten: false,
            files: [],
            inlineFiles: [
              ['release-please-config.json', config],
              ['.release-please-manifest.json', manifest],
            ],
          });
          const logs: [string, CheckpointType][] = [];
          const checkpoint = (msg: string, type: CheckpointType) =>
            logs.push([msg, type]);

          const m = new Manifest({github, checkpoint});
          const result = await m[method]();

          expect(result).to.be.undefined;
          expect(logs).to.eql(expectedLogs);
        });
      }
      it(`missing config in ${method}`, async () => {
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
      it(`missing manifest in ${method}`, async () => {
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
