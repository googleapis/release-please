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

import {Manifest} from '../src/manifest';
import * as sinon from 'sinon';
import {GitHub} from '../src/github';
import {stubFilesFromFixtures} from './releasers/utils';
import {expect} from 'chai';
import {CheckpointType} from '../src/util/checkpoint';

const fixturePath = './test/fixtures/manifest/repo';
const defaultBranch = 'main';
const sandbox = sinon.createSandbox();

describe('Manifest', () => {
  afterEach(() => {
    sandbox.restore();
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
      {
        setupName: 'valid config, valid manifest',
        manifest: '{"foo": "1.2.3"}',
        config: '{"packages":{"foo":{}}}',
        expectedLogs: [],
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

          if (expectedLogs.length > 0) {
            expect(result).to.be.undefined;
          }
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
