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

import * as assert from 'assert';
import {describe, it, afterEach} from 'mocha';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {stringifyExpectedChanges, readPOJO} from '../../helpers';
import * as nock from 'nock';
import {Helm} from '../../../src/releasers/helm';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {GitHub} from '../../../src/github';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/helm';

describe('Helm', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR', async () => {
      const releasePR = new Helm({
        github: new GitHub({owner: 'abhinav-demo', repo: 'helm-test-repo'}),
        packageName: 'helm-test-repo',

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
        .stub(releasePR.gh as any, 'commitsSinceSha')
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

      const manifestContent = readFileSync(
        resolve(fixturesPath, 'Chart.yaml'),
        'utf8'
      );
      getFileContentsStub.withArgs('Chart.yaml', 'main').resolves({
        sha: 'abc123',
        content: Buffer.from(manifestContent, 'utf8').toString('base64'),
        parsedContent: manifestContent,
      });
      // CHANGELOG is not found, and will be created:
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404}));


      // We stub the entire suggester API, these updates are generally the
        // most interesting thing under test, as they represent the changes
        // that will be pushed up to GitHub:
        let expectedChanges: [string, object][] = [];
        sandbox.replace(
          suggester,
          'createPullRequest',
          (_octokit, changes): Promise<number> => {
            expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
            return Promise.resolve(22);
          }
        );

        // Call made to close any stale release PRs still open on GitHub:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sandbox.stub(releasePR as any, 'closeStaleReleasePRs');

        // Call to add autorelease: pending label:
        sandbox.stub(releasePR.gh, 'addLabels');

        await releasePR.run();

        // Did we generate all the changes to files we expected to?
        snapshot(stringifyExpectedChanges(expectedChanges));
      });
  });
});
