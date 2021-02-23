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
import {GitHubFileContents, GitHub} from '../src/github';
import {ReleasePR, JavaYoshi} from '../src';
import {GoYoshi} from '../src/releasers/go-yoshi';
import {Node} from '../src/releasers/node';

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
  const stubDefaultBranch = (github: GitHub) => {
    sandbox.stub(github, 'getDefaultBranch').resolves('main');
  };

  const stubPRs = (github: GitHub, head: string, title: string) => {
    sandbox.stub(github, 'findMergedPullRequests').resolves([
      {
        sha: 'abc123',
        number: 1,
        baseRefName: 'main',
        headRefName: head,
        labels: ['autorelease: pending'],
        title: title,
        body: 'Some release notes',
      },
    ]);
  };

  const stubChangeLog = (
    github: GitHub,
    file = 'CHANGELOG.md',
    version = '1.0.3'
  ): sinon.SinonStub => {
    const stub = sandbox.stub(github, 'getFileContentsOnBranch');
    stub
      .withArgs(file, 'main')
      .resolves(buildFileContent(`#Changelog\n\n## v${version}\n\n* entry`));
    return stub;
  };

  const stubCommentsAndLabels = (github: GitHub) => {
    sandbox
      .stub(github, 'commentOnIssue')
      .withArgs(':robot: Release is at https://release.url :sunflower:', 1)
      .resolves();

    sandbox
      .stub(github, 'addLabels')
      .withArgs(['autorelease: tagged'], 1)
      .resolves();

    sandbox.stub(github, 'removeLabels').withArgs(['autorelease: pending'], 1);
  };

  describe('createRelease', () => {
    it('creates and labels release on GitHub', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-v1.0.3', 'Release v1.0.3');
      stubChangeLog(github);
      stubCommentsAndLabels(github);
      sandbox
        .stub(github, 'createRelease')
        .withArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          name: 'foo v1.0.3',
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const releaser = new GitHubRelease({github, releasePR});
      const created = await releaser.run();

      strictEqual(created!.name, 'foo v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, false);
    });

    it('creates and labels release on GitHub with invalid semver', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-v1A.B.C', 'Release v1A.B.C');
      stubChangeLog(github, 'CHANGELOG.md', '1A.B.C');
      stubCommentsAndLabels(github);
      sandbox
        .stub(github, 'createRelease')
        .withArgs('foo', 'v1A.B.C', 'abc123', '\n* entry', false)
        .resolves({
          name: 'foo v1A.B.C',
          tag_name: 'v1A.B.C',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const releaser = new GitHubRelease({github, releasePR});
      const created = await releaser.run();

      expect(created).to.be.undefined;
    });

    it('creates a draft release', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-v1.0.3', 'Release v1.0.3');
      stubChangeLog(github);
      stubCommentsAndLabels(github);
      sandbox
        .stub(github, 'createRelease')
        .withArgs('foo', 'v1.0.3', 'abc123', '\n* entry', true)
        .resolves({
          name: 'foo v1.0.3',
          tag_name: 'v1.0.3',
          draft: true,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const releaser = new GitHubRelease({github, releasePR, draft: true});
      const created = await releaser.run();

      strictEqual(created!.draft, true);
    });

    it('creates releases for submodule in monorepo', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-bigquery-v1.0.3', 'Release bigquery v1.0.3');
      stubChangeLog(github, 'bigquery/CHANGES.md');
      stubCommentsAndLabels(github);
      sandbox
        .stub(github, 'createRelease')
        .withArgs('bigquery', 'bigquery/v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          name: 'bigquery bigquery/v1.0.3',
          tag_name: 'bigquery/v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const releasePR = new GoYoshi({
        github,
        path: 'bigquery',
        packageName: 'bigquery',
        monorepoTags: true,
        changelogPath: 'CHANGES.md',
      });
      const release = new GitHubRelease({
        github,
        releasePR,
      });
      const created = await release.run();

      expect(created).to.not.be.undefined;
      strictEqual(created!.name, 'bigquery bigquery/v1.0.3');
      strictEqual(created!.tag_name, 'bigquery/v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
    });

    it('supports submodules in nested folders', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-foo-v1.0.3', 'Release foo v1.0.3');
      stubChangeLog(github, 'src/apis/foo/CHANGES.md');
      stubCommentsAndLabels(github);
      sandbox
        .stub(github, 'createRelease')
        .withArgs('foo', 'foo/v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          name: 'foo foo/v1.0.3',
          tag_name: 'foo/v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const releasePR = new GoYoshi({
        github,
        path: 'src/apis/foo',
        packageName: 'foo',
        monorepoTags: true,
        changelogPath: 'CHANGES.md',
      });
      const release = new GitHubRelease({
        github,
        releasePR,
      });
      const created = await release.run();

      strictEqual(created!.name, 'foo foo/v1.0.3');
      strictEqual(created!.tag_name, 'foo/v1.0.3');
    });

    it('attempts to guess package name for submodule release', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-foo-v1.0.3', 'Release foo v1.0.3');
      stubCommentsAndLabels(github);
      const getFileContentsStub = stubChangeLog(
        github,
        'src/apis/foo/CHANGELOG.md'
      );
      getFileContentsStub
        .withArgs('src/apis/foo/package.json', 'main')
        .resolves(buildFileContent('{"name": "@google-cloud/foo"}'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );
      sandbox
        .stub(github, 'createRelease')
        .withArgs(
          '@google-cloud/foo',
          'foo-v1.0.3',
          'abc123',
          '\n* entry',
          false
        )
        .resolves({
          name: '@google-cloud/foo foo-v1.0.3',
          tag_name: 'foo-v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const releasePR = new Node({
        github,
        path: 'src/apis/foo',
        monorepoTags: true,
      });
      const release = new GitHubRelease({github, releasePR});
      const created = await release.run();

      expect(created).to.not.be.undefined;
      strictEqual(created!.name, '@google-cloud/foo foo-v1.0.3');
      strictEqual(created!.tag_name, 'foo-v1.0.3');
    });

    it('attempts to guess package name for release', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-v1.0.3', 'Release v1.0.3');
      stubCommentsAndLabels(github);
      const getFileContentsStub = stubChangeLog(github);
      getFileContentsStub
        .withArgs('package.json', 'main')
        .resolves(buildFileContent('{"name": "@google-cloud/foo"}'));
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );
      sandbox
        .stub(github, 'createRelease')
        .withArgs('@google-cloud/foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          name: '@google-cloud/foo v1.0.3',
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const releasePR = new Node({github});
      const release = new GitHubRelease({github, releasePR});
      const created = await release.run();

      strictEqual(created!.name, '@google-cloud/foo v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
    });

    it('empty packageName ok (non-monorepo)', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-v1.0.3', 'Release v1.0.3');
      stubChangeLog(github);
      stubCommentsAndLabels(github);
      sandbox
        .stub(github, 'createRelease')
        .withArgs('', 'v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          name: 'v1.0.3',
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const releasePR = new ReleasePR({github});
      const releaser = new GitHubRelease({github, releasePR});
      const created = await releaser.run();

      strictEqual(created!.name, 'v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
    });

    it('empty packageName not ok (monorepo)', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      stubDefaultBranch(github);
      stubPRs(github, 'release-v1.0.3', 'Release v1.0.3');
      stubChangeLog(github);
      stubCommentsAndLabels(github);
      const releasePR = new ReleasePR({github, monorepoTags: true});
      const release = new GitHubRelease({github, releasePR});
      let failed = true;
      try {
        await release.run();
        failed = false;
      } catch (error) {
        expect(error.message).to.equal(
          'package-name required for monorepo releases'
        );
      }
      expect(failed).to.be.true;
    });

    it('parses version from PR title (detectReleaseVersionFromTitle impl: base)', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});

      stubDefaultBranch(github);
      stubPRs(github, 'release-please/branches/main', 'chore: release 1.0.3');
      stubChangeLog(github);
      stubCommentsAndLabels(github);

      sandbox
        .stub(github, 'createRelease')
        .withArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          name: 'foo v1.0.3',
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const created = await release.run();
      expect(created).to.not.be.undefined;
      strictEqual(created!.name, 'foo v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, false);
    });

    it('parses version from PR title (detectReleaseVersionFromTitle impl: java-yoshi)', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const releasePR = new JavaYoshi({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});

      stubDefaultBranch(github);
      stubPRs(
        github,
        'release-please/branches/main',
        'chore(main): release 1.0.3'
      );
      stubChangeLog(github);
      stubCommentsAndLabels(github);

      sandbox
        .stub(github, 'createRelease')
        .withArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          name: 'foo v1.0.3',
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const created = await release.run();
      expect(created).to.not.be.undefined;
      strictEqual(created!.name, 'foo v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, false);
    });

    it('does nothing when no merged release PRs found', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});

      stubDefaultBranch(github);
      sandbox.stub(github, 'findMergedPullRequests').resolves([]);

      const created = await release.run();
      expect(created).to.be.undefined;
    });

    it('does nothing when we find a release PR, but cannot determine the version', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});

      stubDefaultBranch(github);
      stubPRs(
        github,
        'release-please/branches/main',
        'Some not matching release name'
      );

      const created = await release.run();
      expect(created).to.be.undefined;
    });

    it('ignores tagged pull requests', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});

      stubDefaultBranch(github);
      sandbox
        .stub(github, 'findMergedPullRequests')
        .onFirstCall()
        .resolves([
          {
            sha: 'abc123',
            number: 1,
            baseRefName: 'main',
            headRefName: 'release-foo-v1.0.3',
            labels: ['autorelease: tagged'],
            title: 'Release foo v1.0.3',
            body: 'Some release notes',
          },
        ])
        .onSecondCall()
        .resolves([]);

      const created = await release.run();
      expect(created).to.be.undefined;
    });

    it('allows blank packageName', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const releasePR = new ReleasePR({github});
      const release = new GitHubRelease({github, releasePR});

      stubDefaultBranch(github);
      stubPRs(github, 'release-v1.0.3', 'Release v1.0.3');
      stubChangeLog(github);
      stubCommentsAndLabels(github);

      sandbox
        .stub(github, 'createRelease')
        .withArgs('', 'v1.0.3', 'abc123', '\n* entry', false)
        .resolves({
          name: 'v1.0.3',
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });

      const created = await release.run();
      strictEqual(created!.name, 'v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, false);
    });
  });
});
