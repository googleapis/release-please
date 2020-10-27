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

import {describe, it, afterEach} from 'mocha';
import {Simple} from '../../src/releasers/simple';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {stringifyExpectedChanges, readPOJO} from '../helpers';
import * as nock from 'nock';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/simple';

describe('Simple', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR', async () => {
      const releasePR = new Simple({
        repoUrl: 'googleapis/simple-test-repo',
        releaseType: 'simple',
        // not actually used by this type of repo.
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
      });

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
      // CHANGELOG is not found, and will be created:
      getFileContentsStub
        .onCall(0)
        .rejects(Object.assign(Error('not found'), {status: 404}));
      // A version.txt exists already:
      const versionContent = readFileSync(
        resolve(fixturesPath, 'version.txt'),
        'utf8'
      );
      getFileContentsStub.onCall(1).resolves({
        sha: 'abc123',
        content: Buffer.from(versionContent, 'utf8').toString('base64'),
        parsedContent: versionContent,
      });

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
