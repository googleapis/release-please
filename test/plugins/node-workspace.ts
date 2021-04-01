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

import NodeWorkspaceDependencyUpdates from '../../src/plugins/node-workspace';
import {describe, it, afterEach} from 'mocha';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {Config} from '../../src/manifest';
import {buildGitHubFileRaw} from '../releasers/utils';
import {ManifestPackageWithPRData} from '../../src';
import {packageJsonStringify} from '../../src/util/package-json-stringify';
import {CheckpointType} from '../../src/util/checkpoint';
import {stringifyExpectedChanges} from '../helpers';
import snapshot = require('snap-shot-it');

const sandbox = sinon.createSandbox();

function stringifyActual(actual: ManifestPackageWithPRData[]) {
  let stringified = '';
  for (const pkgsWithPRData of actual) {
    const changes = pkgsWithPRData.prData.changes;
    stringified +=
      '='.repeat(20) +
      '\n' +
      JSON.stringify(
        pkgsWithPRData,
        (k, v) => (k === ' changes' ? undefined : v),
        2
      ) +
      '\n';
    stringified += stringifyExpectedChanges([...changes]) + '\n';
  }
  return stringified;
}

const pkgAData: ManifestPackageWithPRData = {
  config: {
    releaseType: 'node',
    packageName: '@here/pkgA',
    path: 'packages/pkgA',
  },
  prData: {
    version: '1.1.2',
    changes: new Map([
      [
        'packages/pkgA/package.json',
        {
          content: packageJsonStringify({
            name: '@here/pkgA',
            version: '1.1.2',
            dependencies: {'@there/foo': '^4.1.7'},
          }),
          mode: '100644',
        },
      ],
      [
        'packages/pkgA/CHANGELOG.md',
        {
          content:
            '# Changelog' +
            '\n\nAll notable changes to this project will be ' +
            'documented in this file.' +
            '### [1.1.2](https://www.github.com/fake/repo/compare' +
            '/pkgA-v1.1.1...pkgA-v1.1.2) (1983-10-10)' +
            '\n\n\n### Bug Fixes' +
            '\n\n* We fixed a bug!',
          mode: '100644',
        },
      ],
    ]),
  },
};

