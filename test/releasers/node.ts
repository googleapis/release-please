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

import * as assert from 'assert';
import {describe, it, afterEach} from 'mocha';
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {Node} from '../../src/releasers/node';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {stubFilesFromFixtures} from './utils';
import {buildMockCommit} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {PackageJson} from '../../src/updaters/package-json';
import {SamplesPackageJson} from '../../src/updaters/samples-package-json';

const sandbox = sinon.createSandbox();

function stubFilesToUpdate(gh: GitHub, files: string[]) {
  stubFilesFromFixtures('./test/releasers/fixtures/node', sandbox, gh, files);
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

function mockRequest(releasePR: Node) {
  sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('master');

  // No open release PRs, so create a new release PR
  sandbox.stub(releasePR.gh, 'findOpenReleasePRs').returns(Promise.resolve([]));

  sandbox
    .stub(releasePR.gh, 'findMergedReleasePR')
    .returns(Promise.resolve(undefined));

  sandbox.stub(releasePR.gh, 'latestTag').resolves(LATEST_TAG);

  sandbox.stub(releasePR.gh, 'commitsSinceSha').resolves(COMMITS);

  sandbox.stub(releasePR.gh, 'addLabels');
}

describe('Node', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('getOpenPROptions', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const pkgName = 'node-test-repo';
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        apiUrl: 'https://api.github.com',
      });
      mockRequest(releasePR);
      // this stub is required only because Node lookupPackageName calls
      // getFileContentsOnBranch('package.json'). Otherwise this test
      // doesn't rely on getting the contents of each Update file.
      stubFilesToUpdate(releasePR.gh, ['package.json']);

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

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/${COMMITS[1].sha}))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/${COMMITS[0].sha}))
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
          new PackageJson({
            path: 'package-lock.json',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new SamplesPackageJson({
            path: 'samples/package.json',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new Changelog({
            path: 'CHANGELOG.md',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new PackageJson({
            path: 'package.json',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
        ]);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const pkgName = 'node-test-repo';
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        apiUrl: 'https://api.github.com',
      });
      mockRequest(releasePR);
      // this stub is required only because Node lookupPackageName calls
      // getFileContentsOnBranch('package.json'). Otherwise this test
      // doesn't rely on getting the contents of each Update file.
      stubFilesToUpdate(releasePR.gh, ['package.json']);

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
### [${expectedVersion}](https://www.github.com/googleapis/node-test-repo/compare/v0.123.4...v${expectedVersion}) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([08ca011](https://www.github.com/googleapis/node-test-repo/commit/${COMMITS[1].sha}))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([845db13](https://www.github.com/googleapis/node-test-repo/commit/${COMMITS[0].sha}))
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
          new PackageJson({
            path: 'package-lock.json',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new SamplesPackageJson({
            path: 'samples/package.json',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new Changelog({
            path: 'CHANGELOG.md',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new PackageJson({
            path: 'package.json',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
        ]);
    });
    it('returns undefined for no CC changes', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'python',
        apiUrl: 'https://api.github.com',
      });
      mockRequest(releasePR);
      // this stub is required only because Node lookupPackageName calls
      // getFileContentsOnBranch('package.json'). Otherwise this test
      // doesn't rely on getting the contents of each Update file.
      stubFilesToUpdate(releasePR.gh, ['package.json']);

      const openPROptions = await releasePR.getOpenPROptions(
        [buildMockCommit('chore: update common templates')],
        LATEST_TAG
      );

      expect(openPROptions).to.be.undefined;
    });
  });
  describe('run', () => {
    it('creates a release PR without package-lock.json', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-testno-package-lock-repo',
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
      mockRequest(releasePR);
      stubFilesToUpdate(releasePR.gh, ['package.json']);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('creates a release PR with package-lock.json', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
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

      mockRequest(releasePR);
      stubFilesToUpdate(releasePR.gh, ['package.json', 'package-lock.json']);
      await releasePR.run();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('creates release PR relative to a path', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
        path: 'packages/foo',
      });

      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      mockRequest(releasePR);
      stubFilesToUpdate(releasePR.gh, [
        'packages/foo/package.json',
        'package-lock.json',
      ]);
      await releasePR.run();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('does not support snapshot releases', async () => {
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-test-repo',
        apiUrl: 'https://api.github.com',
        snapshot: true,
      });
      const pr = await releasePR.run();
      assert.strictEqual(pr, undefined);
    });

    it('uses detected package name in branch', async () => {
      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      let expectedBranch = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes, options): Promise<number> => {
          expectedBranch = options.branch;
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      const releasePR = new Node({
        repoUrl: 'googleapis/node-test-repo',
        releaseType: 'node',
        // not actually used by this type of repo.
        packageName: 'node-testno-package-lock-repo',
        apiUrl: 'https://api.github.com',
        monorepoTags: true,
      });
      mockRequest(releasePR);

      stubFilesToUpdate(releasePR.gh, ['package.json']);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
      expect(expectedBranch).to.eql('release-node-test-repo-v0.123.5');
    });
  });

  describe('lookupPackageName', () => {
    it('finds package name in package.json', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});

      sandbox.stub(github, 'getDefaultBranch').resolves('master');
      stubFilesToUpdate(github, ['package.json']);

      const expectedPackageName = await Node.lookupPackageName(github);
      expect(expectedPackageName).to.equal('node-test-repo');
    });

    it('finds package name in submodule package.json', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});

      sandbox.stub(github, 'getDefaultBranch').resolves('master');
      stubFilesToUpdate(github, ['some-path/package.json']);

      const expectedPackageName = await Node.lookupPackageName(
        github,
        'some-path'
      );
      expect(expectedPackageName).to.equal('node-test-repo');
    });
  });

  describe('coercePackagePrefix', () => {
    it('should parse out the @scope', () => {
      const inputs = ['@foo/bar', '@foo-baz/bar'];
      inputs.forEach(input => {
        const releasePR = new Node({
          packageName: input,
          repoUrl: 'owner/repo',
          apiUrl: 'unused',
          releaseType: 'node',
        });
        expect(releasePR.packagePrefix).to.eql('bar');
      });
    });
    it('should default to the package name', () => {
      const inputs = ['foo/bar', 'foobar', ''];
      inputs.forEach(input => {
        const releasePR = new Node({
          packageName: input,
          repoUrl: 'owner/repo',
          apiUrl: 'unused',
          releaseType: 'node',
        });
        expect(releasePR.packagePrefix).to.eql(input);
      });
    });
  });
});
