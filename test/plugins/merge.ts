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
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {Merge} from '../../src/plugins/merge';
import {CandidateReleasePullRequest} from '../../src/manifest';
import {expect} from 'chai';
import {
  buildMockCandidatePullRequest,
  assertHasUpdate,
  dateSafe,
} from '../helpers';
import snapshot = require('snap-shot-it');
import {RawContent} from '../../src/updaters/raw-content';
import {CompositeUpdater} from '../../src/updaters/composite';

const sandbox = sinon.createSandbox();

describe('Merge plugin', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'node-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('ignores no pull requests', async () => {
      const candidates: CandidateReleasePullRequest[] = [];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(0);
    });

    it('ignores a single pull request', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0'),
      ];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).to.eql(candidates);
    });

    it('merges multiple pull requests into an aggregate', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest(
          'python',
          'python',
          '1.0.0',
          'python-pkg',
          [
            {
              path: 'path1/foo',
              createIfMissing: false,
              updater: new RawContent('foo'),
            },
          ]
        ),
        buildMockCandidatePullRequest('node', 'node', '3.3.4', '@here/pkgA', [
          {
            path: 'path1/foo',
            createIfMissing: false,
            updater: new RawContent('bar'),
          },
          {
            path: 'path2/foo',
            createIfMissing: false,
            updater: new RawContent('asdf'),
          },
        ]),
      ];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const candidate = newCandidates[0];
      const updates = candidate!.pullRequest.updates;
      expect(updates).lengthOf(2);
      assertHasUpdate(updates, 'path1/foo', CompositeUpdater);
      assertHasUpdate(updates, 'path2/foo', RawContent);
      snapshot(dateSafe(candidate!.pullRequest.body.toString()));
    });

    it('merges multiple pull requests as a draft', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest(
          'python',
          'python',
          '1.0.0',
          'python-pkg',
          [
            {
              path: 'path1/foo',
              createIfMissing: false,
              updater: new RawContent('foo'),
            },
          ],
          'python notes',
          true
        ),
        buildMockCandidatePullRequest(
          'node',
          'node',
          '3.3.4',
          '@here/pkgA',
          [
            {
              path: 'path1/foo',
              createIfMissing: false,
              updater: new RawContent('bar'),
            },
            {
              path: 'path2/foo',
              createIfMissing: false,
              updater: new RawContent('asdf'),
            },
          ],
          'some notes',
          true
        ),
      ];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const candidate = newCandidates[0];
      const updates = candidate!.pullRequest.updates;
      expect(updates).lengthOf(2);
      assertHasUpdate(updates, 'path1/foo', CompositeUpdater);
      assertHasUpdate(updates, 'path2/foo', RawContent);
      snapshot(dateSafe(candidate!.pullRequest.body.toString()));
      expect(candidate.pullRequest.draft).to.be.true;
    });
  });
});
