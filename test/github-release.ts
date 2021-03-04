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
import {JavaLTS} from '../src/releasers/java-lts';

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
  function mockGithubCommon(params: {
    github: GitHub;
    prHead: string;
    prTitle: string;
    changeLog?: string;
    version?: string;
    mockLabelsAndComment?: boolean;
  }) {
    const {github, prHead, prTitle, changeLog, version} = params;
    const mock = sandbox.mock(github);
    mock.expects('getRepositoryDefaultBranch').once().resolves('main');
    mock
      .expects('findMergedPullRequests')
      .once()
      .resolves([
        {
          sha: 'abc123',
          number: 1,
          baseRefName: 'main',
          headRefName: prHead,
          labels: ['autorelease: pending'],
          title: prTitle,
          body: 'Some release notes',
        },
      ]);
    mock
      .expects('getFileContentsOnBranch')
      .withExactArgs(changeLog ?? 'CHANGELOG.md', 'main')
      .once()
      .resolves(
        buildFileContent(`#Changelog\n\n## v${version ?? '1.0.3'}\n\n* entry`)
      );
    return mock;
  }

  function mockGithubLabelsAndComment(
    mock: sinon.SinonMock,
    mockLabelsAndComment: boolean
  ) {
    if (mockLabelsAndComment) {
      mock
        .expects('commentOnIssue')
        .withExactArgs(
          ':robot: Release is at https://release.url :sunflower:',
          1
        )
        .once()
        .resolves();
      mock
        .expects('addLabels')
        .withExactArgs(['autorelease: tagged'], 1)
        .once()
        .resolves();
      mock
        .expects('removeLabels')
        .withExactArgs(['autorelease: pending'], 1)
        .once()
        .resolves();
    } else {
      mock.expects('commentOnIssue').never();
      mock.expects('addLabels').never();
      mock.expects('removeLabels').never();
    }
  }

  describe('run', () => {
    it('creates and labels release on GitHub', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = mockGithubCommon({
        github,
        prHead: 'release-v1.0.3',
        prTitle: 'Release v1.0.3',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .once()
        .withExactArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .once()
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
      mock.verify();

      strictEqual(created!.name, 'foo v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, false);
    });

    it('creates and labels release on GitHub with invalid semver', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = mockGithubCommon({
        github,
        prHead: 'release-v1A.B.C',
        prTitle: 'Release v1A.B.C',
        version: '1A.B.C',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .withExactArgs('foo', 'v1A.B.C', 'abc123', '\n* entry', false)
        .once()
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
      const mock = mockGithubCommon({
        github,
        prHead: 'release-v1.0.3',
        prTitle: 'Release v1.0.3',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .withExactArgs('foo', 'v1.0.3', 'abc123', '\n* entry', true)
        .once()
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
      const mock = mockGithubCommon({
        github,
        prHead: 'release-bigquery-v1.0.3',
        prTitle: 'Release bigquery v1.0.3',
        changeLog: 'bigquery/CHANGES.md',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .withExactArgs(
          'bigquery',
          'bigquery/v1.0.3',
          'abc123',
          '\n* entry',
          false
        )
        .once()
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

      mock.verify();
      expect(created).to.not.be.undefined;
      strictEqual(created!.name, 'bigquery bigquery/v1.0.3');
      strictEqual(created!.tag_name, 'bigquery/v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
    });

    it('supports submodules in nested folders', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = mockGithubCommon({
        github,
        prHead: 'release-foo-v1.0.3',
        prTitle: 'Release foo v1.0.3',
        changeLog: 'src/apis/foo/CHANGES.md',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .withExactArgs('foo', 'foo/v1.0.3', 'abc123', '\n* entry', false)
        .once()
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

      mock.verify();
      strictEqual(created!.name, 'foo foo/v1.0.3');
      strictEqual(created!.tag_name, 'foo/v1.0.3');
    });

    it('attempts to guess package name for submodule release', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = mockGithubCommon({
        github,
        prHead: 'release-foo-v1.0.3',
        prTitle: 'Release foo v1.0.3',
        changeLog: 'src/apis/foo/CHANGELOG.md',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('getFileContentsOnBranch')
        .withExactArgs('src/apis/foo/package.json', 'main')
        .once()
        .resolves(buildFileContent('{"name": "@google-cloud/foo"}'));
      mock
        .expects('createRelease')
        .withExactArgs(
          '@google-cloud/foo',
          'foo-v1.0.3',
          'abc123',
          '\n* entry',
          false
        )
        .once()
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

      mock.verify();
      expect(created).to.not.be.undefined;
      strictEqual(created!.name, '@google-cloud/foo foo-v1.0.3');
      strictEqual(created!.tag_name, 'foo-v1.0.3');
    });

    it('attempts to guess package name for release', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = mockGithubCommon({
        github,
        prHead: 'release-v1.0.3',
        prTitle: 'Release v1.0.3',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('getFileContentsOnBranch')
        .withExactArgs('package.json', 'main')
        .once()
        .resolves(buildFileContent('{"name": "@google-cloud/foo"}'));
      mock
        .expects('createRelease')
        .withExactArgs(
          '@google-cloud/foo',
          'v1.0.3',
          'abc123',
          '\n* entry',
          false
        )
        .once()
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

      mock.verify();
      strictEqual(created!.name, '@google-cloud/foo v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
    });

    it('empty packageName ok (non-monorepo)', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = mockGithubCommon({
        github,
        prHead: 'release-v1.0.3',
        prTitle: 'Release v1.0.3',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .once()
        .withExactArgs('', 'v1.0.3', 'abc123', '\n* entry', false)
        .once()
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

      mock.verify();
      strictEqual(created!.name, 'v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
    });

    it('empty packageName not ok (monorepo)', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
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
      const mock = mockGithubCommon({
        github,
        prHead: 'release-please/branches/main',
        prTitle: 'chore: release 1.0.3',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .withExactArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .once()
        .resolves({
          name: 'foo v1.0.3',
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });
      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});
      const created = await release.run();

      mock.verify();
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
      const mock = mockGithubCommon({
        github,
        prHead: 'release-please/branches/main',
        prTitle: 'chore(main): release 1.0.3',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .withExactArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .once()
        .resolves({
          name: 'foo v1.0.3',
          tag_name: 'v1.0.3',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });
      const releasePR = new JavaYoshi({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});
      const created = await release.run();

      mock.verify();
      expect(created).to.not.be.undefined;
      strictEqual(created!.name, 'foo v1.0.3');
      strictEqual(created!.tag_name, 'v1.0.3');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, false);
    });

    it('parses version from PR title (detectReleaseVersionFromTitle impl: java-lts)', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = mockGithubCommon({
        github,
        prHead: 'release-please/branches/main',
        prTitle: 'chore: release 1.0.3-lts.1',
        version: '1.0.3-lts.1',
      });
      mockGithubLabelsAndComment(mock, true);
      mock
        .expects('createRelease')
        .withExactArgs('foo', 'v1.0.3-lts.1', 'abc123', '\n* entry', false)
        .once()
        .resolves({
          name: 'foo v1.0.3-lts.1',
          tag_name: 'v1.0.3-lts.1',
          draft: false,
          html_url: 'https://release.url',
          upload_url: 'https://upload.url/',
          body: '\n* entry',
        });
      const releasePR = new JavaLTS({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});
      const created = await release.run();

      mock.verify();
      expect(created).to.not.be.undefined;
      strictEqual(created!.name, 'foo v1.0.3-lts.1');
      strictEqual(created!.tag_name, 'v1.0.3-lts.1');
      strictEqual(created!.major, 1);
      strictEqual(created!.minor, 0);
      strictEqual(created!.patch, 3);
      strictEqual(created!.draft, false);
    });

    it('does nothing when no merged release PRs found', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = sandbox.mock(github);
      mock.expects('getRepositoryDefaultBranch').once().resolves('main');
      mock.expects('findMergedPullRequests').once().resolves([]);
      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});
      const created = await release.run();

      mock.verify();
      expect(created).to.be.undefined;
    });

    it('does nothing when we find a release PR, but cannot determine the version', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = sandbox.mock(github);
      mock.expects('getRepositoryDefaultBranch').once().resolves('main');
      mock
        .expects('findMergedPullRequests')
        .once()
        .resolves([
          {
            sha: 'abc123',
            number: 1,
            baseRefName: 'main',
            headRefName: 'release-please/branches/main',
            labels: ['autorelease: pending'],
            title: 'Not a match!',
            body: 'Some release notes',
          },
        ]);
      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});
      const created = await release.run();

      mock.verify();
      expect(created).to.be.undefined;
    });

    it('ignores tagged pull requests', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const mock = sandbox.mock(github);
      mock.expects('getRepositoryDefaultBranch').once().resolves('main');
      mock
        .expects('findMergedPullRequests')
        .once()
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
        ]);
      mock.expects('findMergedPullRequests').once().resolves([]);
      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const release = new GitHubRelease({github, releasePR});
      const created = await release.run();

      mock.verify();
      expect(created).to.be.undefined;
    });
  });
  describe('createRelease', () => {
    it('uses version for createRelease', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const expectedCreateReleaseResponse = {
        name: 'foo v1.0.3',
        tag_name: 'v1.0.3',
        draft: false,
        html_url: 'https://release.url',
        upload_url: 'https://upload.url/',
        body: '\n* entry',
      };
      const mock = sandbox.mock(github);
      mock.expects('getRepositoryDefaultBranch').once().resolves('main');
      mock
        .expects('getFileContentsOnBranch')
        .withExactArgs('CHANGELOG.md', 'main')
        .once()
        .resolves(buildFileContent('#Changelog\n\n## v1.0.3\n\n* entry'));
      mock
        .expects('createRelease')
        .once()
        .withExactArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .once()
        .resolves(expectedCreateReleaseResponse);

      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const releaser = new GitHubRelease({github, releasePR});
      const release = await releaser.createRelease('1.0.3', {
        sha: 'abc123',
        number: 1,
        baseRefName: 'main',
        headRefName: 'release-please/branches/main',
        labels: [],
        title: 'chore: release',
        body: 'the body',
      });
      mock.verify();

      expect(release).to.not.be.undefined;
      expect(release).to.eql(expectedCreateReleaseResponse);
    });
    it('finds version for createRelease', async () => {
      const github = new GitHub({owner: 'googleapis', repo: 'foo'});
      const expectedCreateReleaseResponse = {
        name: 'foo v1.0.3',
        tag_name: 'v1.0.3',
        draft: false,
        html_url: 'https://release.url',
        upload_url: 'https://upload.url/',
        body: '\n* entry',
      };
      const mock = mockGithubCommon({
        github,
        prHead: 'release-v1.0.3',
        prTitle: 'Release v1.0.3',
      });
      mockGithubLabelsAndComment(mock, false);
      mock
        .expects('createRelease')
        .once()
        .withExactArgs('foo', 'v1.0.3', 'abc123', '\n* entry', false)
        .once()
        .resolves(expectedCreateReleaseResponse);

      const releasePR = new ReleasePR({github, packageName: 'foo'});
      const releaser = new GitHubRelease({github, releasePR});
      const [candidate, release] = await releaser.createRelease();
      mock.verify();

      expect(candidate).to.not.be.undefined;
      expect(candidate).to.eql({
        sha: 'abc123',
        tag: 'v1.0.3',
        notes: '\n* entry',
        name: 'foo',
        version: '1.0.3',
        pullNumber: 1,
      });
      expect(release).to.not.be.undefined;
      expect(release).to.eql(expectedCreateReleaseResponse);
    });
  });
});
