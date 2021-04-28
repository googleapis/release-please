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
import * as sinon from 'sinon';
import {buildGitHubFileContent, buildGitHubFileRaw} from './utils';
import {buildMockCommit, dateSafe, stubSuggesterWithSnapshot} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {PackageJson} from '../../src/updaters/package-json';
import {PackageLockJson} from '../../src/updaters/package-lock-json';
import {SamplesPackageJson} from '../../src/updaters/samples-package-json';
import {basename} from 'path';

const sandbox = sinon.createSandbox();

const LATEST_SHA = 'da6e52d956c1e35d19e75e0f2fdba439739ba364';
const LATEST_TAG = {
  name: 'v0.123.4',
  sha: LATEST_SHA,
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

function mockGithub(options: {
  github: GitHub;
  fixtures: string[];
  notFound: string[];
  branchComponent?: string;
}) {
  const {github, fixtures, notFound, branchComponent} = options;
  const mock = sandbox.mock(github);
  mock.expects('getRepositoryDefaultBranch').atMost(1).resolves('master');
  // No open release PRs, so create a new release PR
  mock
    .expects('findOpenReleasePRs')
    .withExactArgs(['autorelease: pending'])
    // once in openPR and once again in closeStaleReleasePRs
    .atMost(2)
    .resolves([]);
  mock.expects('findMergedReleasePR').atMost(1).resolves(undefined);
  let headRefName = 'release-';
  if (branchComponent) {
    headRefName += branchComponent;
  }
  headRefName += '-v0.123.4';
  mock
    .expects('mergeCommitIterator')
    .atMost(1)
    .returns(
      (async function* () {
        yield {
          commit: {
            sha: LATEST_SHA,
            message: '',
            files: [],
          },
          pullRequest: {
            sha: LATEST_SHA,
            number: 22,
            baseRefName: 'master',
            headRefName: headRefName,
            labels: [],
            title: '',
            body: '',
          },
        };
      })()
    );
  mock
    .expects('commitsSinceSha')
    .withArgs(LATEST_SHA)
    .atMost(1)
    .resolves(COMMITS);
  mock
    .expects('addLabels')
    .withExactArgs(['autorelease: pending'], 22)
    .atMost(1)
    .resolves(true);

  if (fixtures.length !== 0) {
    for (const fixture of fixtures) {
      mock
        .expects('getFileContentsOnBranch')
        .withExactArgs(fixture, 'master')
        .once()
        .resolves(
          buildGitHubFileContent(
            './test/releasers/fixtures/node',
            basename(fixture)
          )
        );
    }
  }
  if (notFound.length !== 0) {
    for (const file of notFound) {
      if (fixtures.includes(file)) {
        continue;
      }
      mock
        .expects('getFileContentsOnBranch')
        .withExactArgs(file, 'master')
        .once()
        .rejects(Object.assign(Error('not found'), {status: 404}));
    }
  }
  return mock;
}

describe('Node', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('getOpenPROptions', () => {
    const testDefaultInitialVersion = [
      {version: '1.0.0', bumpMinorPreMajor: false},
      {version: '0.1.0', bumpMinorPreMajor: true},
    ];
    testDefaultInitialVersion.forEach(element => {
      it(
        `returns release PR changes with defaultInitialVersion ${element.version}, ` +
          `when bumpMinorPreMajor is ${element.bumpMinorPreMajor}`,
        async () => {
          const expectedVersion = element.version;
          const pkgName = 'node-test-repo';
          const github = new GitHub({
            owner: 'googleapis',
            repo: 'node-test-repo',
          });
          const mock = mockGithub({
            github,
            fixtures: ['package.json'],
            notFound: [],
          });
          const releasePR = new Node({
            github,
            bumpMinorPreMajor: element.bumpMinorPreMajor,
          });

          // no latestTag to pass to getOpenPROptions (never found a release)
          // releaser should set defaultInitialVersion
          const openPROptions = await releasePR.getOpenPROptions(COMMITS);

          mock.verify();
          expect(openPROptions).to.not.be.undefined;
          expect(openPROptions).to.have.property('sha').equal(COMMITS[0].sha);
          expect(openPROptions)
            .to.have.property('version')
            .equal(expectedVersion);
          expect(openPROptions).to.have.property('includePackageName').to.be
            .false;
          expect(openPROptions).to.have.property('changelogEntry');

          snapshot(dateSafe(openPROptions!.changelogEntry));

          const perUpdateChangelog = openPROptions!.changelogEntry.substring(
            0,
            openPROptions!.changelogEntry.length - 5 // no trailing "\n---\n"
          );
          expect(openPROptions)
            .to.have.property('updates')
            .to.eql([
              new PackageLockJson({
                path: 'package-lock.json',
                changelogEntry: perUpdateChangelog,
                version: expectedVersion,
                packageName: pkgName,
              }),
              new PackageLockJson({
                path: 'npm-shrinkwrap.json',
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
                contents: buildGitHubFileContent(
                  './test/releasers/fixtures/node',
                  'package.json'
                ),
              }),
            ]);
        }
      );
    });

    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const pkgName = 'node-test-repo';
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const mock = mockGithub({
        github,
        fixtures: ['package.json'],
        notFound: [],
      });
      const releasePR = new Node({github});

      // found last release (LATEST_TAG) so releaser should semver bump.
      const openPROptions = await releasePR.getOpenPROptions(
        COMMITS,
        LATEST_TAG
      );

      mock.verify();
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
          new PackageJson({
            path: 'package-lock.json',
            changelogEntry: perUpdateChangelog,
            version: expectedVersion,
            packageName: pkgName,
          }),
          new PackageLockJson({
            path: 'npm-shrinkwrap.json',
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
            contents: buildGitHubFileContent(
              './test/releasers/fixtures/node',
              'package.json'
            ),
          }),
        ]);
    });
    it('returns undefined for no CC changes', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const mock = mockGithub({github, fixtures: [], notFound: []});
      const releasePR = new Node({github});

      const openPROptions = await releasePR.getOpenPROptions(
        [buildMockCommit('chore: update common templates')],
        LATEST_TAG
      );

      mock.verify();
      expect(openPROptions).to.be.undefined;
    });
  });
  describe('run', () => {
    it('creates a release PR without package-lock.json', async function () {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const mock = mockGithub({
        github,
        fixtures: ['package.json'],
        notFound: [
          'package-lock.json',
          'npm-shrinkwrap.json',
          'samples/package.json',
          'CHANGELOG.md',
        ],
      });
      const releasePR = new Node({github});
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const pr = await releasePR.run();
      mock.verify();
      assert.strictEqual(pr, 22);
    });

    it('creates a release PR with package-lock.json', async function () {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const mock = mockGithub({
        github,
        fixtures: ['package.json', 'package-lock.json'],
        notFound: [
          'samples/package.json',
          'npm-shrinkwrap.json',
          'CHANGELOG.md',
        ],
      });
      const releasePR = new Node({github});
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      await releasePR.run();
      mock.verify();
    });

    it('creates a release PR with npm-shrinkwrap.json', async function () {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const mock = mockGithub({
        github,
        fixtures: ['package.json', 'npm-shrinkwrap.json'],
        notFound: ['samples/package.json', 'package-lock.json', 'CHANGELOG.md'],
      });
      const releasePR = new Node({github});
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      await releasePR.run();
      mock.verify();
    });

    it('creates release PR relative to a path', async function () {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const mock = mockGithub({
        github,
        fixtures: ['packages/foo/package.json'],
        notFound: [
          'packages/foo/package-lock.json',
          'packages/foo/npm-shrinkwrap.json',
          'packages/foo/samples/package.json',
          'packages/foo/CHANGELOG.md',
        ],
      });
      const releasePR = new Node({github, path: 'packages/foo'});

      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      await releasePR.run();
      mock.verify();
    });

    it('does not support snapshot releases', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const mock = mockGithub({github, fixtures: [], notFound: []});
      const releasePR = new Node({github, snapshot: true});
      const pr = await releasePR.run();
      mock.verify();
      assert.strictEqual(pr, undefined);
    });

    it('uses detected package name in branch', async function () {
      const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
      const mock = mockGithub({
        github,
        fixtures: ['package.json'],
        notFound: [
          'package-lock.json',
          'npm-shrinkwrap.json',
          'samples/package.json',
          'CHANGELOG.md',
        ],
        branchComponent: 'node-test-repo',
      });
      const releasePR = new Node({github, monorepoTags: true});
      stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
      const pr = await releasePR.run();
      mock.verify();
      assert.strictEqual(pr, 22);
    });
  });

  describe('getPackageName', () => {
    for (const packageName of ['@over/write-me', undefined]) {
      it(
        'finds package name in package.json using ' +
          `packageName input option: ${packageName}`,
        async () => {
          const github = new GitHub({
            owner: 'googleapis',
            repo: 'node-test-repo',
          });
          const mock = sandbox.mock(github);
          mock.expects('getDefaultBranch').once().resolves('main');
          mock
            .expects('getFileContentsOnBranch')
            .withExactArgs('package.json', 'main')
            .once()
            .resolves(buildGitHubFileRaw('{"name":"@google-cloud/pkg-name"}'));
          const node = new Node({github, packageName});
          const expectedPackageName = await node.getPackageName();
          expect(expectedPackageName.name).to.equal('@google-cloud/pkg-name');
          expect(expectedPackageName.getComponent()).to.equal('pkg-name');
        }
      );
    }
  });
});
