// Copyright 2026 Google LLC
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

import * as nock from 'nock';
import {expect} from 'chai';
import {after, afterEach, before, beforeEach, describe, it} from 'mocha';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {execFileSync} from 'child_process';
import {Gitea, parsePullRequestNumber} from '../src/gitea';
import {normalizeGiteaApiUrl} from '../src/gitea-api';
import {RawContent} from '../src/updaters/raw-content';
import {TagName} from '../src/util/tag-name';
import {Version} from '../src/version';
import {PullRequestTitle} from '../src/util/pull-request-title';
import {PullRequestBody} from '../src/util/pull-request-body';
import {DuplicateReleaseError, FileNotFoundError} from '../src/errors';
/* eslint-disable @typescript-eslint/no-explicit-any */
const fetch = require('node-fetch');

nock.disableNetConnect();

const API = 'https://gitea.test/api/v1';

function git(cwd: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'init.defaultBranch=main',
      ...args,
    ],
    {cwd, encoding: 'utf8'}
  ).trim();
}

function write(dir: string, file: string, content: string) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), {recursive: true});
  fs.writeFileSync(path.join(dir, file), content);
}

function pull(overrides: Record<string, unknown>) {
  return {
    number: 1,
    title: 'title',
    body: 'body',
    html_url: 'https://gitea.test/owner/repo/pulls/1',
    state: 'closed',
    merged: true,
    merge_commit_sha: null,
    labels: [],
    head: {ref: 'feature'},
    base: {ref: 'main'},
    ...overrides,
  };
}

