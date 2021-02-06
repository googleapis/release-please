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
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {stubFilesFromFixtures} from './utils';
import {buildMockCommit} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {SetupCfg} from '../../src/updaters/python/setup-cfg';
import {SetupPy} from '../../src/updaters/python/setup-py';
import {VersionPy} from '../../src/updaters/python/version-py';

const sandbox = sinon.createSandbox();

function stubFilesToUpdate(gh: GitHub, files: string[]) {
  stubFilesFromFixtures('./test/updaters/fixtures/', sandbox, gh, files);
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

function stubGithub(releasePR: Python, versionFiles: string[] = []) {
  sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('master');
  // No open release PRs, so create a new release PR
  sandbox.stub(releasePR.gh, 'findOpenReleasePRs').returns(Promise.resolve([]));
  sandbox
    .stub(releasePR.gh, 'findMergedReleasePR')
    .returns(Promise.resolve(undefined));
  sandbox.stub(releasePR.gh, 'latestTag').resolves(LATEST_TAG);
  sandbox.stub(releasePR.gh, 'commitsSinceSha').resolves(COMMITS);
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
        repoUrl: 'googleapis/py-test-repo',
        releaseType: 'python',
        packageName: pkgName,
        apiUrl: 'https://api.github.com',
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

      const normalizedChangelog = openPROptions!.changelogEntry.replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10'
      );
      const expectedChangelog = `
## ${expectedVersion} (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/${COMMITS[1].sha}))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/${COMMITS[0].sha}))
---
`.substring(1); // leading \n is aesthetic
      expect(normalizedChangelog).to.equal(expectedChangelog);

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
        repoUrl: 'googleapis/py-test-repo',
        releaseType: 'python',
        packageName: pkgName,
        apiUrl: 'https://api.github.com',
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

      const normalizedChangelog = openPROptions!.changelogEntry.replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10'
      );
      const expectedChangelog = `
### [${expectedVersion}](https://www.github.com/googleapis/py-test-repo/compare/v0.123.4...v${expectedVersion}) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/py-test-repo/commit/${COMMITS[1].sha}))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/py-test-repo/commit/${COMMITS[0].sha}))
---
`.substring(1); // leading \n is aesthetic
      expect(normalizedChangelog).to.equal(expectedChangelog);

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
        repoUrl: 'googleapis/py-test-repo',
        releaseType: 'python',
        packageName: pkgName,
        apiUrl: 'https://api.github.com',
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
    it('creates a release PR', async () => {
      const releasePR = new Python({
        repoUrl: 'googleapis/py-test-repo',
        releaseType: 'python',
        packageName: pkgName,
        apiUrl: 'https://api.github.com',
      });

      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      stubGithub(releasePR, ['src/version.py']);
      stubFilesToUpdate(releasePR.gh, [
        'setup.py',
        'src/version.py',
        'setup.cfg',
      ]);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('creates a release PR relative to a path', async () => {
      const releasePR = new Python({
        repoUrl: 'googleapis/py-test-repo',
        releaseType: 'python',
        packageName: pkgName,
        apiUrl: 'https://api.github.com',
        path: 'projects/python',
      });

      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      stubGithub(releasePR, ['src/version.py']);
      stubFilesToUpdate(releasePR.gh, [
        'projects/python/setup.py',
        'projects/python/src/version.py',
        'projects/python/setup.cfg',
      ]);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });
  });
});
