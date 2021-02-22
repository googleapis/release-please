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
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {readPOJO, stubSuggesterWithSnapshot} from '../../helpers';
import * as nock from 'nock';
import {Helm} from '../../../src/releasers/helm';
import * as sinon from 'sinon';
import {GitHub} from '../../../src/github';
import {Commit} from '../../../src/graphql-to-commits';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/helm';

describe('Helm', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR', async function () {
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
        .stub(releasePR.gh, 'commitsSinceSha')
        .returns(Promise.resolve(readPOJO('commits-fix') as Commit[]));

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
        Object.assign(Error('not found'), {status: 404})
      );

      // Call to add autorelease: pending label:
      sandbox.stub(releasePR.gh, 'addLabels');

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      await releasePR.run();
    });
  });
});
