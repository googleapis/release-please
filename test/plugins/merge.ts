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
import {Version} from '../../src/version';

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

    it('merges a single pull request', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0'),
      ];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      expect(newCandidates[0].pullRequest.title.toString()).to.eql(
        'chore: release main'
      );
    });

    it('merges multiple pull requests into an aggregate', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0', {
          component: 'python-pkg',
          updates: [
            {
              path: 'path1/foo',
              createIfMissing: false,
              updater: new RawContent('foo'),
            },
          ],
        }),
        buildMockCandidatePullRequest('node', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [
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
        }),
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
        buildMockCandidatePullRequest('python', 'python', '1.0.0', {
          component: 'python-pkg',
          updates: [
            {
              path: 'path1/foo',
              createIfMissing: false,
              updater: new RawContent('foo'),
            },
          ],
          notes: 'python notes',
          draft: true,
        }),
        buildMockCandidatePullRequest('node', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [
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
          notes: 'some notes',
          draft: true,
        }),
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

    it('merges all labels for pull requests', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('python', 'python', '1.0.0', {
          component: 'python-pkg',
          updates: [
            {
              path: 'path1/foo',
              createIfMissing: false,
              updater: new RawContent('foo'),
            },
          ],
          labels: ['label-a', 'label-b'],
        }),
        buildMockCandidatePullRequest('node', 'node', '3.3.4', {
          component: '@here/pkgA',
          updates: [
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
          labels: ['label-a', 'label-c'],
        }),
      ];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const candidate = newCandidates[0]!;
      expect(candidate.pullRequest.labels).lengthOf(3);
      expect(candidate.pullRequest.labels).to.eql([
        'label-a',
        'label-b',
        'label-c',
      ]);
      snapshot(dateSafe(candidate.pullRequest.body.toString()));
    });
    it('preserves version when all candidates are in subdirectories', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/pkgA', 'node', '2.0.0', {
          component: '@scope/pkgA',
        }),
      ];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const candidate = newCandidates[0];
      expect(candidate.path).to.eql('.');
      expect(candidate.pullRequest.version).to.eql(Version.parse('2.0.0'));
    });

    it('preserves version from root candidate when present', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('.', 'node', '5.0.0', {
          component: 'root-pkg',
        }),
        buildMockCandidatePullRequest('packages/pkgA', 'node', '2.0.0', {
          component: '@scope/pkgA',
        }),
      ];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const candidate = newCandidates[0];
      expect(candidate.pullRequest.version).to.eql(Version.parse('5.0.0'));
    });

    it('preserves version when merging multiple subdirectory candidates', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('packages/pkgA', 'node', '2.0.0', {
          component: '@scope/pkgA',
        }),
        buildMockCandidatePullRequest('packages/pkgB', 'node', '3.1.0', {
          component: '@scope/pkgB',
        }),
      ];
      const plugin = new Merge(github, 'main', {});
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).lengthOf(1);
      const candidate = newCandidates[0];
      expect(candidate.pullRequest.version).to.eql(Version.parse('2.0.0'));
    });
  });
});
