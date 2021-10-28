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
import {GoYoshi} from '../../src/releasers/go-yoshi';
import {readPOJO, stubSuggesterWithSnapshot} from '../helpers';
import * as nock from 'nock';
import * as sinon from 'sinon';
import assert = require('assert');
import {buildGitHubFileContent} from './utils';
import {GitHubFileContents, GitHub} from '../../src/github';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();

function buildFileContent(fixture: string): GitHubFileContents {
  return buildGitHubFileContent('./test/releasers/fixtures/go-yoshi', fixture);
}

describe('GoYoshi', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR', async function () {
      const releasePR = new GoYoshi({
        github: new GitHub({owner: 'googleapis', repo: 'google-cloud-go'}),
      });

      // Indicates that there are no PRs currently waiting to be released:
      sandbox
        .stub(releasePR.gh, 'findMergedReleasePR')
        .returns(Promise.resolve(undefined));

      // Return latest tag used to determine next version #:
      sandbox.stub(releasePR, 'latestTag').returns(
        Promise.resolve({
          sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          name: 'v0.123.4',
          version: '0.123.4',
        })
      );

      // Commits, used to build CHANGELOG, and propose next version bump:
      sandbox
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .stub(releasePR as any, 'commits')
        .returns(Promise.resolve(readPOJO('commits-fix')));

      // See if there are any release PRs already open, we do this as
      // we consider opening a new release-pr:
      sandbox
        .stub(releasePR.gh, 'findOpenReleasePRs')
        .returns(Promise.resolve([]));

      // Lookup the default branch name:
      sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('main');

      // Fetch files from GitHub, in prep to update with code-suggester:
      const getFileContentsStub = sandbox.stub(
        releasePR.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('version.go', 'master')
        .resolves(buildFileContent('version.go'));
      // CHANGELOG is not found, and will be created:
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      // Call to add autorelease: pending label:
      sandbox.stub(releasePR.gh, 'addLabels');

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const prNumber = await releasePR.run();
      assert.ok(prNumber);
    });

    describe('root package', () => {
      it('filters special commits by scope', async function () {
        const releasePR = new GoYoshi({
          github: new GitHub({owner: 'googleapis', repo: 'google-cloud-go'}),
        });

        // Indicates that there are no PRs currently waiting to be released:
        sandbox
          .stub(releasePR.gh, 'findMergedReleasePR')
          .returns(Promise.resolve(undefined));

        // Return latest tag used to determine next version #:
        sandbox.stub(releasePR, 'latestTag').returns(
          Promise.resolve({
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            name: 'v0.123.4',
            version: '0.123.4',
          })
        );

        // Commits, used to build CHANGELOG, and propose next version bump:
        sandbox
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .stub(releasePR as any, 'commits')
          .returns(Promise.resolve(readPOJO('commits-fix-scoped')));

        // See if there are any release PRs already open, we do this as
        // we consider opening a new release-pr:
        sandbox
          .stub(releasePR.gh, 'findOpenReleasePRs')
          .returns(Promise.resolve([]));

        // Lookup the default branch name:
        sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('main');

        // Fetch files from GitHub, in prep to update with code-suggester:
        const getFileContentsStub = sandbox.stub(
          releasePR.gh,
          'getFileContentsOnBranch'
        );
        getFileContentsStub
          .withArgs('version.go', 'master')
          .resolves(buildFileContent('version.go'));
        // CHANGELOG is not found, and will be created:
        getFileContentsStub.rejects(
          Object.assign(Error('not found'), {status: 404})
        );

        // Call to add autorelease: pending label:
        sandbox.stub(releasePR.gh, 'addLabels');

        stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
        const prNumber = await releasePR.run();
        assert.ok(prNumber);
      });

      it('should ignore Release-As for scoped commits', async function () {
        const releasePR = new GoYoshi({
          github: new GitHub({owner: 'googleapis', repo: 'google-cloud-go'}),
        });

        // Indicates that there are no PRs currently waiting to be released:
        sandbox
          .stub(releasePR.gh, 'findMergedReleasePR')
          .returns(Promise.resolve(undefined));

        // Return latest tag used to determine next version #:
        sandbox.stub(releasePR, 'latestTag').returns(
          Promise.resolve({
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            name: 'v0.123.4',
            version: '0.123.4',
          })
        );

        // Commits, used to build CHANGELOG, and propose next version bump:
        sandbox
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .stub(releasePR as any, 'commits')
          .returns(Promise.resolve(readPOJO('commits-release-as-scoped')));

        // See if there are any release PRs already open, we do this as
        // we consider opening a new release-pr:
        sandbox
          .stub(releasePR.gh, 'findOpenReleasePRs')
          .returns(Promise.resolve([]));

        // Lookup the default branch name:
        sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('main');

        // Fetch files from GitHub, in prep to update with code-suggester:
        const getFileContentsStub = sandbox.stub(
          releasePR.gh,
          'getFileContentsOnBranch'
        );
        // CHANGELOG is not found, and will be created:
        getFileContentsStub.rejects(
          Object.assign(Error('not found'), {status: 404})
        );

        // Call to add autorelease: pending label:
        sandbox.stub(releasePR.gh, 'addLabels');

        stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
        const prNumber = await releasePR.run();
        assert.ok(prNumber);
      });
    });

    describe('subpackage', () => {
      it('filters subpackage commits by scope', async function () {
        const releasePR = new GoYoshi({
          github: new GitHub({owner: 'googleapis', repo: 'google-cloud-go'}),
          packageName: 'storage',
          monorepoTags: true,
        });

        // Indicates that there are no PRs currently waiting to be released:
        sandbox
          .stub(releasePR.gh, 'findMergedReleasePR')
          .returns(Promise.resolve(undefined));

        // Return latest tag used to determine next version #:
        sandbox.stub(releasePR, 'latestTag').returns(
          Promise.resolve({
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            name: 'v0.123.4',
            version: '0.123.4',
          })
        );

        // Commits, used to build CHANGELOG, and propose next version bump:
        sandbox
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .stub(releasePR as any, 'commits')
          .returns(Promise.resolve(readPOJO('commits-fix-scoped')));

        // See if there are any release PRs already open, we do this as
        // we consider opening a new release-pr:
        sandbox
          .stub(releasePR.gh, 'findOpenReleasePRs')
          .returns(Promise.resolve([]));

        // Lookup the default branch name:
        sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('main');

        // Fetch files from GitHub, in prep to update with code-suggester:
        const getFileContentsStub = sandbox.stub(
          releasePR.gh,
          'getFileContentsOnBranch'
        );
        getFileContentsStub
          .withArgs('storage/version.go', 'master')
          .resolves(buildFileContent('version.go'));
        // CHANGELOG is not found, and will be created:
        getFileContentsStub.rejects(
          Object.assign(Error('not found'), {status: 404})
        );

        // Call to add autorelease: pending label:
        sandbox.stub(releasePR.gh, 'addLabels');

        stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
        const prNumber = await releasePR.run();
        assert.ok(prNumber);
      });
    });
  });
});
