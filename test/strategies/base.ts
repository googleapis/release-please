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

import {describe, it, afterEach, beforeEach} from 'mocha';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {BaseStrategy} from '../../src/strategies/base';
import {Update} from '../../src/update';
import {GitHub} from '../../src/github';
import {PullRequestBody} from '../../src/util/pull-request-body';
import snapshot = require('snap-shot-it');
import {
  dateSafe,
  assertHasUpdate,
  buildMockConventionalCommit,
} from '../helpers';
import {GenericJson} from '../../src/updaters/generic-json';
import {Generic} from '../../src/updaters/generic';
import {GenericXml} from '../../src/updaters/generic-xml';
import {PomXml} from '../../src/updaters/java/pom-xml';
import {GenericYaml} from '../../src/updaters/generic-yaml';
import {GenericToml} from '../../src/updaters/generic-toml';
import {DEFAULT_RELEASE_PLEASE_MANIFEST} from '../../src/manifest';

const sandbox = sinon.createSandbox();

class TestStrategy extends BaseStrategy {
  async buildUpdates(): Promise<Update[]> {
    return [];
  }
}

describe('Strategy', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'base-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('should ignore empty commits', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: [],
      });
      expect(pullRequest).to.be.undefined;
    });
    it('allows overriding initial version', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const commits = buildMockConventionalCommit(
        'chore: initial commit\n\nRelease-As: 2.3.4'
      );
      const pullRequest = await strategy.buildReleasePullRequest({
        commits,
      });
      expect(pullRequest).to.not.be.undefined;
      expect(pullRequest?.version?.toString()).to.eql('2.3.4');
      snapshot(dateSafe(pullRequest!.body.toString()));
    });
    it('allows overriding initial version in base constructor', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        initialVersion: '0.1.0',
      });
      const commits = buildMockConventionalCommit('feat: initial commit');
      const pullRequest = await strategy.buildReleasePullRequest({
        commits,
      });
      expect(pullRequest).to.not.be.undefined;
      expect(pullRequest?.version?.toString()).to.eql('0.1.0');
      snapshot(dateSafe(pullRequest!.body.toString()));
    });
    it('updates extra files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: [
          'README.md',
          'build.gradle.kts',
          '0',
          'foo/1.~csv',
          'foo/2.bak',
          'foo/baz/bar/',
          '/3.java',
        ],
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: buildMockConventionalCommit('fix: a bugfix'),
        latestRelease: undefined,
      });
      expect(pullRequest).to.exist;
      expect(pullRequest?.updates).to.be.an('array');
      expect(pullRequest?.updates.map(update => update.path))
        .to.include.members([
          'README.md',
          'build.gradle.kts',
          '0',
          '3.java',
          'foo/1.~csv',
          'foo/2.bak',
          'foo/baz/bar',
        ])
        .and.not.include('foo/baz/bar/', 'expected file but got directory');
    });
    it('updates extra JSON files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['0', {type: 'json', path: '/3.json', jsonpath: '$.foo'}],
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: buildMockConventionalCommit('fix: a bugfix'),
        latestRelease: undefined,
      });
      expect(pullRequest).to.exist;
      const updates = pullRequest?.updates;
      expect(updates).to.be.an('array');
      assertHasUpdate(updates!, '0', Generic);
      assertHasUpdate(updates!, '3.json', GenericJson);
    });
    it('updates extra YAML files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['0', {type: 'yaml', path: '/3.yaml', jsonpath: '$.foo'}],
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: buildMockConventionalCommit('fix: a bugfix'),
        latestRelease: undefined,
      });
      expect(pullRequest).to.exist;
      const updates = pullRequest?.updates;
      expect(updates).to.be.an('array');
      assertHasUpdate(updates!, '0', Generic);
      assertHasUpdate(updates!, '3.yaml', GenericYaml);
    });
    it('updates extra TOML files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['0', {type: 'toml', path: '/3.toml', jsonpath: '$.foo'}],
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: buildMockConventionalCommit('fix: a bugfix'),
        latestRelease: undefined,
      });
      expect(pullRequest).to.exist;
      const updates = pullRequest?.updates;
      expect(updates).to.be.an('array');
      assertHasUpdate(updates!, '0', Generic);
      assertHasUpdate(updates!, '3.toml', GenericToml);
    });
    it('updates extra Xml files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['0', {type: 'xml', path: '/3.xml', xpath: '$.foo'}],
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: buildMockConventionalCommit('fix: a bugfix'),
        latestRelease: undefined,
      });
      expect(pullRequest).to.exist;
      const updates = pullRequest?.updates;
      expect(updates).to.be.an('array');
      assertHasUpdate(updates!, '0', Generic);
      assertHasUpdate(updates!, '3.xml', GenericXml);
    });
    it('updates extra pom.xml files', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: ['0', {type: 'pom', path: '/3.xml'}],
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: buildMockConventionalCommit('fix: a bugfix'),
        latestRelease: undefined,
      });
      expect(pullRequest).to.exist;
      const updates = pullRequest?.updates;
      expect(updates).to.be.an('array');
      assertHasUpdate(updates!, '0', Generic);
      assertHasUpdate(updates!, '3.xml', PomXml);
    });
    it('updates extra glob files', async () => {
      const findFilesStub = sandbox
        .stub(github, 'findFilesByGlobAndRef')
        .resolves(['3.xml']);
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraFiles: [
          '0',
          {
            type: 'xml',
            path: '**/*.xml',
            xpath: '//project/version',
            glob: true,
          },
        ],
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: buildMockConventionalCommit('fix: a bugfix'),
        latestRelease: undefined,
      });
      expect(pullRequest).to.exist;
      const updates = pullRequest?.updates;
      expect(updates).to.be.an('array');
      assertHasUpdate(updates!, '0', Generic);
      assertHasUpdate(updates!, '3.xml', GenericXml);
      sinon.assert.calledOnceWithExactly(findFilesStub, '**/*.xml', 'main');
    });
    it('should pass changelogHost to default buildNotes', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        changelogHost: 'https://example.com',
      });
      const commits = buildMockConventionalCommit('fix: a bugfix');
      const pullRequest = await strategy.buildReleasePullRequest({
        commits,
      });
      expect(pullRequest).to.exist;
      expect(pullRequest?.body.toString()).to.have.string(
        'https://example.com'
      );
      snapshot(dateSafe(pullRequest!.body.toString()));
    });
    it('rejects relative extra files', async () => {
      const extraFiles = [
        './bar',
        './../../../etc/hosts',
        '../../../../etc/hosts',
        '~/./5',
        '~/.ssh/config',
        '~/../../.././level/../../../up',
        '/../../../opt',
        'foo/bar/../baz',
        'foo/baz/../../../../../etc/hostname',
      ];
      for (const file of extraFiles) {
        try {
          const strategy = new TestStrategy({
            targetBranch: 'main',
            github,
            component: 'google-cloud-automl',
            extraFiles: [file],
          });
          await strategy.buildReleasePullRequest({
            commits: buildMockConventionalCommit('fix: a bugfix'),
            latestRelease: undefined,
          });
          expect.fail(`expected [addPath] to reject path: ${file}`);
        } catch (err) {
          expect(err).to.be.instanceof(Error);
          expect((err as Error).message).to.have.string(
            'illegal pathing characters in path'
          );
        }
      }
    });
    it('handles extra labels', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        extraLabels: ['foo', 'bar'],
      });
      const pullRequest = await strategy.buildReleasePullRequest({
        commits: buildMockConventionalCommit('fix: a bugfix'),
        latestRelease: undefined,
      });
      expect(pullRequest).to.exist;
      expect(pullRequest?.labels).to.eql(['foo', 'bar']);
    });
  });
  describe('buildRelease', () => {
    it('builds a release tag', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('google-cloud-automl-v1.2.3');
    });
    it('overrides the tag separator', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        tagSeparator: '/',
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('google-cloud-automl/v1.2.3');
    });
    it('skips component in release tag', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        includeComponentInTag: false,
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('v1.2.3');
    });
    it('skips v in release tag', async () => {
      const strategy = new TestStrategy({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
        includeComponentInTag: false,
        includeVInTag: false,
      });
      const release = await strategy.buildRelease({
        title: 'chore(main): release v1.2.3',
        headBranchName: 'release-please/branches/main',
        baseBranchName: 'main',
        number: 1234,
        body: new PullRequestBody([]).toString(),
        labels: [],
        files: [],
        sha: 'abc123',
      });
      expect(release, 'Release').to.not.be.undefined;
      expect(release!.tag.toString()).to.eql('1.2.3');
    });
  });
});
