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
import {GitHub} from '../../src/github';
import * as sinon from 'sinon';
import {stubFilesFromFixtures} from './utils';
import {buildMockCommit, stubSuggesterWithSnapshot} from '../helpers';
import {RubyYoshi} from '../../src/releasers/ruby-yoshi';

const sandbox = sinon.createSandbox();

function stubFilesToUpdate(github: GitHub, files: string[]) {
  stubFilesFromFixtures({
    fixturePath: './test/updaters/fixtures',
    sandbox,
    github,
    files,
  });
}

const TAG_SHA = 'da6e52d956c1e35d19e75e0f2fdba439739ba364';

const COMMITS = [
  buildMockCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
  buildMockCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
  ),
  buildMockCommit('chore: update common templates'),
];

function stubGithub(releasePR: RubyYoshi) {
  sandbox
    .stub(releasePR.gh, 'findMergedReleasePR')
    .returns(Promise.resolve(undefined));
  sandbox.stub(releasePR.gh, 'findOpenReleasePRs').returns(Promise.resolve([]));
  sandbox.stub(releasePR.gh, 'openPR').resolves(22);
  sandbox.stub(releasePR.gh, 'addLabels');
  sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('master');
}

describe('RubyYoshi', () => {
  afterEach(() => {
    sandbox.restore();
  });
  const pkgName = 'google-cloud-automl';

  describe('run', () => {
    it('creates a release PR with a previous release', async function () {
      const releasePR = new RubyYoshi({
        github: new GitHub({owner: 'googleapis', repo: 'ruby-test-repo'}),
        versionFile: 'version.rb',
        bumpMinorPreMajor: true,
        monorepoTags: true,
        packageName: pkgName,
        lastPackageVersion: '0.5.0',
      });

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      stubGithub(releasePR);
      sandbox.stub(releasePR.gh, 'getTagSha').resolves(TAG_SHA);
      sandbox.stub(releasePR.gh, 'commitsSinceSha').resolves(COMMITS);
      stubFilesToUpdate(releasePR.gh, ['version.rb']);

      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
    });

    it('creates a release PR with no previous release', async function () {
      const releasePR = new RubyYoshi({
        github: new GitHub({owner: 'googleapis', repo: 'ruby-test-repo'}),
        versionFile: 'version.rb',
        bumpMinorPreMajor: true,
        monorepoTags: true,
        packageName: pkgName,
      });

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      stubGithub(releasePR);
      sandbox.stub(releasePR.gh, 'commitsSinceSha').resolves(COMMITS);
      stubFilesToUpdate(releasePR.gh, ['version.rb']);

      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
    });
  });
});
