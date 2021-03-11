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
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {Python} from '../../src/releasers/python';
import * as snapshot from 'snap-shot-it';
import * as sinon from 'sinon';
import {stubFilesFromFixtures} from './utils';
import {buildMockCommit, dateSafe, stubSuggesterWithSnapshot} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {SetupCfg} from '../../src/updaters/python/setup-cfg';
import {SetupPy} from '../../src/updaters/python/setup-py';
import {VersionPy} from '../../src/updaters/python/version-py';

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
  name: 'v0.123.4',
  sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
  version: '0.123.4',
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
  releasePR: Python,
  versionFiles: string[] = [],
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
  sandbox.stub(releasePR.gh, 'findFilesByFilename').resolves(versionFiles);
}

describe('Python', () => {
  afterEach(() => {
    sandbox.restore();
  });
  const pkgName = 'google-cloud-automl';
  describe('getOpenPROptions', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.1.0';
      const releasePR = new Python({
        github: new GitHub({owner: 'googleapis', repo: 'py-test-repo'}),
        packageName: pkgName,
      });
      stubGithub(releasePR, ['src/version.py']);

      // no latestTag to pass to getOpenPROptions (never found a release)
      // releaser should set defaultInitialVersion
      const openPROptions = await releasePR.getOpenPROptions(COMMITS);

      expect(openPROptions).to.not.be.undefined;
      expect(openPROptions).to.have.property('sha').equal(COMMITS[0].sha);
      expect(openPROptions).to.have.property('version').equal(expectedVersion);
      expect(openPROptions).to.have.property('includePackageName').to.be.false;
      expect(openPROptions).to.have.property('changelogEntry');

      snapshot(dateSafe(openPROptions!.changelogEntry));

      const perUpdateChangelog = openPROptions!.changelogEntry.substring(
        0,
        openPROptions!.changelogEntry.length - 5 // no trailing "\n---\n"
      );
      expect(openPROptions)
        .to.have.property('updates')
        .to.eql([
          new Changelog({
            path: 'CHANGELOG.md',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new SetupCfg({
            path: 'setup.cfg',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new SetupPy({
            path: 'setup.py',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new VersionPy({
            path: 'src/version.py',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
        ]);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const releasePR = new Python({
        github: new GitHub({owner: 'googleapis', repo: 'py-test-repo'}),
        packageName: pkgName,
      });
      stubGithub(releasePR, ['src/version.py']);

      // found last release (LATEST_TAG) so releaser should semver bump.
      const openPROptions = await releasePR.getOpenPROptions(
        COMMITS,
        LATEST_TAG
      );

      expect(openPROptions).to.not.be.undefined;
      expect(openPROptions).to.have.property('sha').equal(COMMITS[0].sha);
      expect(openPROptions).to.have.property('version').equal(expectedVersion);
      expect(openPROptions).to.have.property('includePackageName').to.be.false;
      expect(openPROptions).to.have.property('changelogEntry');

      snapshot(dateSafe(openPROptions!.changelogEntry));

      const perUpdateChangelog = openPROptions!.changelogEntry.substring(
        0,
        openPROptions!.changelogEntry.length - 5 // no trailing "\n---\n"
      );
      expect(openPROptions)
        .to.have.property('updates')
        .to.eql([
          new Changelog({
            path: 'CHANGELOG.md',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new SetupCfg({
            path: 'setup.cfg',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new SetupPy({
            path: 'setup.py',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new VersionPy({
            path: 'src/version.py',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
        ]);
    });
    it('returns undefined for no CC changes', async () => {
      const releasePR = new Python({
        github: new GitHub({owner: 'googleapis', repo: 'py-test-repo'}),
        packageName: pkgName,
      });
      stubGithub(releasePR);
      const openPROptions = await releasePR.getOpenPROptions(
        [buildMockCommit('chore: update common templates')],
        LATEST_TAG
      );
      expect(openPROptions).to.be.undefined;
    });
  });

  describe('run', () => {
    // normally you'd only have your version in one location
    // e.g. setup.py or setup.cfg or src/version.py, not all 3!
    // just testing the releaser does try to update all 3.
    it('creates a release PR with defaults', async function () {
      const releasePR = new Python({
        github: new GitHub({owner: 'googleapis', repo: 'py-test-repo'}),
        packageName: pkgName,
      });

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      stubGithub(releasePR, ['src/version.py']);
      stubFilesToUpdate(releasePR.gh, [
        'setup.py',
        'src/version.py',
        'setup.cfg',
      ]);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
    });

    it('creates a release PR relative to a path', async function () {
      const releasePR = new Python({
        github: new GitHub({owner: 'googleapis', repo: 'py-test-repo'}),
        packageName: pkgName,
        path: 'projects/python',
      });

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      stubGithub(releasePR, ['src/version.py']);
      stubFilesToUpdate(releasePR.gh, [
        'projects/python/setup.py',
        'projects/python/src/version.py',
        'projects/python/setup.cfg',
      ]);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
    });

    it('creates a release PR with custom config', async function () {
      const releasePR = new Python({
        github: new GitHub({owner: 'googleapis', repo: 'py-test-repo'}),
        packageName: pkgName,
        path: 'projects/python',
        bumpMinorPreMajor: true,
        monorepoTags: true,
        changelogPath: 'HISTORY.md',
      });

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const commits = [buildMockCommit('feat!: still no major version')];
      commits.push(...COMMITS);
      const latestTag = {...LATEST_TAG};
      latestTag.name = pkgName + '-v' + latestTag.version;
      stubGithub(releasePR, ['src/version.py'], commits, latestTag);
      stubFilesToUpdate(releasePR.gh, [
        'projects/python/setup.py',
        'projects/python/src/version.py',
        'projects/python/setup.cfg',
      ]);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
    });
  });
});
