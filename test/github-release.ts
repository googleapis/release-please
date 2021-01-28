// Copyright 2019 Google LLC
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

import * as sinon from 'sinon';
import {describe, it, afterEach} from 'mocha';
import {expect} from 'chai';
import * as nock from 'nock';
import * as crypto from 'crypto';
import {strictEqual} from 'assert';
nock.disableNetConnect();

import {GitHubRelease} from '../src/github-release';
import {GitHubFileContents} from '../src/github';

const sandbox = sinon.createSandbox();

function buildFileContent(content: string): GitHubFileContents {
  return {
    content: Buffer.from(content, 'utf8').toString('base64'),
    parsedContent: content,
    // fake a consistent sha
    sha: crypto.createHash('md5').update(content).digest('hex'),
  };
}

describe('GitHubRelease', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('createRelease', () => {
    it('creates and labels release on GitHub', async () => {
      const release = new GitHubRelease({
        label: 'autorelease: pending',
        repoUrl: 'googleapis/foo',
        packageName: 'foo',
        apiUrl: 'https://api.github.com',
      });

      sandbox.stub(release.gh, 'getDefaultBranch').resolves('main');

      sandbox.stub(release.gh, 'findMergedPullRequests').resolves([
        {
          sha: 'abc123',
          number: 1,
          baseRefName: 'main',
          headRefName: 'release-v1.0.3',
          labels: ['autorelease: pending'],
          title: 'Release v1.0.3',
          body: 'Some release notes',
        },
      ]);

      sandbox
        .stub(release.gh, 'getFileContentsOnBranch')
        .withArgs('CHANGELOG.md', 'main')
        .resolves(buildFileContent('#Changelog\n\n## v1.0.3\n\n* entry'));

      sandbox
        .stub(release.gh, 'createRelease')
        .withArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
        });

      sandbox
        .stub(release.gh, 'addLabels')
        .withArgs(['autorelease: tagged'], 1)
        .resolves();

      sandbox
        .stub(release.gh, 'removeLabels')
        .withArgs(['autorelease: pending'], 1)
        .resolves();

      const created = await release.createRelease();
      strictEqual(created!.tag_name, 'v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, false);
    });

    it('creates a draft release', async () => {
      const release = new GitHubRelease({
        label: 'autorelease: pending',
        repoUrl: 'googleapis/foo',
        packageName: 'foo',
        apiUrl: 'https://api.github.com',
        draft: true,
      });

      sandbox.stub(release.gh, 'getDefaultBranch').resolves('main');

      sandbox.stub(release.gh, 'findMergedPullRequests').resolves([
        {
          sha: 'abc123',
          number: 1,
          baseRefName: 'main',
          headRefName: 'release-v1.0.3',
          labels: ['autorelease: pending'],
          title: 'Release v1.0.3',
          body: 'Some release notes',
        },
      ]);

      sandbox
        .stub(release.gh, 'getFileContentsOnBranch')
        .withArgs('CHANGELOG.md', 'main')
        .resolves(buildFileContent('#Changelog\n\n## v1.0.3\n\n* entry'));

      sandbox
        .stub(release.gh, 'createRelease')
        .withArgs('foo', 'v1.0.3', 'abc123', '\n* entry', true)
        .resolves({
          tag_name: 'v1.0.3',
          draft: true,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
        });

      sandbox
        .stub(release.gh, 'addLabels')
        .withArgs(['autorelease: tagged'], 1)
        .resolves();

      sandbox
        .stub(release.gh, 'removeLabels')
        .withArgs(['autorelease: pending'], 1)
        .resolves();

      const created = await release.createRelease();
      strictEqual(created!.tag_name, 'v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, true);
    });

    it('creates releases for submodule in monorepo', async () => {
      const release = new GitHubRelease({
        label: 'autorelease: pending',
        repoUrl: 'googleapis/foo',
        packageName: 'bigquery',
        path: 'bigquery',
        monorepoTags: true,
        releaseType: 'go-yoshi',
        apiUrl: 'https://api.github.com',
        changelogPath: 'CHANGES.md',
      });

      sandbox.stub(release.gh, 'getDefaultBranch').resolves('main');

      sandbox.stub(release.gh, 'findMergedPullRequests').resolves([
        {
          sha: 'abc123',
          number: 1,
          baseRefName: 'main',
          headRefName: 'release-bigquery-v1.0.3',
          labels: ['autorelease: pending'],
          title: 'Release bigquery v1.0.3',
          body: 'Some release notes',
        },
      ]);

      sandbox
        .stub(release.gh, 'getFileContentsOnBranch')
        .withArgs('bigquery/CHANGES.md', 'main')
        .resolves(buildFileContent('#Changelog\n\n## v1.0.3\n\n* entry'));

      sandbox
        .stub(release.gh, 'createRelease')
        .withArgs('bigquery', 'bigquery/v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          tag_name: 'bigquery/v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
        });

      sandbox
        .stub(release.gh, 'addLabels')
        .withArgs(['autorelease: tagged'], 1)
        .resolves();

      sandbox
        .stub(release.gh, 'removeLabels')
        .withArgs(['autorelease: pending'], 1)
        .resolves();

      const created = await release.createRelease();
      expect(created).to.not.be.undefined;
      strictEqual(created!.tag_name, 'bigquery/v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
    });

    it('supports submodules in nested folders', async () => {
      const release = new GitHubRelease({
        path: 'src/apis/foo',
        label: 'autorelease: pending',
        repoUrl: 'googleapis/foo',
        packageName: 'foo',
        monorepoTags: true,
        releaseType: 'go-yoshi',
        apiUrl: 'https://api.github.com',
        changelogPath: 'CHANGES.md',
      });

      sandbox.stub(release.gh, 'getDefaultBranch').resolves('main');

      sandbox.stub(release.gh, 'findMergedPullRequests').resolves([
        {
          sha: 'abc123',
          number: 1,
          baseRefName: 'main',
          headRefName: 'release-foo-v1.0.3',
          labels: ['autorelease: pending'],
          title: 'Release foo v1.0.3',
          body: 'Some release notes',
        },
      ]);

      sandbox
        .stub(release.gh, 'getFileContentsOnBranch')
        .withArgs('src/apis/foo/CHANGES.md', 'main')
        .resolves(buildFileContent('#Changelog\n\n## v1.0.3\n\n* entry'));

      sandbox
        .stub(release.gh, 'createRelease')
        .withArgs('foo', 'foo/v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          tag_name: 'foo/v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
        });

      sandbox
        .stub(release.gh, 'addLabels')
        .withArgs(['autorelease: tagged'], 1)
        .resolves();

      sandbox
        .stub(release.gh, 'removeLabels')
        .withArgs(['autorelease: pending'], 1)
        .resolves();

      const created = await release.createRelease();
      strictEqual(created!.tag_name, 'foo/v1.0.3');
    });

    it('attempts to guess package name for submodule release', async () => {
      const release = new GitHubRelease({
        path: 'src/apis/foo',
        label: 'autorelease: pending',
        repoUrl: 'googleapis/foo',
        apiUrl: 'https://api.github.com',
        monorepoTags: true,
        releaseType: 'node',
      });

      sandbox.stub(release.gh, 'getDefaultBranch').resolves('main');

      sandbox.stub(release.gh, 'findMergedPullRequests').resolves([
        {
          sha: 'abc123',
          number: 1,
          baseRefName: 'main',
          headRefName: 'release-foo-v1.0.3',
          labels: ['autorelease: pending'],
          title: 'Release bigquery v1.0.3',
          body: 'Some release notes',
        },
      ]);

      const getFileContentsStub = sandbox.stub(
        release.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('src/apis/foo/CHANGELOG.md', 'main')
        .resolves(buildFileContent('#Changelog\n\n## v1.0.3\n\n* entry'));
      getFileContentsStub
        .withArgs('src/apis/foo/package.json', 'main')
        .resolves(buildFileContent('{"name": "@google-cloud/foo"}'));
      getFileContentsStub.throwsArg(0);

      sandbox
        .stub(release.gh, 'createRelease')
        .withArgs('foo', 'foo-v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          tag_name: 'foo-v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
        });

      sandbox
        .stub(release.gh, 'addLabels')
        .withArgs(['autorelease: tagged'], 1)
        .resolves();

      sandbox
        .stub(release.gh, 'removeLabels')
        .withArgs(['autorelease: pending'], 1)
        .resolves();

      const created = await release.createRelease();
      expect(created).to.not.be.undefined;
      strictEqual(created!.tag_name, 'foo-v1.0.3');
    });

    it('attempts to guess package name for release', async () => {
      const release = new GitHubRelease({
        label: 'autorelease: pending',
        repoUrl: 'googleapis/foo',
        apiUrl: 'https://api.github.com',
        releaseType: 'node',
      });

      sandbox.stub(release.gh, 'getDefaultBranch').resolves('main');

      sandbox.stub(release.gh, 'findMergedPullRequests').resolves([
        {
          sha: 'abc123',
          number: 1,
          baseRefName: 'main',
          headRefName: 'release-v1.0.3',
          labels: ['autorelease: pending'],
          title: 'Release v1.0.3',
          body: 'Some release notes',
        },
      ]);

      const getFileContentsStub = sandbox.stub(
        release.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('CHANGELOG.md', 'main')
        .resolves(buildFileContent('#Changelog\n\n## v1.0.3\n\n* entry'));
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(buildFileContent('{"name": "@google-cloud/foo"}'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      sandbox
        .stub(release.gh, 'createRelease')
        .withArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
        });

      sandbox
        .stub(release.gh, 'addLabels')
        .withArgs(['autorelease: tagged'], 1)
        .resolves();

      sandbox
        .stub(release.gh, 'removeLabels')
        .withArgs(['autorelease: pending'], 1)
        .resolves();

      const created = await release.createRelease();
      strictEqual(created!.tag_name, 'v1.0.3');
    });

    it('errors when no packageName (no lookupPackageName impl: python)', async () => {
      const release = new GitHubRelease({
        label: 'autorelease: pending',
        repoUrl: 'googleapis/foo',
        apiUrl: 'https://api.github.com',
        releaseType: 'python',
      });
      let failed = true;
      try {
        await release.createRelease();
        failed = false;
      } catch (error) {
        expect(error.message).to.equal(
          'could not determine package name for release repo = googleapis/foo'
        );
      }
      expect(failed).to.be.true;
    });

    it('errors when no packageName (lookupPackageName impl: node)', async () => {
      const release = new GitHubRelease({
        label: 'autorelease: pending',
        repoUrl: 'googleapis/foo',
        apiUrl: 'https://api.github.com',
        releaseType: 'node',
      });

      sandbox.stub(release.gh, 'getDefaultBranch').resolves('main');

      sandbox.stub(release.gh, 'findMergedPullRequests').resolves([
        {
          sha: 'abc123',
          number: 1,
          baseRefName: 'main',
          headRefName: 'release-v1.0.3',
          labels: ['autorelease: pending'],
          title: 'Release v1.0.3',
          body: 'Some release notes',
        },
      ]);

      const getFileContentsStub = sandbox.stub(
        release.gh,
        'getFileContentsOnBranch'
      );
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(buildFileContent('{"no-the-name": "@google-cloud/foo"}'));
      getFileContentsStub
        .withArgs('CHANGELOG.md', 'main')
        .resolves(buildFileContent('#Changelog\n\n## v1.0.3\n\n* entry'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      let failed = true;
      try {
        await release.createRelease();
        failed = false;
      } catch (error) {
        expect(error.message).to.equal(
          'could not determine package name for release repo = googleapis/foo'
        );
      }
      expect(failed).to.be.true;
    });
  });
});