describe('NodeWorkspaceDependencyUpdates', () => {
  afterEach(() => {
    sandbox.restore();
  });

  function mockGithub(github: GitHub) {
    return sandbox.mock(github);
  }

  function expectGetFiles(
    mock: sinon.SinonMock,
    namesContents: [string, string | number | false][]
  ) {
    for (const [file, contents] of namesContents) {
      if (typeof contents === 'string') {
        mock
          .expects('getFileContentsOnBranch')
          .withExactArgs(file, 'main')
          .once()
          .resolves(buildGitHubFileRaw(contents));
      } else if (contents) {
        mock
          .expects('getFileContentsOnBranch')
          .withExactArgs(file, 'main')
          .once()
          .rejects(
            Object.assign(Error(`error: ${contents}`), {status: contents})
          );
      } else {
        mock
          .expects('getFileContentsOnBranch')
          .withExactArgs(file, 'main')
          .never();
      }
    }
  }

  describe('run', () => {
    it('handles a simple chain where root pkg update cascades to dependents', async function () {
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {path: 'packages/pkgB', releaseType: 'node'},
          {path: 'packages/pkgC', releaseType: 'node'},
          // should ignore non-node packages
          {path: 'py/pkg', releaseType: 'python'},
        ],
      };
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);

      // packages B and C did not get release-please updates but B depends on A
      // and C depends on B so both should be getting patch bumps
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        [
          'packages/pkgB/package.json',
          JSON.stringify({
            name: '@here/pkgB',
            version: '2.2.2',
            dependencies: {
              '@here/pkgA': '^1.1.1',
              someExternal: '^9.2.3',
            },
          }),
        ],
        [
          'packages/pkgB/CHANGELOG.md',
          '# Changelog' +
            '\n\nAll notable changes to this project will be ' +
            'documented in this file.' +
            '\n\n### [2.2.2](https://www.github.com/fake/repo/compare' +
            '/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)' +
            '\n\n\n### Bug Fixes' +
            '\n\n* We fixed a bug',
        ],
        [
          'packages/pkgC/package.json',
          JSON.stringify({
            name: '@here/pkgC',
            version: '3.3.3',
            dependencies: {
              '@here/pkgB': '^2.2.2',
              anotherExternal: '^4.3.1',
            },
          }),
        ],
        ['packages/pkgC/CHANGELOG.md', ''],
      ]);

      // pkgA had a patch bump from manifest.runReleasers()
      const newManifestVersions = new Map([
        ['packages/pkgA', '1.1.2'],
        ['py/pkg', '1.1.2'],
      ]);
      // all incoming non-node changes should be left alone and returned.
      const pyPkgData: ManifestPackageWithPRData = {
        config: {
          releaseType: 'python',
          path: 'py/pkg',
        },
        prData: {
          version: '1.1.2',
          changes: new Map([
            [
              'py/pkg/setup.py',
              {
                content: 'some python version content',
                mode: '100644',
              },
            ],
          ]),
        },
      };
      const pkgsWithPRData: ManifestPackageWithPRData[] = [
        pkgAData,
        pyPkgData, // should ignore non-node packages
      ];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([
        ['packages/pkgA', '1.1.2'],
        ['py/pkg', '1.1.2'],
        ['packages/pkgB', '2.2.3'],
        ['packages/pkgC', '3.3.4'],
      ]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });

    it('handles a triangle: root and one leg updates bumps other leg', async function () {
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {path: 'packages/pkgB', releaseType: 'node'},
          {path: 'packages/pkgC', releaseType: 'node'},
        ],
      };
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);
      // package C did not get a release-please updated but it depends on both
      // A and B which did get release-please bumps so it should receive a
      // patch bump
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        ['packages/pkgB/package.json', false],
        ['packages/pkgB/CHANGELOG.md', false],
        [
          'packages/pkgC/package.json',
          JSON.stringify({
            name: '@here/pkgC',
            version: '3.3.3',
            dependencies: {
              '@here/pkgA': '^1.1.1',
              '@here/pkgB': '^2.2.2',
              anotherExternal: '^4.3.1',
            },
          }),
        ],
        [
          'packages/pkgC/CHANGELOG.md',
          '# Changelog' +
            '\n\nAll notable changes to this project will be ' +
            'documented in this file.' +
            '\n\n### [3.3.3](https://www.github.com/fake/repo/compare' +
            '/pkgC-v3.3.2...pkgC-v3.3.3) (1983-10-10)' +
            '\n\n\n### Bug Fixes' +
            '\n\n* We fixed a bug',
        ],
      ]);

      // pkgA had a patch bump and pkgB had a minor bump from
      // manifest.runReleasers()
      const newManifestVersions = new Map([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', '2.3.0'],
      ]);
      const pkgsWithPRData: ManifestPackageWithPRData[] = [
        pkgAData,
        {
          config: {
            releaseType: 'node',
            packageName: '@here/pkgB',
            path: 'packages/pkgB',
          },
          prData: {
            version: '2.3.0',
            changes: new Map([
              [
                'packages/pkgB/package.json',
                {
                  content: packageJsonStringify({
                    name: '@here/pkgB',
                    version: '2.3.0',
                    dependencies: {
                      // release-please does not update dependency versions
                      '@here/pkgA': '^1.1.1',
                      someExternal: '^9.2.3',
                    },
                  }),
                  mode: '100644',
                },
              ],
              [
                'packages/pkgB/CHANGELOG.md',
                {
                  content:
                    '# Changelog' +
                    '\n\nAll notable changes to this project will be ' +
                    'documented in this file.' +
                    '\n\n### [2.3.0](https://www.github.com/fake/repo/compare' +
                    '/pkgB-v2.2.2...pkgB-v2.3.0) (1983-10-10)' +
                    '\n\n\n### Features' +
                    '\n\n* We added a feature' +
                    '\n\n### [2.2.2](https://www.github.com/fake/repo/compare' +
                    '/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)' +
                    '\n\n\n### Bug Fixes' +
                    '\n\n* We fixed a bug',
                  mode: '100644',
                },
              ],
            ]),
          },
        },
      ];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', '2.3.0'],
        ['packages/pkgC', '3.3.4'],
      ]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });

    it('does not update dependencies on preMajor versions with minor bump', async function () {
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {path: 'packages/pkgB', releaseType: 'node'},
          {path: 'packages/pkgC', releaseType: 'node'},
        ],
      };
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);
      // package C did not get a release-please updated but it depends on both
      // A and B which did get release-please bumps so it should receive a
      // patch bump
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        ['packages/pkgB/package.json', false],
        ['packages/pkgB/CHANGELOG.md', false],
        [
          'packages/pkgC/package.json',
          JSON.stringify({
            name: '@here/pkgC',
            version: '3.3.3',
            dependencies: {
              '@here/pkgA': '^1.1.1',
              '@here/pkgB': '^0.2.1',
              anotherExternal: '^4.3.1',
            },
          }),
        ],
        [
          'packages/pkgC/CHANGELOG.md',
          '# Changelog' +
            '\n\nAll notable changes to this project will be ' +
            'documented in this file.' +
            '\n\n### [3.3.3](https://www.github.com/fake/repo/compare' +
            '/pkgC-v3.3.2...pkgC-v3.3.3) (1983-10-10)' +
            '\n\n\n### Bug Fixes' +
            '\n\n* We fixed a bug',
        ],
      ]);

      // pkgA had a patch bump and pkgB had a minor bump from
      // manifest.runReleasers()
      const newManifestVersions = new Map([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', '0.3.0'],
      ]);
      const pkgsWithPRData: ManifestPackageWithPRData[] = [
        pkgAData,
        {
          config: {
            releaseType: 'node',
            packageName: '@here/pkgB',
            path: 'packages/pkgB',
          },
          prData: {
            version: '0.3.0',
            changes: new Map([
              [
                'packages/pkgB/package.json',
                {
                  content: packageJsonStringify({
                    name: '@here/pkgB',
                    version: '0.3.0',
                    dependencies: {
                      // release-please does not update dependency versions
                      '@here/pkgA': '^1.1.1',
                      someExternal: '^9.2.3',
                    },
                  }),
                  mode: '100644',
                },
              ],
              [
                'packages/pkgB/CHANGELOG.md',
                {
                  content:
                    '# Changelog' +
                    '\n\nAll notable changes to this project will be ' +
                    'documented in this file.' +
                    '\n\n### [0.3.0](https://www.github.com/fake/repo/compare' +
                    '/pkgB-v0.2.1...pkgB-v0.3.0) (1983-10-10)' +
                    '\n\n\n### Features' +
                    '\n\n* We added a feature' +
                    '\n\n### [0.2.1](https://www.github.com/fake/repo/compare' +
                    '/pkgB-v0.2.0...pkgB-v0.2.1) (1983-10-10)' +
                    '\n\n\n### Bug Fixes' +
                    '\n\n* We fixed a bug',
                  mode: '100644',
                },
              ],
            ]),
          },
        },
      ];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', '0.3.0'],
        ['packages/pkgC', '3.3.4'],
      ]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });

    it('handles unusual changelog formats', async function () {
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {path: 'packages/pkgB', releaseType: 'node'},
        ],
      };
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);
      //
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        ['packages/pkgB/package.json', false],
        ['packages/pkgB/CHANGELOG.md', false],
      ]);

      // pkgA had a patch bump and pkgB had a minor bump from
      // manifest.runReleasers()
      const newManifestVersions = new Map([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', '2.3.0'],
      ]);
      const pkgsWithPRData: ManifestPackageWithPRData[] = [
        pkgAData,
        {
          config: {
            releaseType: 'node',
            packageName: '@here/pkgB',
            path: 'packages/pkgB',
          },
          prData: {
            version: '2.3.0',
            changes: new Map([
              [
                'packages/pkgB/package.json',
                {
                  content: packageJsonStringify({
                    name: '@here/pkgB',
                    version: '2.3.0',
                    dependencies: {
                      // release-please does not update dependency versions
                      '@here/pkgA': '^1.1.1',
                      someExternal: '^9.2.3',
                    },
                  }),
                  mode: '100644',
                },
              ],
              [
                'packages/pkgB/CHANGELOG.md',
                {
                  content:
                    '# Changelog' +
                    '\n\nAll notable changes to this project will be ' +
                    'documented in this file.' +
                    '\n\n### [2.3.0](https://www.github.com/fake/repo/compare' +
                    '/pkgB-v2.2.2...pkgB-v2.3.0) (1983-10-10)' +
                    '\n\n\n### Features' +
                    '\n\n* We added a feature' +
                    '\n\n### some stuff we did not expect' +
                    '\n\n* and more unexpected stuff',
                  mode: '100644',
                },
              ],
            ]),
          },
        },
      ];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', '2.3.0'],
      ]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });

    it('handles errors retrieving changelogs', async function () {
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {
            path: 'packages/pkgB',
            releaseType: 'node',
            changelogPath: 'CHANGES.md',
          },
          {path: 'packages/pkgC', releaseType: 'node'},
        ],
      };
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        [
          'packages/pkgB/package.json',
          JSON.stringify({
            name: '@here/pkgB',
            version: '2.2.2',
            dependencies: {
              '@here/pkgA': '^1.1.1',
              someExternal: '^9.2.3',
            },
          }),
        ],
        ['packages/pkgB/CHANGES.md', 501],
        [
          'packages/pkgC/package.json',
          JSON.stringify({
            name: '@here/pkgC',
            version: '3.3.3',
            dependencies: {
              '@here/pkgB': '^2.2.2',
              anotherExternal: '^4.3.1',
            },
          }),
        ],
        ['packages/pkgC/CHANGELOG.md', 404],
      ]);

      // pkgA had a patch bump from manifest.runReleasers()
      const newManifestVersions = new Map([['packages/pkgA', '1.1.2']]);
      const pkgsWithPRData: ManifestPackageWithPRData[] = [pkgAData];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', '2.2.3'],
        ['packages/pkgC', '3.3.4'],
      ]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });

    it('handles discontiguous graph', async function () {
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {path: 'packages/pkgB', releaseType: 'node'},
          {path: 'packages/pkgAA', releaseType: 'node'},
          {path: 'packages/pkgBB', releaseType: 'node'},
        ],
      };
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);
      // package B did not get a release-please updated but it depends on A
      // which did so it should patch bump
      // package BB did not get a release-please updated but it depends on AA
      // which did so it should patch bump
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        [
          'packages/pkgB/package.json',
          JSON.stringify({
            name: '@here/pkgB',
            version: '2.2.2',
            dependencies: {
              '@here/pkgA': '^1.1.1',
              someExternal: '^9.2.3',
            },
          }),
        ],
        [
          'packages/pkgB/CHANGELOG.md',
          '# Changelog' +
            '\n\nAll notable changes to this project will be ' +
            'documented in this file.' +
            '\n\n### [2.2.2](https://www.github.com/fake/repo/compare' +
            '/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)' +
            '\n\n\n### Bug Fixes' +
            '\n\n* We fixed a bug\n',
        ],
        [
          'packages/pkgBB/package.json',
          JSON.stringify({
            name: '@here/pkgBB',
            version: '22.2.2',
            dependencies: {
              '@here/pkgAA': '^11.1.1',
              someExternal: '^9.2.3',
            },
          }),
        ],
        [
          'packages/pkgBB/CHANGELOG.md',
          '# Changelog' +
            '\n\nAll notable changes to this project will be ' +
            'documented in this file.' +
            '\n\n### [22.2.2](https://www.github.com/fake/repo/compare' +
            '/pkgBB-v22.2.1...pkgBB-v22.2.2) (1983-10-10)' +
            '\n\n\n### Bug Fixes' +
            '\n\n* We fixed a bug\n',
        ],
      ]);

      // pkgA had a patch bump and pkgAA had a minor bump from
      // manifest.runReleasers()
      const newManifestVersions = new Map([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgAA', '11.2.0'],
      ]);
      const pkgAAData: ManifestPackageWithPRData = {
        config: {
          releaseType: 'node',
          packageName: '@here/pkgAA',
          path: 'packages/pkgAA',
        },
        prData: {
          version: '11.2.0',
          changes: new Map([
            [
              'packages/pkgAA/package.json',
              {
                content: packageJsonStringify({
                  name: '@here/pkgAA',
                  version: '11.2.0',
                  dependencies: {'@there/foo': '^4.1.7'},
                }),
                mode: '100644',
              },
            ],
            [
              'packages/pkgAA/CHANGELOG.md',
              {
                content:
                  '### [11.2.0](https://www.github.com/fake/repo/compare' +
                  '/pkgAA-v11.1.1...pkgAA-v11.2.0) (1983-10-10)' +
                  '\n\n\n### Features' +
                  '\n\n* We added a feature',
                mode: '100644',
              },
            ],
          ]),
        },
      };
      const pkgsWithPRData: ManifestPackageWithPRData[] = [pkgAData, pkgAAData];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgAA', '11.2.0'],
        ['packages/pkgB', '2.2.3'],
        ['packages/pkgBB', '22.2.3'],
      ]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });

    it('updates dependent from pre-release version', async function () {
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {path: 'packages/pkgB', releaseType: 'node'},
        ],
      };
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);
      // package B did not get a release-please updated but it depends on A
      // which did so it should patch bump
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        [
          'packages/pkgB/package.json',
          JSON.stringify({
            name: '@here/pkgB',
            version: '2.2.2',
            dependencies: {
              // manually set in some prior release
              '@here/pkgA': '^1.1.2-alpha.0',
              someExternal: '^9.2.3',
            },
          }),
        ],
        [
          'packages/pkgB/CHANGELOG.md',
          '# Changelog' +
            '\n\nAll notable changes to this project will be ' +
            'documented in this file.' +
            '\n\n### [2.2.2](https://www.github.com/fake/repo/compare' +
            '/pkgB-v2.2.1...pkgB-v2.2.2) (1983-10-10)' +
            '\n\n\n### Bug Fixes' +
            '\n\n* We fixed a bug\n',
        ],
      ]);

      // pkgA got promoted from previous 1.1.2-alpha.0 pre-release
      // by manifest.runReleasers()
      const newManifestVersions = new Map([['packages/pkgA', '1.1.2']]);
      const pkgsWithPRData = [pkgAData];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', '2.2.3'],
      ]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });

    it('does not update dependency to pre-release version', async function () {
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {path: 'packages/pkgB', releaseType: 'node'},
        ],
      };
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        [
          'packages/pkgB/package.json',
          JSON.stringify({
            name: '@here/pkgB',
            version: '2.2.2',
            dependencies: {
              '@here/pkgA': '^1.1.1',
              someExternal: '^9.2.3',
            },
          }),
        ],
      ]);

      // pkgA got set to 1.1.2-alpha.0 pre-release
      // by manifest.runReleasers()
      const newManifestVersions = new Map([['packages/pkgA', '1.1.2-alpha.0']]);
      const pkgsWithPRData: ManifestPackageWithPRData[] = [
        {
          config: {
            releaseType: 'node',
            packageName: '@here/pkgA',
            path: 'packages/pkgA',
          },
          prData: {
            version: '1.1.2-alpha.0',
            changes: new Map([
              [
                'packages/pkgA/package.json',
                {
                  content: packageJsonStringify({
                    name: '@here/pkgA',
                    version: '1.1.2-alpha.0',
                    dependencies: {'@there/foo': '^4.1.7'},
                  }),
                  mode: '100644',
                },
              ],
              [
                'packages/pkgA/CHANGELOG.md',
                {
                  content:
                    '# Changelog' +
                    '\n\nAll notable changes to this project will be ' +
                    'documented in this file.' +
                    '\n\n### [1.1.2-alpha.0](https://www.github.com/fake/repo/compare' +
                    '/pkgA-v1.1.1...pkgA-v1.1.2-alpha.0) (1983-10-10)' +
                    '\n\n\n### Bug Fixes' +
                    '\n\n* We fixed a bug!',
                  mode: '100644',
                },
              ],
            ]),
          },
        },
      ];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([['packages/pkgA', '1.1.2-alpha.0']]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });

    it('does not update dependent with invalid version', async function () {
      const github = new GitHub({
        owner: 'fake',
        repo: 'repo',
        defaultBranch: 'main',
      });
      const mock = mockGithub(github);
      expectGetFiles(mock, [
        ['packages/pkgA/package.json', false],
        ['packages/pkgA/CHANGELOG.md', false],
        [
          'packages/pkgB/package.json',
          JSON.stringify({
            name: '@here/pkgB',
            version: 'some-invalid-version',
            dependencies: {
              '@here/pkgA': '^1.1.1',
              someExternal: '^9.2.3',
            },
          }),
        ],
        [
          'packages/pkgB/CHANGELOG.md',
          '# Changelog' +
            '\n\nAll notable changes to this project will be ' +
            'documented in this file.' +
            '\n\n### [some-invalid-version](https://www.github.com/fake/repo/compare' +
            '/pkgB-v2.2.1...pkgB-vsome-invalid-version) (1983-10-10)' +
            '\n\n\n### Bug Fixes' +
            '\n\n* We fixed a bug and set the version wonky on purpose?\n',
        ],
      ]);
      const config: Config = {
        packages: {}, // unused, required by interface
        parsedPackages: [
          {path: 'packages/pkgA', releaseType: 'node'},
          {path: 'packages/pkgB', releaseType: 'node'},
        ],
      };

      // pkgA got set to 1.1.2 by manifest.runReleasers()
      const newManifestVersions = new Map([['packages/pkgA', '1.1.2']]);
      const pkgsWithPRData = [pkgAData];

      const logs: [string, CheckpointType][] = [];
      const checkpoint = (msg: string, type: CheckpointType) =>
        logs.push([msg, type]);
      const nodeWS = new NodeWorkspaceDependencyUpdates(
        github,
        config,
        'node-workspace',
        checkpoint
      );
      const [actualManifest, actualChanges] = await nodeWS.run(
        newManifestVersions,
        pkgsWithPRData
      );
      mock.verify();
      expect([...actualManifest]).to.eql([
        ['packages/pkgA', '1.1.2'],
        ['packages/pkgB', 'some-invalid-version'],
      ]);
      const snapPrefix = this.test!.fullTitle();
      snapshot(snapPrefix + ' logs', logs);
      snapshot(snapPrefix + ' changes', stringifyActual(actualChanges));
    });
  });
});
