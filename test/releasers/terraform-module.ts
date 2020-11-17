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
import {stringifyExpectedChanges, readPOJO} from '../helpers';
import * as nock from 'nock';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/terraform';
const releasePR = new TerraformModule({
  repoUrl: 'googleapis/terraform-test-repo',
  releaseType: 'terraform-module',
  // not actually used by this type of repo.
  packageName: 'terraform-test-repo',
  apiUrl: 'https://api.github.com',
});

describe('terraform-module', () => {
  const tests = [
    {
      // simple-module with module versions defined
      name: 'simple-module',
      findVersionFiles: ['versions.tf'],
      readFilePaths: ['simple-module/readme.md', 'simple-module/versions.tf'],
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
      readFilePaths: [
        'module-submodule/readme.md',
        'module-submodule/versions.tf',
        'module-submodule/modules/sub-module-with-version/versions.tf',
      ],
    },
    {
      // module-no-versions with no module versions defined in versions.tf
      name: 'module-no-versions',
      findVersionFiles: [],
      readFilePaths: ['module-no-versions/readme.md'],
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
      it(`creates a release PR for ${test.name}`, async () => {
        sandbox
          .stub(releasePR.gh, 'findFilesByFilename')
          .returns(Promise.resolve(test.findVersionFiles));

        // Return latest tag used to determine next version #:
        sandbox.stub(releasePR.gh, 'latestTag').returns(
          Promise.resolve({
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            name: 'v2.1.0',
            version: '2.1.0',
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
          console.log(readFilePath);
          const fileContent = readFileSync(
            resolve(fixturesPath, readFilePath),
            'utf8'
          );
          console.log(fileContent);
          getFileContentsStub.onCall(count + 1).resolves({
            sha: 'abc123',
            content: Buffer.from(fileContent, 'utf8').toString('base64'),
            parsedContent: fileContent,
          });
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
});
