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
import {buildMockCommit, dateSafe, stringifyExpectedChanges} from '../helpers';
import {Changelog} from '../../src/updaters/changelog';
import {PackageJson} from '../../src/updaters/package-json';
import {SamplesPackageJson} from '../../src/updaters/samples-package-json';
import {
  FileData,
  CreatePullRequestUserOptions,
} from 'code-suggester/build/src/types';
import {Octokit} from '@octokit/rest';

const sandbox = sinon.createSandbox();

function stubFilesToUpdate(github: GitHub, files: string[]) {
  stubFilesFromFixtures({
    fixturePath: './test/releasers/fixtures/node',
    sandbox,
    github,
    files,
  });
}

let expectedChanges: [string, FileData][] = [];
let expectedOptions: CreatePullRequestUserOptions = {} as CreatePullRequestUserOptions;

function replaceSuggester() {
  sandbox.replace(
    suggester,
    'createPullRequest',
    (
      _octokit: Octokit,
      changes: suggester.Changes | null | undefined,
      options: CreatePullRequestUserOptions
    ): Promise<number> => {
      expectedChanges = [...changes!]; // Convert map to key/value pairs.
      expectedOptions = options;
      return Promise.resolve(22);
    }
  );
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

  sandbox.stub(releasePR, 'latestTag').resolves(LATEST_TAG);

  sandbox.stub(releasePR.gh, 'commitsSinceSha').resolves(COMMITS);

  sandbox.stub(releasePR.gh, 'addLabels');
}

describe('Node', () => {
  afterEach(() => {
    expectedChanges = [];
    expectedOptions = {} as CreatePullRequestUserOptions;
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
          const releasePR = new Node({
            github: new GitHub({owner: 'googleapis', repo: 'node-test-repo'}),
            bumpMinorPreMajor: element.bumpMinorPreMajor,
          });
          mockRequest(releasePR);
          // for Node.getPackageName
          stubFilesToUpdate(releasePR.gh, ['package.json']);

          // no latestTag to pass to getOpenPROptions (never found a release)
          // releaser should set defaultInitialVersion
          const openPROptions = await releasePR.getOpenPROptions(COMMITS);

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
        }
      );
    });

    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const pkgName = 'node-test-repo';
      const releasePR = new Node({
        github: new GitHub({owner: 'googleapis', repo: 'node-test-repo'}),
      });
      mockRequest(releasePR);
      // for Node.getPackageName
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
        github: new GitHub({owner: 'googleapis', repo: 'node-test-repo'}),
      });
      mockRequest(releasePR);
      // for Node.getPackageName
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
        github: new GitHub({owner: 'googleapis', repo: 'node-test-repo'}),
      });

      replaceSuggester();
      mockRequest(releasePR);
      stubFilesToUpdate(releasePR.gh, ['package.json']);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      snapshot(stringifyExpectedChanges(expectedChanges));
    });

    it('creates a release PR with package-lock.json', async () => {
      const releasePR = new Node({
        github: new GitHub({owner: 'googleapis', repo: 'node-test-repo'}),
      });

      replaceSuggester();
      mockRequest(releasePR);
      stubFilesToUpdate(releasePR.gh, ['package.json', 'package-lock.json']);
      await releasePR.run();
      snapshot(stringifyExpectedChanges(expectedChanges));
    });

    it('creates release PR relative to a path', async () => {
      const releasePR = new Node({
        github: new GitHub({owner: 'googleapis', repo: 'node-test-repo'}),
        path: 'packages/foo',
      });

      replaceSuggester();
      mockRequest(releasePR);
      stubFilesToUpdate(releasePR.gh, [
        'packages/foo/package.json',
        'package-lock.json',
      ]);
      await releasePR.run();
      snapshot(stringifyExpectedChanges(expectedChanges));
    });

    it('does not support snapshot releases', async () => {
      const releasePR = new Node({
        github: new GitHub({owner: 'googleapis', repo: 'node-test-repo'}),
        snapshot: true,
      });
      const pr = await releasePR.run();
      assert.strictEqual(pr, undefined);
    });

    it('uses detected package name in branch', async () => {
      const releasePR = new Node({
        github: new GitHub({owner: 'googleapis', repo: 'node-test-repo'}),
        monorepoTags: true,
      });
      mockRequest(releasePR);

      replaceSuggester();
      stubFilesToUpdate(releasePR.gh, ['package.json']);
      const pr = await releasePR.run();
      assert.strictEqual(pr, 22);
      snapshot(stringifyExpectedChanges(expectedChanges));
      expect(expectedOptions.branch).to.eql('release-node-test-repo-v0.123.5');
    });
  });

  describe('getPackageName', () => {
    const github = new GitHub({owner: 'googleapis', repo: 'node-test-repo'});
    sandbox.stub(github, 'getDefaultBranch').resolves('main');
    const stubPkgJson = (node: Node, pkgName: string) => {
      const content = JSON.stringify({name: pkgName});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sandbox.stub(node, 'getPkgJsonContents' as any).resolves({
        sha: 'abc123',
        content: Buffer.from(content, 'utf8').toString('base64'),
        parsedContent: content,
      });
    };

    it('finds package name in package.json', async () => {
      const node = new Node({github});
      const refSafePkgName = 'pkg-name';
      const pkgName = `@google-cloud/${refSafePkgName}`;
      stubPkgJson(node, pkgName);
      const packageName = await node.getPackageName();
      expect(packageName.name).to.equal(pkgName);
      expect(packageName.getComponent()).to.equal(refSafePkgName);
    });

    it('pkgjson name overwrites input packageName', async () => {
      const node = new Node({github, packageName: '@over/write-me'});
      const refSafePkgName = 'pkg-name';
      const pkgName = `@google-cloud/${refSafePkgName}`;
      stubPkgJson(node, pkgName);
      const packageName = await node.getPackageName();
      expect(packageName.name).to.equal(pkgName);
      expect(packageName.getComponent()).to.equal(refSafePkgName);
    });
  });
});
