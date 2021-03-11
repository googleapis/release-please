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
import {Ruby} from '../../src';

const sandbox = sinon.createSandbox();

function stubFilesToUpdate(github: GitHub, files: string[]) {
  stubFilesFromFixtures({
    fixturePath: './test/updaters/fixtures',
    sandbox,
    github,
    files,
  });
}

const LATEST_TAG = {
  name: 'v0.5.0',
  sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
  version: '0.5.0',
};

const COMMITS = [
  buildMockCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
  buildMockCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
  ),
  buildMockCommit('chore: update common templates'),
];

function stubGithub(
  releasePR: Ruby,
  commits = COMMITS,
  latestTag = LATEST_TAG
) {
  sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('master');
  // No open release PRs, so create a new release PR
  sandbox.stub(releasePR.gh, 'findOpenReleasePRs').returns(Promise.resolve([]));
  sandbox
    .stub(releasePR.gh, 'findMergedReleasePR')
    .returns(Promise.resolve(undefined));
  sandbox.stub(releasePR, 'latestTag').resolves(latestTag);
  sandbox.stub(releasePR.gh, 'commitsSinceSha').resolves(commits);
  sandbox.stub(releasePR.gh, 'addLabels');
}

describe('Ruby', () => {
  afterEach(() => {
    sandbox.restore();
  });
  const pkgName = 'google-cloud-automl';

  describe('run', () => {
    it('creates a release PR with defaults', async function () {
      const releasePR = new Ruby({
        versionFile: 'version.rb',
        github: new GitHub({owner: 'googleapis', repo: 'ruby-test-repo'}),
        packageName: pkgName,
      });

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      stubGithub(releasePR);
      stubFilesToUpdate(releasePR.gh, ['version.rb']);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
    });

    it('creates a release PR relative to a path', async function () {
      const releasePR = new Ruby({
        github: new GitHub({owner: 'googleapis', repo: 'ruby-test-repo'}),
        packageName: pkgName,
        path: 'projects/ruby',
      });

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      stubGithub(releasePR);
      stubFilesToUpdate(releasePR.gh, ['version.rb']);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
    });

    it('creates a release PR with custom config', async function () {
      const releasePR = new Ruby({
        github: new GitHub({owner: 'googleapis', repo: 'ruby-test-repo'}),
        packageName: pkgName,
        path: 'projects/ruby',
        bumpMinorPreMajor: true,
        monorepoTags: true,
        changelogPath: 'HISTORY.md',
      });

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const commits = [buildMockCommit('feat!: still no major version')];
      commits.push(...COMMITS);
      const latestTag = {...LATEST_TAG};
      latestTag.name = pkgName + '/v' + latestTag.version;
      stubGithub(releasePR, commits, latestTag);
      stubFilesToUpdate(releasePR.gh, ['projects/ruby/version.rb']);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
    });
  });
});
