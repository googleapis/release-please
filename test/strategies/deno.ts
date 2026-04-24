// Copyright 2025 Google LLC
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
import {Deno} from '../../src/strategies/deno';
import {
  buildMockConventionalCommit,
  buildGitHubFileContent,
  assertHasUpdate,
  assertNoHasUpdate,
} from '../helpers';
import * as nock from 'nock';
import * as sinon from 'sinon';
import {GitHub} from '../../src/github';
import {Version} from '../../src/version';
import {TagName} from '../../src/util/tag-name';
import {expect} from 'chai';
import {Changelog} from '../../src/updaters/changelog';
import {DenoJson} from '../../src/updaters/deno/deno-json';
import {ChangelogJson} from '../../src/updaters/changelog-json';
import * as assert from 'assert';
import {MissingRequiredFileError, FileNotFoundError} from '../../src/errors';
import * as snapshot from 'snap-shot-it';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/strategies/deno';

const UUID_REGEX =
  /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
const ISO_DATE_REGEX =
  /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g; // 2023-01-05T16:42:33.446Z

const stubFileContent = (
  stub: sinon.SinonStub,
  file: string,
  branch = 'main'
) => {
  stub
    .withArgs(file, branch)
    .resolves(buildGitHubFileContent(fixturesPath, file));
};

describe('Deno', () => {
  let github: GitHub;
  let getFileContentsStub: sinon.SinonStub;
  const commits = [
    ...buildMockConventionalCommit(
      'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
    ),
  ];
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'deno-test-repo',
      defaultBranch: 'main',
    });
    getFileContentsStub = sandbox.stub(github, 'getFileContentsOnBranch');
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '1.0.0';
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        packageName: 'google-cloud-automl',
      });
      const latestRelease = undefined;
      stubFileContent(getFileContentsStub, 'deno.json');
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
    it('builds a release pull request', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'some-deno-package',
        packageName: 'some-deno-package',
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'some-deno-package'),
        sha: 'abc123',
        notes: 'some notes',
      };
      stubFileContent(getFileContentsStub, 'deno.json');
      const pullRequest = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
    });
    it('detects a default component', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Deno({
        targetBranch: 'main',
        github,
      });
      const commits = [
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
        ),
      ];
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'deno-test-repo'),
        sha: 'abc123',
        notes: 'some notes',
      };
      stubFileContent(getFileContentsStub, 'deno.json');
      const pullRequest = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
    });
    it('detects a default packageName', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'abc-123',
      });
      const commits = [
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
        ),
      ];
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'deno-test-repo'),
        sha: 'abc123',
        notes: 'some notes',
      };
      stubFileContent(getFileContentsStub, 'deno.json');
      const pullRequest = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      expect(pullRequest!.version?.toString()).to.eql(expectedVersion);
    });
    it('handles missing deno.json', async () => {
      getFileContentsStub.rejects(new FileNotFoundError('stub/path'));
      const strategy = new Deno({
        targetBranch: 'main',
        github,
      });
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'some-deno-package'),
        sha: 'abc123',
        notes: 'some notes',
      };
      assert.rejects(async () => {
        await strategy.buildReleasePullRequest(commits, latestRelease);
      }, MissingRequiredFileError);
    });
    it('updates changelog.json if present', async () => {
      const COMMITS = [
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
        ),
        ...buildMockConventionalCommit('chore: update deps'),
        ...buildMockConventionalCommit('chore!: update a very important dep'),
        ...buildMockConventionalCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
        ),
        ...buildMockConventionalCommit('chore: update common templates'),
      ];
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'google-cloud-deno',
      });
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      stubFileContent(getFileContentsStub, 'changelog.json');
      stubFileContent(getFileContentsStub, 'deno.json');
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest(
        COMMITS,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      const update = assertHasUpdate(updates, 'changelog.json', ChangelogJson);
      const newContent = update.updater.updateContent(
        JSON.stringify({entries: []})
      );
      snapshot(
        newContent
          .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
          .replace(UUID_REGEX, 'abc-123-efd-qwerty')
          .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z')
      );
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        packageName: 'google-cloud-automl-pkg',
      });
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      stubFileContent(getFileContentsStub, 'deno.json');
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
      assertHasUpdate(updates, 'deno.json', DenoJson);
    });

    it('omits changelog if skipChangelog=true', async () => {
      const strategy = new Deno({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        packageName: 'google-cloud-automl-pkg',
        skipChangelog: true,
      });
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      stubFileContent(getFileContentsStub, 'deno.json');
      const release = await strategy.buildReleasePullRequest(
        commits,
        latestRelease
      );
      const updates = release!.updates;
      assertNoHasUpdate(updates, 'CHANGELOG.md');
      assertHasUpdate(updates, 'deno.json', DenoJson);
    });
  });
});
