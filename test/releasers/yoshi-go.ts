// Copyright 2020 Google LLC
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

import * as assert from 'assert';
import {describe, it, before, afterEach} from 'mocha';
import * as nock from 'nock';
import {GoYoshi} from '../../src/releasers/go-yoshi';
import {stringifyExpectedChanges} from '../helpers';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {buildMockCommit} from './utils';

const sandbox = sinon.createSandbox();

describe('YoshiGo', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    before(() => {
      nock.disableNetConnect();
    });
    it('creates a release PR for google-cloud-go', async () => {
      const releasePR = new GoYoshi({
        repoUrl: 'googleapis/google-cloud-go',
        releaseType: 'yoshi-go',
        // not actually used by this type of repo.
        packageName: 'yoshi-go',
        apiUrl: 'https://api.github.com',
      });

      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges: [string, object][] = [];
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );

      sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('master');

      // No open release PRs, so create a new release PR
      sandbox
        .stub(releasePR.gh, 'findOpenReleasePRs')
        .returns(Promise.resolve([]));

      // Indicates that there are no PRs currently waiting to be released:
      sandbox
        .stub(releasePR.gh, 'findMergedReleasePR')
        .returns(Promise.resolve(undefined));

      sandbox.stub(releasePR.gh, 'latestTag').returns(
        Promise.resolve({
          name: 'v0.123.4',
          sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          version: '0.123.4',
        })
      );

      const getFileContentsStub = sandbox.stub(
        releasePR.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      sandbox
        .stub(releasePR.gh, 'commitsSinceSha')
        .resolves([
          buildMockCommit('fix(automl): fixed a really bad bug'),
          buildMockCommit('feat(asset): added a really cool feature'),
          buildMockCommit('fix(pubsub): this commit should be ignored'),
          buildMockCommit('fix(pubsub/pstest): this commit should be ignored'),
          buildMockCommit('fix: this commit should be ignored'),
          buildMockCommit(
            'chore(all): auto-regenerate gapics (#1000)\n\nChanges:\n\nchore(automl): cleaned up a thing\n  PiperOrigin-RevId: 352834281\nfix(pubsublite): a minor issue\n  PiperOrigin-RevId: 352834283'
          ),
          buildMockCommit(
            'chore(all): auto-regenerate gapics (#1001)\n\nCommit Body\n\nChanges:\n\nfix(automl): fixed a minor thing\n  PiperOrigin-RevId: 352834280\nfeat(language): added a new one\n  PiperOrigin-RevId: 352834282'
          ),
          buildMockCommit('fix(pubsublite): start generating v1'),
        ]);

      const addLabelStub = sandbox
        .stub(releasePR.gh, 'addLabels')
        .withArgs(['autorelease: pending'], 22)
        .resolves();

      await releasePR.run();
      snapshot(stringifyExpectedChanges(expectedChanges));
      expect(addLabelStub.callCount).to.eql(1);
    });
    it('creates a release PR for google-api-go-client', async () => {
      const releasePR = new GoYoshi({
        repoUrl: 'googleapis/google-api-go-client',
        releaseType: 'yoshi-go',
        // not actually used by this type of repo.
        packageName: 'yoshi-go',
        apiUrl: 'https://api.github.com',
      });

      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges: [string, object][] = [];
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );

      sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('master');

      // Indicates that there are no PRs currently waiting to be released:
      sandbox
        .stub(releasePR.gh, 'findMergedReleasePR')
        .returns(Promise.resolve(undefined));

      // Return latest tag used to determine next version #:
      sandbox.stub(releasePR.gh, 'latestTag').returns(
        Promise.resolve({
          sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          name: 'v0.123.4',
          version: '0.123.4',
        })
      );

      // See if there are any release PRs already open, we do this as
      // we consider opening a new release-pr:
      sandbox
        .stub(releasePR.gh, 'findOpenReleasePRs')
        .returns(Promise.resolve([]));

      // Call made to close any stale release PRs still open on GitHub:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sandbox.stub(releasePR as any, 'closeStaleReleasePRs');

      const getFileContentsStub = sandbox.stub(
        releasePR.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      sandbox
        .stub(releasePR.gh, 'commitsSinceSha')
        .resolves([
          buildMockCommit('fix(automl): fixed a really bad bug'),
          buildMockCommit('feat(asset): added a really cool feature'),
          buildMockCommit('fix(pubsub): this commit should be included'),
          buildMockCommit(
            'fix(pubsub/pstest): this commit should also be included'
          ),
          buildMockCommit('fix: this commit should be included'),
          buildMockCommit(
            'feat(all): auto-regenerate discovery clients (#1000)'
          ),
          buildMockCommit(
            'feat(all): auto-regenerate discovery clients (#1001)\n\nCommit Body'
          ),
        ]);

      // Call to add autorelease: pending label:
      const addLabelStub = sandbox
        .stub(releasePR.gh, 'addLabels')
        .withArgs(['autorelease: pending'], 22)
        .resolves();

      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      snapshot(stringifyExpectedChanges(expectedChanges));
      expect(addLabelStub.callCount).to.eql(1);
    });
  });
  it('supports releasing submodule from google-cloud-go', async () => {
    const releasePR = new GoYoshi({
      repoUrl: 'googleapis/google-cloud-go',
      releaseType: 'yoshi-go',
      packageName: 'pubsublite',
      monorepoTags: true,
      path: 'pubsublite',
      apiUrl: 'https://api.github.com',
    });

    // We stub the entire suggester API, asserting only that the
    // the appropriate changes are proposed:
    let expectedChanges: [string, object][] = [];
    sandbox.replace(
      suggester,
      'createPullRequest',
      (_octokit, changes): Promise<number> => {
        expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
        return Promise.resolve(22);
      }
    );

    sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('master');

    // Indicates that there are no PRs currently waiting to be released:
    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Return latest tag used to determine next version #:
    sandbox.stub(releasePR.gh, 'latestTag').returns(
      Promise.resolve({
        sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
        name: 'v0.123.4',
        version: '0.123.4',
      })
    );

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    sandbox
      .stub(releasePR.gh, 'commitsSinceSha')
      .resolves([
        buildMockCommit('fix(automl): fixed a really bad bug'),
        buildMockCommit('feat(asset): added a really cool feature'),
        buildMockCommit('fix(pubsub): this commit should be ignored'),
        buildMockCommit('fix(pubsub/pstest): this commit should be ignored'),
        buildMockCommit('fix: this commit should be ignored'),
        buildMockCommit(
          'chore(all): auto-regenerate gapics (#1000)\n\nChanges:\n\nchore(automl): cleaned up a thing\n  PiperOrigin-RevId: 352834281\nfix(pubsublite): a minor issue\n  PiperOrigin-RevId: 352834283'
        ),
        buildMockCommit(
          'chore(all): auto-regenerate gapics (#1001)\n\nCommit Body\n\nChanges:\n\nfix(automl): fixed a minor thing\n  PiperOrigin-RevId: 352834280\nfeat(language): added a new one\n  PiperOrigin-RevId: 352834282'
        ),
        buildMockCommit('fix(pubsublite): start generating v1'),
      ]);

    // See if there are any release PRs already open, we do this as
    // we consider opening a new release-pr:
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    // Call made to close any stale release PRs still open on GitHub:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sandbox.stub(releasePR as any, 'closeStaleReleasePRs');

    // Call to add autorelease: pending label:
    const addLabelStub = sandbox
      .stub(releasePR.gh, 'addLabels')
      .withArgs(['autorelease: pending'], 22)
      .resolves();

    const pr = await releasePR.run();
    assert.strictEqual(pr, 22);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapshot(stringifyExpectedChanges(expectedChanges));
    expect(addLabelStub.callCount).to.eql(1);
  });
});
