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
import {TerraformModule} from '../../src/releasers/terraform-module';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {readPOJO, stubSuggesterWithSnapshot} from '../helpers';
import * as nock from 'nock';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/terraform';
const releasePR = new TerraformModule({
  github: new GitHub({owner: 'googleapis', repo: 'terraform-test-repo'}),
});

describe('terraform-module', () => {
  const tests = [
    {
      // simple-module with module versions defined
      name: 'simple-module',
      findVersionFiles: ['versions.tf'],
      findTemplatedVersionFiles: ['versions.tf.tmpl'],
      findReadmeFiles: ['readme.md'],
      readFilePaths: [
        'simple-module/readme.md',
        'simple-module/versions.tf',
        'simple-module/versions.tf.tmpl',
      ],
      expectedVersion: '12.1.0',
    },
    {
      // module-submodule with submodules
      // sub-module-with-version has module versions defined
      // sub-module-missing-versions has no versions.tf
      name: 'module-submodule',
      findVersionFiles: [
        'versions.tf',
        'modules/sub-module-with-version/versions.tf',
      ],
      findTemplatedVersionFiles: [],
      findReadmeFiles: [
        'README.md',
        'modules/sub-module-with-version/readme.md',
        'modules/sub-module-missing-versions/README.md',
      ],
      readFilePaths: [
        'module-submodule/README.md',
        'module-submodule/modules/sub-module-with-version/readme.md',
        'module-submodule/modules/sub-module-missing-versions/README.md',
        'module-submodule/versions.tf',
        'module-submodule/modules/sub-module-with-version/versions.tf',
      ],
      expectedVersion: '2.1.0',
    },
    {
      // module-no-versions with no module versions defined in versions.tf
      name: 'module-no-versions',
      findVersionFiles: [],
      findTemplatedVersionFiles: [],
      findReadmeFiles: ['module-no-versions/README.MD'],
      readFilePaths: ['module-no-versions/README.MD'],
      expectedVersion: '2.1.0',
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
        sandbox
          .stub(releasePR.gh, 'findFilesByFilename')
          .onFirstCall()
          .returns(Promise.resolve(test.findReadmeFiles))
          .onSecondCall()
          .returns(Promise.resolve(test.findVersionFiles))
          .onThirdCall()
          .returns(Promise.resolve(test.findTemplatedVersionFiles));

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
        getFileContentsStub
          .onCall(0)
          .rejects(Object.assign(Error('not found'), {status: 404}));

        test.readFilePaths.forEach((readFilePath, count) => {
          const fileContent = readFileSync(
            resolve(fixturesPath, readFilePath),
            'utf8'
          ).replace(/\r\n/g, '\n');
          getFileContentsStub.onCall(count + 1).resolves({
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