describe('Gitea', function () {
  this.timeout(60000);

  let tmp: string;
  let remote: string;
  let work: string;
  const shas: Record<string, string> = {};

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gitea-test-'));
    remote = path.join(tmp, 'remote.git');
    work = path.join(tmp, 'work');
    git(tmp, 'init', '--bare', remote);
    git(tmp, 'clone', remote, work);
    git(work, 'checkout', '-b', 'main');

    write(work, 'package.json', '{"name": "pkg", "version": "1.0.0"}\n');
    write(work, 'packages/a/package.json', '{"name": "a"}\n');
    write(work, 'packages/a/src/index.ts', 'export {};\n');
    git(work, 'add', '.');
    git(work, 'commit', '-m', 'chore: initial commit');
    shas.initial = git(work, 'rev-parse', 'HEAD');
    git(work, 'tag', '-a', 'v1.0.0', '-m', 'v1.0.0');

    write(work, 'packages/a/src/feature.ts', 'export const a = 1;\n');
    git(work, 'add', '.');
    git(work, 'commit', '-m', 'feat: add feature (#3)\n\nsquashed body');
    shas.squash = git(work, 'rev-parse', 'HEAD');

    git(work, 'checkout', '-b', 'fix-branch');
    write(work, 'src/b.txt', 'b\n');
    git(work, 'add', '.');
    git(work, 'commit', '-m', 'fix: stuff');
    shas.branchCommit = git(work, 'rev-parse', 'HEAD');
    git(work, 'checkout', 'main');
    git(
      work,
      'merge',
      '--no-ff',
      'fix-branch',
      '-m',
      "Merge pull request 'fix stuff' (#4) from fix-branch into main"
    );
    shas.merge = git(work, 'rev-parse', 'HEAD');
    git(work, 'push', 'origin', 'main', '--tags');
  });

  after(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
  });

  let gitea: Gitea;

  beforeEach(async () => {
    nock(API).get('/repos/owner/repo').reply(200, {
      default_branch: 'main',
      clone_url: 'https://gitea.test/owner/repo.git',
      html_url: 'https://gitea.test/owner/repo',
    });
    gitea = await Gitea.create({
      owner: 'owner',
      repo: 'repo',
      apiUrl: 'https://gitea.test',
      token: 'secret',
      cloneUrl: remote,
      fetch,
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('create', () => {
    it('reads the default branch from the API', () => {
      expect(gitea.repository.defaultBranch).to.equal('main');
      expect(gitea.api.apiUrl).to.equal(API);
    });
  });

  describe('getFileContentsOnBranch', () => {
    it('reads a file', async () => {
      const contents = await gitea.getFileContentsOnBranch(
        'package.json',
        'main'
      );
      expect(contents.parsedContent).to.include('"version": "1.0.0"');
      expect(contents.mode).to.equal('100644');
      expect(Buffer.from(contents.content, 'base64').toString()).to.equal(
        contents.parsedContent
      );
    });

    it('reads a file from a tag', async () => {
      const contents = await gitea.getFileContentsOnBranch(
        'packages/a/src/index.ts',
        'v1.0.0'
      );
      expect(contents.parsedContent).to.equal('export {};\n');
    });

    it('throws FileNotFoundError for a missing file', async () => {
      try {
        await gitea.getFileContentsOnBranch('missing.txt', 'main');
        expect.fail('expected error');
      } catch (e) {
        expect(e).to.be.instanceOf(FileNotFoundError);
      }
    });

    it('throws FileNotFoundError for a directory', async () => {
      try {
        await gitea.getFileContentsOnBranch('packages', 'main');
        expect.fail('expected error');
      } catch (e) {
        expect(e).to.be.instanceOf(FileNotFoundError);
      }
    });
  });

  describe('finding files', () => {
    it('finds files by filename', async () => {
      expect(
        (await gitea.findFilesByFilename('package.json')).sort()
      ).to.deep.equal(['package.json', 'packages/a/package.json']);
    });

    it('finds files by filename with a prefix', async () => {
      expect(
        await gitea.findFilesByFilename('package.json', 'packages')
      ).to.deep.equal(['a/package.json']);
    });

    it('finds files by glob', async () => {
      expect(
        (await gitea.findFilesByGlob('packages/*/src/*.ts')).sort()
      ).to.deep.equal(['packages/a/src/feature.ts', 'packages/a/src/index.ts']);
      expect(await gitea.findFilesByGlob('packages/*')).to.deep.equal([
        'packages/a',
      ]);
    });

    it('finds files by extension', async () => {
      expect(
        (await gitea.findFilesByExtension('ts', 'packages/a')).sort()
      ).to.deep.equal(['src/feature.ts', 'src/index.ts']);
    });
  });

  describe('mergeCommitIterator', () => {
    it('attaches merged pull requests to merge and squash commits', async () => {
      const scope = nock(API)
        .get('/repos/owner/repo/pulls/4')
        .reply(
          200,
          pull({
            number: 4,
            title: 'fix stuff',
            merge_commit_sha: shas.merge,
            head: {ref: 'fix-branch'},
            labels: [{id: 1, name: 'bug'}],
          })
        )
        .get('/repos/owner/repo/pulls/3')
        .reply(
          200,
          pull({
            number: 3,
            title: 'feat: add feature',
            merge_commit_sha: shas.squash,
          })
        );
      const commits = [];
      for await (const commit of gitea.mergeCommitIterator('main')) {
        commits.push(commit);
      }
      scope.done();
      expect(commits.map(c => c.sha)).to.have.members([
        shas.merge,
        shas.branchCommit,
        shas.squash,
        shas.initial,
      ]);
      expect(commits[0].sha).to.equal(shas.merge);

      const merge = commits.find(c => c.sha === shas.merge)!;
      expect(merge.pullRequest?.number).to.equal(4);
      expect(merge.pullRequest?.mergeCommitOid).to.equal(shas.merge);
      expect(merge.pullRequest?.headBranchName).to.equal('fix-branch');
      expect(merge.pullRequest?.labels).to.deep.equal(['bug']);
      expect(merge.files).to.deep.equal(['src/b.txt']);

      const squash = commits.find(c => c.sha === shas.squash)!;
      expect(squash.pullRequest?.number).to.equal(3);
      expect(squash.files).to.deep.equal(['packages/a/src/feature.ts']);
      expect(squash.message).to.equal(
        'feat: add feature (#3)\n\nsquashed body'
      );
      expect(squash.author).to.deep.equal({
        name: 'Test',
        email: 'test@example.com',
      });

      const plain = commits.find(c => c.sha === shas.branchCommit)!;
      expect(plain.pullRequest).to.be.undefined;
    });

    it('ignores references that are not merged pull requests', async () => {
      nock(API)
        .get('/repos/owner/repo/pulls/4')
        .reply(404, {message: 'not found'})
        .get('/repos/owner/repo/pulls/3')
        .reply(200, pull({number: 3, merged: false}));
      const commits = [];
      for await (const commit of gitea.mergeCommitIterator('main')) {
        commits.push(commit);
      }
      expect(commits.every(c => !c.pullRequest)).to.be.true;
    });

    it('respects maxResults and batchSize', async () => {
      nock(API)
        .get('/repos/owner/repo/pulls/4')
        .reply(404, {})
        .get('/repos/owner/repo/pulls/3')
        .reply(404, {});
      const commits = [];
      for await (const commit of gitea.mergeCommitIterator('main', {
        maxResults: 3,
        batchSize: 1,
        backfillFiles: false,
      })) {
        commits.push(commit);
      }
      expect(commits).to.have.length(3);
      expect(commits[0].files).to.be.undefined;
    });
  });

  describe('commitsSince', () => {
    it('stops at the filter', async () => {
      nock(API)
        .get('/repos/owner/repo/pulls/4')
        .reply(404, {})
        .get('/repos/owner/repo/pulls/3')
        .reply(404, {});
      const commits = await gitea.commitsSince(
        'main',
        commit => commit.sha === shas.squash
      );
      expect(commits.map(c => c.sha)).to.not.include(shas.squash);
      expect(commits.map(c => c.sha)).to.not.include(shas.initial);
    });
  });

  describe('tagIterator', () => {
    it('lists tags with their commit sha', async () => {
      const tags = [];
      for await (const tag of gitea.tagIterator()) {
        tags.push(tag);
      }
      expect(tags).to.deep.equal([{name: 'v1.0.0', sha: shas.initial}]);
    });
  });

  describe('releaseIterator', () => {
    it('resolves the tag commit for each release', async () => {
      nock(API)
        .get('/repos/owner/repo/releases')
        .query({page: '1', limit: '50'})
        .reply(200, [
          {
            id: 7,
            name: 'v1.0.0',
            tag_name: 'v1.0.0',
            target_commitish: 'main',
            body: 'notes',
            html_url: 'https://gitea.test/owner/repo/releases/tag/v1.0.0',
            draft: false,
          },
          {
            id: 8,
            tag_name: 'v2.0.0',
            target_commitish: 'main',
            html_url: 'https://gitea.test/owner/repo/releases/tag/v2.0.0',
            draft: true,
          },
        ])
        .get('/repos/owner/repo/tags/v2.0.0')
        .reply(404, {});
      const releases = [];
      for await (const release of gitea.releaseIterator()) {
        releases.push(release);
      }
      expect(releases).to.have.length(1);
      expect(releases[0]).to.include({
        id: 7,
        tagName: 'v1.0.0',
        sha: shas.initial,
        notes: 'notes',
      });
    });
  });

  describe('pullRequestIterator', () => {
    it('filters by base branch and merge state', async () => {
      nock(API)
        .get('/repos/owner/repo/pulls')
        .query({state: 'closed', sort: 'recentupdate', page: '1', limit: '50'})
        .reply(200, [
          pull({number: 1, merge_commit_sha: 'abc'}),
          pull({number: 2, merged: false}),
          pull({number: 3, base: {ref: 'other'}}),
        ]);
      const merged = [];
      for await (const pr of gitea.pullRequestIterator(
        'main',
        'MERGED',
        10,
        false
      )) {
        merged.push(pr);
      }
      expect(merged.map(p => p.number)).to.deep.equal([1]);
      expect(merged[0].sha).to.equal('abc');
    });

    it('returns closed but unmerged pull requests for CLOSED', async () => {
      nock(API)
        .get('/repos/owner/repo/pulls')
        .query(true)
        .reply(200, [
          pull({number: 1, merge_commit_sha: 'abc'}),
          pull({number: 2, merged: false, labels: [{id: 3, name: 'snooze'}]}),
        ]);
      const closed = [];
      for await (const pr of gitea.pullRequestIterator(
        'main',
        'CLOSED',
        10,
        false
      )) {
        closed.push(pr);
      }
      expect(closed.map(p => p.number)).to.deep.equal([2]);
      expect(closed[0].labels).to.deep.equal(['snooze']);
    });
  });

  describe('createPullRequest', () => {
    it('pushes a release branch and opens a pull request', async () => {
      let createBody: any;
      const scope = nock(API)
        .get('/repos/owner/repo/pulls')
        .query(true)
        .reply(200, [])
        .get('/repos/owner/repo/labels')
        .query(true)
        .reply(200, [{id: 10, name: 'autorelease: pending'}])
        .post('/repos/owner/repo/labels', {
          name: 'extra',
          color: '#ededed',
        })
        .reply(201, {id: 11, name: 'extra'})
        .post('/repos/owner/repo/pulls', body => {
          createBody = body;
          return true;
        })
        .reply(
          201,
          pull({
            number: 12,
            state: 'open',
            merged: false,
            head: {ref: 'release-please--branches--main'},
            labels: [{id: 10, name: 'autorelease: pending'}],
          })
        );

      const pr = await gitea.createPullRequest(
        {
          headBranchName: 'release-please--branches--main',
          baseBranchName: 'main',
          number: -1,
          title: 'chore(main): release 1.1.0',
          body: 'release notes',
          labels: ['autorelease: pending', 'extra'],
          files: [],
        },
        'main',
        'chore(main): release 1.1.0',
        [
          {
            path: 'package.json',
            createIfMissing: false,
            updater: new RawContent('{"name": "pkg", "version": "1.1.0"}\n'),
          },
          {
            path: 'CHANGELOG.md',
            createIfMissing: true,
            updater: new RawContent('# Changelog\n'),
          },
        ],
        {draft: true}
      );
      scope.done();
      expect(pr.number).to.equal(12);
      expect(createBody).to.deep.equal({
        head: 'release-please--branches--main',
        base: 'main',
        title: 'WIP: chore(main): release 1.1.0',
        body: 'release notes',
        labels: [10, 11],
      });

      const branch = 'release-please--branches--main';
      expect(git(remote, 'show', `${branch}:package.json`)).to.include(
        '"version": "1.1.0"'
      );
      expect(git(remote, 'show', `${branch}:CHANGELOG.md`)).to.equal(
        '# Changelog'
      );
      expect(git(remote, 'rev-parse', `${branch}^`)).to.equal(shas.merge);
      expect(git(remote, 'log', '-1', '--format=%s%n%an', branch)).to.equal(
        'chore(main): release 1.1.0\nrelease-please[bot]'
      );
      // the default branch is untouched
      expect(git(remote, 'rev-parse', 'main')).to.equal(shas.merge);
    });

    it('reuses an existing open pull request', async () => {
      nock(API)
        .get('/repos/owner/repo/pulls')
        .query(true)
        .reply(200, [
          pull({
            number: 15,
            state: 'open',
            merged: false,
            head: {ref: 'release-branch'},
          }),
        ]);
      const pr = await gitea.createPullRequest(
        {
          headBranchName: 'release-branch',
          baseBranchName: 'main',
          number: -1,
          title: 'release',
          body: 'body',
          labels: [],
          files: [],
        },
        'main',
        'release',
        [
          {
            path: 'package.json',
            createIfMissing: false,
            updater: new RawContent('changed\n'),
          },
        ]
      );
      expect(pr.number).to.equal(15);
    });

    it('skips when there are no changes', async () => {
      const pr = await gitea.createPullRequest(
        {
          headBranchName: 'noop-branch',
          baseBranchName: 'main',
          number: -1,
          title: 'release',
          body: 'body',
          labels: [],
          files: [],
        },
        'main',
        'release',
        [
          {
            path: 'package.json',
            createIfMissing: false,
            updater: new RawContent('{"name": "pkg", "version": "1.0.0"}\n'),
          },
        ]
      );
      expect(pr.number).to.equal(0);
      expect(() =>
        git(remote, 'rev-parse', '--verify', 'refs/heads/noop-branch')
      ).to.throw();
    });
  });

  describe('updatePullRequest', () => {
    it('pushes new contents and updates title and body', async () => {
      const title = PullRequestTitle.ofTargetBranch('main');
      let patchBody: any;
      nock(API)
        .patch('/repos/owner/repo/pulls/12', body => {
          patchBody = body;
          return true;
        })
        .reply(200, pull({number: 12, state: 'open', merged: false}));
      await gitea.updatePullRequest(
        12,
        {
          title,
          body: new PullRequestBody([]),
          labels: [],
          headRefName: 'update-branch',
          draft: false,
          updates: [
            {
              path: 'package.json',
              createIfMissing: false,
              updater: new RawContent('updated\n'),
            },
          ],
        },
        'main',
        {signoffUser: 'Bot <bot@example.com>'}
      );
      expect(patchBody.state).to.equal('open');
      expect(patchBody.title).to.equal(title.toString());
      expect(git(remote, 'show', 'update-branch:package.json')).to.equal(
        'updated'
      );
      expect(git(remote, 'log', '-1', '--format=%B', 'update-branch')).to.match(
        /Signed-off-by: Bot <bot@example.com>/
      );
    });
  });

  describe('createRelease', () => {
    const release = {
      tag: new TagName(Version.parse('1.1.0'), undefined, '-', true),
      sha: 'abc123',
      notes: 'notes',
      name: 'v1.1.0',
    };

    it('creates a release', async () => {
      nock(API)
        .post('/repos/owner/repo/releases', {
          tag_name: 'v1.1.0',
          target_commitish: 'abc123',
          name: 'v1.1.0',
          body: 'notes',
          draft: false,
          prerelease: true,
        })
        .reply(201, {
          id: 5,
          tag_name: 'v1.1.0',
          target_commitish: 'abc123',
          body: 'notes',
          html_url: 'https://gitea.test/owner/repo/releases/tag/v1.1.0',
          draft: false,
          upload_url: 'https://gitea.test/upload',
        });
      const created = await gitea.createRelease(release, {prerelease: true});
      expect(created).to.deep.include({
        id: 5,
        tagName: 'v1.1.0',
        sha: 'abc123',
        url: 'https://gitea.test/owner/repo/releases/tag/v1.1.0',
      });
    });

    it('creates the tag first when forceTag is set', async () => {
      const scope = nock(API)
        .post('/repos/owner/repo/tags', {tag_name: 'v1.1.0', target: 'abc123'})
        .reply(409, {message: 'tag exists'})
        .post('/repos/owner/repo/releases')
        .reply(201, {
          id: 5,
          tag_name: 'v1.1.0',
          html_url: 'u',
          draft: false,
        });
      await gitea.createRelease(release, {forceTag: true});
      scope.done();
    });

    it('throws DuplicateReleaseError on conflict', async () => {
      nock(API)
        .post('/repos/owner/repo/releases')
        .reply(409, {message: 'Release is has no Tag'});
      try {
        await gitea.createRelease(release);
        expect.fail('expected error');
      } catch (e) {
        expect(e).to.be.instanceOf(DuplicateReleaseError);
      }
    });
  });

  describe('labels and comments', () => {
    it('adds labels by id, creating missing ones', async () => {
      const scope = nock(API)
        .get('/repos/owner/repo/labels')
        .query(true)
        .reply(200, [{id: 1, name: 'autorelease: tagged'}])
        .post('/repos/owner/repo/labels')
        .reply(201, {id: 2, name: 'new'})
        .post('/repos/owner/repo/issues/9/labels', {labels: [1, 2]})
        .reply(200, []);
      await gitea.addIssueLabels(['autorelease: tagged', 'new'], 9);
      scope.done();
    });

    it('removes labels by id', async () => {
      const scope = nock(API)
        .get('/repos/owner/repo/issues/9/labels')
        .reply(200, [
          {id: 1, name: 'autorelease: pending'},
          {id: 2, name: 'keep'},
        ])
        .delete('/repos/owner/repo/issues/9/labels/1')
        .reply(204);
      await gitea.removeIssueLabels(['autorelease: pending', 'absent'], 9);
      scope.done();
    });

    it('comments on an issue', async () => {
      nock(API)
        .post('/repos/owner/repo/issues/9/comments', {body: 'hi'})
        .reply(201, {html_url: 'https://gitea.test/c/1'});
      expect(await gitea.commentOnIssue('hi', 9)).to.equal(
        'https://gitea.test/c/1'
      );
    });

    it('sends the token as an authorization header', async () => {
      const scope = nock(API, {
        reqheaders: {authorization: 'token secret'},
      })
        .post('/repos/owner/repo/issues/9/comments')
        .reply(201, {html_url: 'x'});
      await gitea.commentOnIssue('hi', 9);
      scope.done();
    });
  });

  describe('createFileOnNewBranch', () => {
    it('force pushes a branch with the file', async () => {
      const url = await gitea.createFileOnNewBranch(
        'notes/release.md',
        'notes\n',
        'release-notes',
        'main'
      );
      expect(url).to.equal(
        'https://gitea.test/owner/repo/src/branch/release-notes/notes/release.md'
      );
      expect(git(remote, 'show', 'release-notes:notes/release.md')).to.equal(
        'notes'
      );
    });
  });

  describe('generateReleaseNotes', () => {
    it('is not supported', async () => {
      try {
        await gitea.generateReleaseNotes('v1', 'main');
        expect.fail('expected error');
      } catch (e) {
        expect((e as Error).message).to.match(/does not support/);
      }
    });
  });
});

describe('parsePullRequestNumber', () => {
  it('parses Gitea merge commits', () => {
    expect(
      parsePullRequestNumber(
        "Merge pull request 'feat: x (#2)' (#12) from user/branch into main"
      )
    ).to.equal(12);
  });
  it('parses squash commits', () => {
    expect(parsePullRequestNumber('feat: add thing (#7)')).to.equal(7);
  });
  it('parses GitHub merge commits', () => {
    expect(
      parsePullRequestNumber('Merge pull request #5 from owner/branch')
    ).to.equal(5);
  });
  it('returns undefined otherwise', () => {
    expect(parsePullRequestNumber('fix: something')).to.be.undefined;
  });
});

describe('normalizeGiteaApiUrl', () => {
  it('appends /api/v1 when missing', () => {
    expect(normalizeGiteaApiUrl('https://g.test/')).to.equal(
      'https://g.test/api/v1'
    );
    expect(normalizeGiteaApiUrl('https://g.test/api/v1')).to.equal(
      'https://g.test/api/v1'
    );
  });
});

describe('Gitea with Manifest', function () {
  this.timeout(60000);

  let tmp: string;
  let remote: string;
  let releaseSha: string;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gitea-e2e-'));
    remote = path.join(tmp, 'remote.git');
    const work = path.join(tmp, 'work');
    git(tmp, 'init', '--bare', remote);
    git(tmp, 'clone', remote, work);
    git(work, 'checkout', '-b', 'main');
    write(work, 'version.txt', '1.0.0\n');
    git(work, 'add', '.');
    git(work, 'commit', '-m', 'chore(main): release 1.0.0 (#1)');
    releaseSha = git(work, 'rev-parse', 'HEAD');
    git(work, 'tag', 'v1.0.0');
    write(work, 'src/a.txt', 'a\n');
    git(work, 'add', '.');
    git(work, 'commit', '-m', 'feat: add a (#2)');
    write(work, 'src/b.txt', 'b\n');
    git(work, 'add', '.');
    git(work, 'commit', '-m', 'fix: correct b (#3)');
    git(work, 'push', 'origin', 'main', '--tags');
  });

  after(() => {
    fs.rmSync(tmp, {recursive: true, force: true});
    nock.cleanAll();
  });

  it('opens a release pull request from commits since the last release', async () => {
    const releasePull = pull({
      number: 1,
      title: 'chore(main): release 1.0.0',
      merge_commit_sha: releaseSha,
      head: {ref: 'release-please--branches--main'},
      labels: [{id: 1, name: 'autorelease: tagged'}],
    });
    let created: any;
    nock(API)
      .persist()
      .get('/repos/owner/repo')
      .reply(200, {
        default_branch: 'main',
        clone_url: 'https://gitea.test/owner/repo.git',
        html_url: 'https://gitea.test/owner/repo',
      })
      .get('/repos/owner/repo/pulls/1')
      .reply(200, releasePull)
      .get(/\/repos\/owner\/repo\/pulls\/\d+$/)
      .reply(404, {message: 'not found'})
      .get('/repos/owner/repo/pulls')
      .query(true)
      .reply(200, [])
      .get('/repos/owner/repo/releases')
      .query(true)
      .reply(200, [
        {
          id: 1,
          tag_name: 'v1.0.0',
          target_commitish: 'main',
          html_url: 'https://gitea.test/owner/repo/releases/tag/v1.0.0',
          draft: false,
        },
      ])
      .get('/repos/owner/repo/labels')
      .query(true)
      .reply(200, [{id: 5, name: 'autorelease: pending'}])
      .post('/repos/owner/repo/pulls', body => {
        created = body;
        return true;
      })
      .reply(201, (_uri, body: any) =>
        pull({
          number: 4,
          state: 'open',
          merged: false,
          title: body.title,
          body: body.body,
          head: {ref: body.head},
          labels: [{id: 5, name: 'autorelease: pending'}],
        })
      );

    const gitea = await Gitea.create({
      owner: 'owner',
      repo: 'repo',
      apiUrl: API,
      cloneUrl: remote,
      fetch,
    });
    const {Manifest} = await import('../src/manifest');
    const manifest = await Manifest.fromConfig(gitea, 'main', {
      releaseType: 'simple',
      changelogHost: 'https://gitea.test',
    });
    const pulls = await manifest.createPullRequests();

    expect(pulls).to.have.length(1);
    expect(pulls[0]!.number).to.equal(4);
    expect(created.title).to.equal('chore(main): release 1.1.0');
    expect(created.head).to.equal('release-please--branches--main');
    expect(created.base).to.equal('main');
    expect(created.labels).to.deep.equal([5]);
    expect(created.body).to.include('add a');
    expect(created.body).to.include('correct b');

    const branch = 'release-please--branches--main';
    expect(git(remote, 'show', `${branch}:version.txt`)).to.equal('1.1.0');
    const changelog = git(remote, 'show', `${branch}:CHANGELOG.md`);
    expect(changelog).to.include('## [1.1.0]');
    expect(changelog).to.include(
      'https://gitea.test/owner/repo/compare/v1.0.0...v1.1.0'
    );
    expect(changelog).to.include('https://gitea.test/owner/repo/issues/2');
  });
});
