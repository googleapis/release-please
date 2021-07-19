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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {KRMBlueprint} from '../../src/releasers/krm-blueprint';
import {readFileSync} from 'fs';
import {resolve, join} from 'path';
import {readPOJO, stubSuggesterWithSnapshot} from '../helpers';
import * as nock from 'nock';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {getFilesInDirWithPrefix} from './utils';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/krm';
const releasePR = new KRMBlueprint({
  github: new GitHub({owner: 'googleapis', repo: 'blueprints'}),
});

describe('krm-blueprints', () => {
  const tests = [
    {
      // simple-pkg with single yaml
      name: 'simple-pkg',
      expectedVersion: '12.1.0',
    },
    {
      // nested-pkg with multiple yamls
      name: 'nested-pkg',
      expectedVersion: '3.0.0',
    },
  ];
  beforeEach(() => {
    // Indicates that there are no PRs currently waiting to be released:
    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));
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
  });

  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    tests.forEach(test => {
      it(`creates a release PR for ${test.name}`, async function () {
        // get yaml files in test fixture dir
        const fixtureFiles = getFilesInDirWithPrefix(
          resolve(fixturesPath, test.name),
          'yaml'
        );
        sandbox
          .stub(releasePR.gh, 'findFilesByExtension')
          .onFirstCall()
          .returns(Promise.resolve(fixtureFiles));

        // Return latest tag used to determine next version #:
        sandbox.stub(releasePR, 'latestTag').returns(
          Promise.resolve({
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            name: `v${test.expectedVersion}`,
            version: test.expectedVersion,
          })
        );

        // Fetch files from GitHub, in prep to update with code-suggester:
        const getFileContentsStub = sandbox.stub(
          releasePR.gh,
          'getFileContentsOnBranch'
        );
        // CHANGELOG is not found, and will be created:
        getFileContentsStub.rejects(
          Object.assign(Error('not found'), {status: 404})
        );

        fixtureFiles.forEach(p => {
          const readFilePath = join(test.name, p);
          const fileContent = readFileSync(
            resolve(fixturesPath, readFilePath),
            'utf8'
          ).replace(/\r\n/g, '\n');
          getFileContentsStub.withArgs(p, 'main').resolves({
            sha: 'abc123',
            content: Buffer.from(fileContent, 'utf8').toString('base64'),
            parsedContent: fileContent,
          });
        });

        // Call to add autorelease: pending label:
        sandbox.stub(releasePR.gh, 'addLabels');

        stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
        await releasePR.run();
      });
    });
  });
});
