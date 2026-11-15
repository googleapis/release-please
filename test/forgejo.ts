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
import * as sinon from 'sinon';
import {expect} from 'chai';
import {afterEach, beforeEach, describe, it} from 'mocha';
nock.disableNetConnect();

import {request} from '@octokit/request';
import {RequestError} from '@octokit/request-error';
import {Forgejo} from '../src/forgejo';
import {Commit} from '../src/commit';
import {Update} from '../src/update';
import {TagName} from '../src/util/tag-name';
import {Version} from '../src/version';
import {PullRequestBody} from '../src/util/pull-request-body';
import {PullRequestTitle} from '../src/util/pull-request-title';
import {
  ConfigurationError,
  DuplicateReleaseError,
  FileNotFoundError,
  GitHubAPIError,
} from '../src/errors';
import {PullRequestOverflowHandler} from '../src/util/pull-request-overflow-handler';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

const HOST = 'https://forgejo.example.com';
const API = '/api/v1/repos/fake/fake';

function b64(content: string): string {
  return Buffer.from(content, 'utf8').toString('base64');
}

function contentsResponse(content: string, sha = 'blobsha') {
  return {type: 'file', content: b64(content), encoding: 'base64', sha};
}

function pullRequestResponse(number: number, overrides: object = {}) {
  return {
    number,
    title: `chore: release ${number}`,
    body: 'the body',
    state: 'open',
    merged: false,
    merge_commit_sha: null,
    head: {ref: 'release-please--branches--main', repo_id: 1},
    base: {ref: 'main', repo_id: 1},
    labels: [{id: 1, name: 'autorelease: pending'}],
    html_url: `${HOST}/fake/fake/pulls/${number}`,
    ...overrides,
  };
}

function staticUpdate(path: string, content: string, createIfMissing = true) {
  return {
    path,
    createIfMissing,
    updater: {updateContent: () => content},
  } as Update;
}

function spyLogger() {
  return {
    error: sinon.stub(),
    warn: sinon.stub(),
    info: sinon.stub(),
    debug: sinon.stub(),
    trace: sinon.stub(),
  };
}

async function errorOf(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (e) {
    return e;
  }
  return undefined;
}

describe('Forgejo', () => {
  let forgejo: Forgejo;

  function createForgejo(logger: ReturnType<typeof spyLogger>) {
    return Forgejo.create({
      owner: 'fake',
      repo: 'fake',
      apiUrl: `${HOST}/api/v1`,
      token: 'secret',
      defaultBranch: 'main',
      logger,
      fetch,
    });
  }

  beforeEach(async () => {
    forgejo = await Forgejo.create({
      owner: 'fake',
      repo: 'fake',
      apiUrl: `${HOST}/api/v1`,
      token: 'secret',
      defaultBranch: 'main',
      fetch,
    });
    // the page size is read once per instance on the first list request
    nock(HOST)
      .get('/api/v1/settings/api')
      .optionally()
      .reply(200, {max_response_items: 50});
  });
  afterEach(() => {
    nock.cleanAll();
  });

  describe('pagination', () => {
    it('uses the maximum page size of the instance', async () => {
      nock.cleanAll();
      const scope = nock(HOST)
        .get('/api/v1/settings/api')
        .reply(200, {max_response_items: 100})
        .get(`${API}/tags`)
        .query({page: '1', limit: '100'})
        .reply(200, [{name: 'v1.0.0', commit: {sha: 'a'}}], {
          'x-hasmore': 'false',
        });
      const tags = [];
      for await (const tag of forgejo.tagIterator()) {
        tags.push(tag);
      }
      expect(tags).to.have.lengthOf(1);
      scope.done();
    });

    it('falls back to 50 items per page', async () => {
      nock.cleanAll();
      const scope = nock(HOST)
        .get('/api/v1/settings/api')
        .reply(500, {message: 'boom'})
        .get(`${API}/tags`)
        .query({page: '1', limit: '50'})
        .reply(200, [], {'x-hasmore': 'false'});
      const tags = [];
      for await (const tag of forgejo.tagIterator()) {
        tags.push(tag);
      }
      expect(tags).to.eql([]);
      scope.done();
    });

    it('stops without a next link and uses 50 items without a limit', async () => {
      nock.cleanAll();
      const scope = nock(HOST)
        .get('/api/v1/settings/api')
        .reply(200, {max_response_items: 0})
        .get(`${API}/tags`)
        .query({page: '1', limit: '50'})
        .reply(200, [{name: 'v1.0.0', commit: {sha: 'a'}}], {
          link: `<${HOST}${API}/tags?page=1>; rel="first"`,
        });
      const tags = [];
      for await (const tag of forgejo.tagIterator()) {
        tags.push(tag);
      }
      expect(tags).to.have.lengthOf(1);
      scope.done();
    });
  });

  describe('create', () => {
    it('uses the configured default branch without API calls', async () => {
      expect(forgejo.repository.defaultBranch).to.eql('main');
      expect(forgejo.webUrl).to.eql(HOST);
    });

    it('fetches the default branch and sends the token', async () => {
      const scope = nock(HOST, {reqheaders: {authorization: 'token secret'}})
        .get(API)
        .reply(200, {default_branch: 'develop'});
      const github = await Forgejo.create({
        owner: 'fake',
        repo: 'fake',
        apiUrl: `${HOST}/api/v1/`,
        token: 'secret',
        fetch,
      });
      expect(github.repository.defaultBranch).to.eql('develop');
      expect(github.webUrl).to.eql(HOST);
      scope.done();
    });
  });

  describe('getFileContentsOnBranch', () => {
    it('returns and caches file contents', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/path/to/package.json`)
        .query({ref: 'main'})
        .once()
        .reply(200, contentsResponse('{"version":"1.2.3"}', 'abc123'));
      const contents = await forgejo.getFileContentsOnBranch(
        'path/to/package.json',
        'main'
      );
      expect(contents.parsedContent).to.eql('{"version":"1.2.3"}');
      expect(contents.sha).to.eql('abc123');
      expect(contents.mode).to.eql('100644');
      const cached = await forgejo.getFileJson<{version: string}>(
        'path/to/package.json',
        'main'
      );
      expect(cached.version).to.eql('1.2.3');
      scope.done();
    });

    it('falls back to the raw endpoint without inline content', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/big.txt`)
        .query({ref: 'main'})
        .reply(200, {type: 'file', content: null, sha: 'bigsha'})
        .get(`${API}/raw/big.txt`)
        .query({ref: 'main'})
        .reply(200, 'large content', {'content-type': 'text/plain'});
      const contents = await forgejo.getFileContents('big.txt');
      expect(contents.parsedContent).to.eql('large content');
      expect(contents.sha).to.eql('bigsha');
      scope.done();
    });

    it('throws FileNotFoundError for missing files', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/missing.txt`)
        .query({ref: 'main'})
        .reply(404, {message: 'not found'});
      let error: unknown;
      try {
        await forgejo.getFileContents('missing.txt');
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(FileNotFoundError);
      scope.done();
    });

    it('throws FileNotFoundError for directories', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/src`)
        .query({ref: 'main'})
        .reply(200, [{type: 'file', path: 'src/index.ts', sha: 'x'}]);
      let error: unknown;
      try {
        await forgejo.getFileContents('src');
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(FileNotFoundError);
      scope.done();
    });
  });

  describe('findFiles', () => {
    function mockTree() {
      return nock(HOST)
        .get(`${API}/commits`)
        .query({
          sha: 'main',
          limit: '1',
          stat: 'false',
          verification: 'false',
          files: 'false',
        })
        .reply(200, [{sha: 'commitsha', commit: {message: 'x'}}])
        .get(`${API}/git/trees/commitsha`)
        .query({recursive: 'true', page: '1'})
        .reply(200, {
          truncated: true,
          tree: [
            {path: 'package.json', type: 'blob', mode: '100644', sha: '1'},
            {path: 'packages', type: 'tree', mode: '040000', sha: '2'},
            {path: 'packages/a', type: 'tree', mode: '040000', sha: '3'},
            {
              path: 'packages/a/package.json',
              type: 'blob',
              mode: '100644',
              sha: '4',
            },
          ],
        })
        .get(`${API}/git/trees/commitsha`)
        .query({recursive: 'true', page: '2'})
        .reply(200, {
          truncated: false,
          tree: [
            {path: 'packages/b', type: 'tree', mode: '040000', sha: '5'},
            {
              path: 'packages/b/package.json',
              type: 'blob',
              mode: '100644',
              sha: '6',
            },
            {
              path: 'packages/b/index.js',
              type: 'blob',
              mode: '100644',
              sha: '7',
            },
            {path: 'vendor/sub', type: 'commit', mode: '160000', sha: '8'},
          ],
        });
    }

    it('finds files by filename across tree pages', async () => {
      const scope = mockTree();
      const files = await forgejo.findFilesByFilenameAndRef(
        'package.json',
        'main'
      );
      expect(files).to.eql([
        'package.json',
        'packages/a/package.json',
        'packages/b/package.json',
      ]);
      scope.done();
    });

    it('finds files by filename relative to a prefix', async () => {
      const scope = mockTree();
      const files = await forgejo.findFilesByFilename(
        'package.json',
        '/packages/'
      );
      expect(files).to.eql(['a/package.json', 'b/package.json']);
      scope.done();
    });

    it('finds files and directories by glob', async () => {
      const scope = mockTree();
      const files = await forgejo.findFilesByGlobAndRef('packages/*', 'main');
      expect(files).to.eql(['packages/a', 'packages/b']);
      // cached tree for the same commit
      nock(HOST)
        .get(`${API}/commits`)
        .query(true)
        .reply(200, [{sha: 'commitsha', commit: {message: 'x'}}]);
      const nested = await forgejo.findFilesByGlob('*/*.json', 'packages');
      expect(nested).to.eql(['a/package.json', 'b/package.json']);
      scope.done();
    });

    it('finds files by extension', async () => {
      const scope = mockTree();
      const files = await forgejo.findFilesByExtension('js');
      expect(files).to.eql(['packages/b/index.js']);
      scope.done();
    });
  });

  describe('mergeCommitIterator', () => {
    const commitsPage = [
      {
        sha: 'sha1',
        commit: {
          message: 'fix: bug (#12)\n\nbody\n',
          author: {name: 'Jane', email: 'jane@example.com'},
        },
        author: {login: 'jane'},
        files: [{filename: 'a.txt'}, {filename: 'b/c.txt'}],
      },
      {
        sha: 'sha2',
        commit: {message: 'chore: direct push\n', author: null},
        author: null,
        files: [],
      },
    ];

    it('iterates commits with associated pull requests', async () => {
      const scope = nock(HOST)
        .get(`${API}/commits`)
        .query({
          sha: 'main',
          stat: 'false',
          verification: 'false',
          files: 'true',
          page: '1',
          limit: '50',
        })
        .reply(200, commitsPage, {
          link: `<${HOST}${API}/commits?page=2>; rel="next"`,
        })
        .get(`${API}/commits`)
        .query({
          sha: 'main',
          stat: 'false',
          verification: 'false',
          files: 'true',
          page: '2',
          limit: '50',
        })
        .reply(200, [])
        .get(`${API}/commits/sha1/pull`)
        .reply(
          200,
          pullRequestResponse(12, {
            title: 'fix: bug',
            body: 'PR body',
            merged: true,
            merge_commit_sha: 'sha1',
            head: {ref: 'fix-branch', repo_id: 1},
            labels: [{id: 3, name: 'bug'}],
          })
        )
        .get(`${API}/commits/sha2/pull`)
        .reply(404, {message: 'not found'});

      const commits: Commit[] = [];
      for await (const commit of forgejo.mergeCommitIterator('main', {
        backfillFiles: true,
      })) {
        commits.push(commit);
      }
      expect(commits).to.have.lengthOf(2);
      expect(commits[0]).to.eql({
        sha: 'sha1',
        message: 'fix: bug (#12)\n\nbody',
        author: {name: 'Jane', email: 'jane@example.com', username: 'jane'},
        files: ['a.txt', 'b/c.txt'],
        pullRequest: {
          headBranchName: 'fix-branch',
          baseBranchName: 'main',
          number: 12,
          title: 'fix: bug',
          body: 'PR body',
          labels: ['bug'],
          files: ['a.txt', 'b/c.txt'],
          sha: 'sha1',
          mergeCommitOid: 'sha1',
        },
      });
      expect(commits[1].pullRequest).to.be.undefined;
      expect(commits[1].author).to.be.undefined;
      expect(commits[1].files).to.eql([]);
      scope.done();
    });

    it('respects maxResults and skips files unless requested', async () => {
      const scope = nock(HOST)
        .get(`${API}/commits`)
        .query({
          sha: 'main',
          stat: 'false',
          verification: 'false',
          files: 'false',
          page: '1',
          limit: '50',
        })
        .reply(200, commitsPage)
        .get(`${API}/commits/sha1/pull`)
        .reply(404, {message: 'not found'});
      const commits = await forgejo.commitsSince('main', () => false, {
        maxResults: 1,
      });
      expect(commits).to.have.lengthOf(1);
      expect(commits[0].files).to.be.undefined;
      scope.done();
    });

    it('looks up pull requests in batches of batchSize', async () => {
      // with a batch size of 1, stopping after the first commit must not
      // look up the pull request of the second commit
      const scope = nock(HOST)
        .get(`${API}/commits`)
        .query(true)
        .reply(200, commitsPage, {'x-hasmore': 'false'})
        .get(`${API}/commits/sha1/pull`)
        .reply(404, {message: 'not found'});
      const seen: string[] = [];
      for await (const commit of forgejo.mergeCommitIterator('main', {
        batchSize: 1,
      })) {
        seen.push(commit.sha);
        break;
      }
      expect(seen).to.eql(['sha1']);
      scope.done();
    });

    it('returns no commits for a missing branch', async () => {
      const scope = nock(HOST)
        .get(`${API}/commits`)
        .query(true)
        .reply(404, {message: 'branch not found'});
      const commits = await forgejo.commitsSince('missing', () => false);
      expect(commits).to.eql([]);
      scope.done();
    });

    it('wraps other API errors', async () => {
      const scope = nock(HOST)
        .get(`${API}/commits`)
        .query(true)
        .reply(500, {message: 'boom'});
      const error = await errorOf(() =>
        forgejo.commitsSince('main', () => false)
      );
      expect(error).to.be.instanceOf(GitHubAPIError);
      scope.done();
    });

    it('wraps errors looking up the pull request of a commit', async () => {
      const scope = nock(HOST)
        .get(`${API}/commits`)
        .query(true)
        .reply(200, [{sha: 'sha3', commit: {message: 'feat: x'}}], {
          'x-hasmore': 'false',
        })
        .get(`${API}/commits/sha3/pull`)
        .reply(500, {message: 'boom'});
      const error = await errorOf(() =>
        forgejo.commitsSince('main', () => false)
      );
      expect(error).to.be.instanceOf(GitHubAPIError);
      scope.done();
    });

    it('handles missing author names and pull request details', async () => {
      const scope = nock(HOST)
        .get(`${API}/commits`)
        .query(true)
        .reply(
          200,
          [
            {
              sha: 'sha3',
              commit: {message: 'feat: x', author: {email: 'a@example.com'}},
            },
          ],
          {'x-hasmore': 'false'}
        )
        .get(`${API}/commits/sha3/pull`)
        .reply(
          200,
          pullRequestResponse(13, {
            body: null,
            labels: null,
            merged: true,
            merge_commit_sha: null,
          })
        );
      const commits = await forgejo.commitsSince('main', () => false);
      expect(commits[0].author).to.eql({
        name: 'Unknown',
        email: 'a@example.com',
        username: undefined,
      });
      expect(commits[0].pullRequest).to.eql({
        headBranchName: 'release-please--branches--main',
        baseBranchName: 'main',
        number: 13,
        title: 'chore: release 13',
        body: '',
        labels: [],
        files: [],
        sha: 'sha3',
        mergeCommitOid: undefined,
      });
      scope.done();
    });
  });

  describe('pullRequestIterator', () => {
    it('yields merged pull requests only', async () => {
      const scope = nock(HOST)
        .get(`${API}/pulls`)
        .query({
          state: 'closed',
          base: 'main',
          sort: 'recentupdate',
          page: '1',
          limit: '50',
        })
        .reply(200, [
          pullRequestResponse(1, {merged: true, merge_commit_sha: 'm1'}),
          pullRequestResponse(2, {merged: false}),
          pullRequestResponse(3, {merged: true, base: {ref: 'other'}}),
        ])
        .get(`${API}/pulls`)
        .query({
          state: 'closed',
          base: 'main',
          sort: 'recentupdate',
          page: '2',
          limit: '50',
        })
        .reply(200, []);
      const pullRequests = [];
      for await (const pullRequest of forgejo.pullRequestIterator(
        'main',
        'MERGED',
        Number.MAX_SAFE_INTEGER,
        false
      )) {
        pullRequests.push(pullRequest);
      }
      expect(pullRequests).to.have.lengthOf(1);
      expect(pullRequests[0].number).to.eql(1);
      expect(pullRequests[0].sha).to.eql('m1');
      expect(pullRequests[0].labels).to.eql(['autorelease: pending']);
      scope.done();
    });

    it('uses the head label as branch name for deleted branches', async () => {
      const scope = nock(HOST)
        .get(`${API}/pulls`)
        .query(true)
        .reply(
          200,
          [
            pullRequestResponse(4, {
              // merged with git while still marked as work in progress
              title: 'WIP: chore(main): release 1.0.0',
              draft: true,
              merged: true,
              merge_commit_sha: 'm4',
              head: {
                label: 'release-please--branches--main',
                ref: 'refs/pull/4/head',
                repo_id: 1,
              },
              base: {label: 'main', ref: 'main', repo_id: 1},
            }),
          ],
          {'x-hasmore': 'false'}
        );
      const pullRequests = [];
      for await (const pullRequest of forgejo.pullRequestIterator(
        'main',
        'MERGED',
        Number.MAX_SAFE_INTEGER,
        false
      )) {
        pullRequests.push(pullRequest);
      }
      expect(pullRequests).to.have.lengthOf(1);
      expect(pullRequests[0].headBranchName).to.eql(
        'release-please--branches--main'
      );
      expect(pullRequests[0].title).to.eql('chore(main): release 1.0.0');
      scope.done();
    });

    it('fetches files when requested', async () => {
      const scope = nock(HOST)
        .get(`${API}/pulls`)
        .query({
          state: 'open',
          base: 'main',
          sort: 'recentupdate',
          page: '1',
          limit: '50',
        })
        .reply(200, [pullRequestResponse(5)], {'x-hasmore': 'false'})
        .get(`${API}/pulls/5/files`)
        .query({page: '1', limit: '50'})
        .reply(200, [{filename: 'x.txt'}], {'x-hasmore': 'false'});
      const pullRequests = [];
      for await (const pullRequest of forgejo.pullRequestIterator(
        'main',
        'OPEN'
      )) {
        pullRequests.push(pullRequest);
      }
      expect(pullRequests[0].files).to.eql(['x.txt']);
      scope.done();
    });

    it('stops after maxResults', async () => {
      const scope = nock(HOST)
        .get(`${API}/pulls`)
        .query(true)
        .reply(200, [
          pullRequestResponse(1, {merged: true}),
          pullRequestResponse(2, {merged: true}),
        ]);
      const numbers = [];
      for await (const pullRequest of forgejo.pullRequestIterator(
        'main',
        'MERGED',
        1,
        false
      )) {
        numbers.push(pullRequest.number);
      }
      expect(numbers).to.eql([1]);
      scope.done();
    });
  });

  describe('releaseIterator', () => {
    it('resolves tag commits and skips releases without tags', async () => {
      const scope = nock(HOST)
        .get(`${API}/releases`)
        .query({page: '1', limit: '50'})
        .reply(200, [
          {
            id: 1,
            name: 'v1.0.0',
            tag_name: 'v1.0.0',
            target_commitish: 'main',
            body: 'notes',
            html_url: `${HOST}/fake/fake/releases/tag/v1.0.0`,
            draft: false,
          },
          {
            id: 2,
            name: 'draft',
            tag_name: 'v2.0.0',
            target_commitish: 'main',
            html_url: `${HOST}/fake/fake/releases/tag/v2.0.0`,
            draft: true,
          },
        ])
        .get(`${API}/releases`)
        .query({page: '2', limit: '50'})
        .reply(200, [])
        .get(`${API}/tags/v1.0.0`)
        .reply(200, {name: 'v1.0.0', commit: {sha: 'tagsha'}})
        .get(`${API}/tags/v2.0.0`)
        .reply(404, {message: 'not found'});
      const releases = [];
      for await (const release of forgejo.releaseIterator()) {
        releases.push(release);
      }
      expect(releases).to.have.lengthOf(1);
      expect(releases[0]).to.include({
        id: 1,
        tagName: 'v1.0.0',
        sha: 'tagsha',
        notes: 'notes',
        url: `${HOST}/fake/fake/releases/tag/v1.0.0`,
      });
      scope.done();
    });

    it('iterates tags', async () => {
      const scope = nock(HOST)
        .get(`${API}/tags`)
        .query({page: '1', limit: '50'})
        .reply(200, [
          {name: 'v1.0.0', commit: {sha: 'a'}},
          {name: 'v0.9.0', commit: {sha: 'b'}},
        ]);
      const tags = [];
      for await (const tag of forgejo.tagIterator({maxResults: 1})) {
        tags.push(tag);
      }
      expect(tags).to.eql([{name: 'v1.0.0', sha: 'a'}]);
      scope.done();
    });

    it('reuses tag commits from tagIterator and stops after maxResults', async () => {
      const releaseResponse = (id: number, tagName: string) => ({
        id,
        name: null,
        tag_name: tagName,
        target_commitish: 'main',
        body: null,
        html_url: `${HOST}/fake/fake/releases/tag/${tagName}`,
        draft: false,
      });
      const scope = nock(HOST)
        .get(`${API}/tags`)
        .query(true)
        .reply(200, [{name: 'v1.0.0', commit: {sha: 'a'}}], {
          'x-hasmore': 'false',
        })
        .get(`${API}/releases`)
        .query(true)
        .reply(200, [
          releaseResponse(1, 'v1.0.0'),
          releaseResponse(2, 'v0.9.0'),
        ]);
      const tags = [];
      for await (const tag of forgejo.tagIterator()) {
        tags.push(tag);
      }
      const releases = [];
      for await (const release of forgejo.releaseIterator({maxResults: 1})) {
        releases.push(release);
      }
      expect(releases).to.eql([
        {
          id: 1,
          name: undefined,
          tagName: 'v1.0.0',
          sha: 'a',
          notes: undefined,
          url: `${HOST}/fake/fake/releases/tag/v1.0.0`,
          draft: false,
          uploadUrl: undefined,
        },
      ]);
      scope.done();
    });

    it('throws on tag lookup errors other than 404', async () => {
      const scope = nock(HOST)
        .get(`${API}/releases`)
        .query(true)
        .reply(
          200,
          [
            {
              id: 1,
              tag_name: 'v1.0.0',
              target_commitish: 'main',
              html_url: `${HOST}/fake/fake/releases/tag/v1.0.0`,
              draft: false,
            },
          ],
          {'x-hasmore': 'false'}
        )
        .get(`${API}/tags/v1.0.0`)
        .reply(500, {message: 'boom'});
      const error = await errorOf(async () => {
        for await (const release of forgejo.releaseIterator()) {
          expect(release).to.be.undefined;
        }
      });
      expect(error).to.be.instanceOf(RequestError);
      expect((error as RequestError).status).to.eql(500);
      scope.done();
    });
  });

  describe('createPullRequest', () => {
    const pullRequest = {
      headBranchName: 'release-please--branches--main',
      baseBranchName: 'main',
      number: -1,
      title: 'chore: release 1.0.0',
      body: 'release notes',
      labels: ['autorelease: pending', 'extra'],
      files: [],
    };

    it('commits all changes and opens a labeled pull request', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old', 'pkgsha'))
        .get(`${API}/contents/CHANGELOG.md`)
        .query({ref: 'main'})
        .reply(404, {message: 'not found'})
        .post(`${API}/contents`, body => {
          expect(body).to.eql({
            branch: 'main',
            new_branch: 'release-please--branches--main',
            force_overwrite_new_branch: true,
            message: 'chore: release 1.0.0',
            files: [
              {
                operation: 'update',
                path: 'package.json',
                content: b64('new'),
                sha: 'pkgsha',
              },
              {
                operation: 'create',
                path: 'CHANGELOG.md',
                content: b64('changelog'),
              },
            ],
          });
          return true;
        })
        .reply(201, {files: []})
        .get(`${API}/pulls`)
        .query({state: 'open', base: 'main', page: '1', limit: '50'})
        .reply(200, [])
        .post(`${API}/pulls`, {
          head: 'release-please--branches--main',
          base: 'main',
          title: 'chore: release 1.0.0',
          body: 'release notes',
        })
        .reply(201, pullRequestResponse(22))
        .get(`${API}/labels`)
        .query({page: '1', limit: '50'})
        .reply(200, [{id: 1, name: 'autorelease: pending'}], {
          'x-hasmore': 'false',
        })
        .get('/api/v1/orgs/fake/labels')
        .query({page: '1', limit: '50'})
        .reply(404, {message: 'not an organization'})
        .post(`${API}/labels`, {name: 'extra', color: '#ededed'})
        .reply(201, {id: 2, name: 'extra'})
        .post(`${API}/issues/22/labels`, {labels: [1, 2]})
        .reply(200, [])
        .get(`${API}/pulls/22`)
        .reply(200, pullRequestResponse(22));

      const created = await forgejo.createPullRequest(
        pullRequest,
        'main',
        'chore: release 1.0.0',
        [
          staticUpdate('package.json', 'new'),
          staticUpdate('CHANGELOG.md', 'changelog'),
        ]
      );
      expect(created.number).to.eql(22);
      expect(created.headBranchName).to.eql('release-please--branches--main');
      scope.done();
    });

    it('reuses an existing open pull request', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old', 'pkgsha'))
        .post(`${API}/contents`)
        .reply(201, {files: []})
        .get(`${API}/pulls`)
        .query({state: 'open', base: 'main', page: '1', limit: '50'})
        .reply(200, [
          pullRequestResponse(21, {head: {ref: 'other', repo_id: 1}}),
          pullRequestResponse(22),
        ])
        .get(`${API}/pulls/22`)
        .reply(200, pullRequestResponse(22));
      const created = await forgejo.createPullRequest(
        {...pullRequest, labels: []},
        'main',
        'chore: release 1.0.0',
        [staticUpdate('package.json', 'new')]
      );
      expect(created.number).to.eql(22);
      scope.done();
    });

    it('opens draft pull requests with a work in progress prefix', async () => {
      const draftResponse = pullRequestResponse(23, {
        title: 'WIP: chore: release 1.0.0',
        draft: true,
      });
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old', 'pkgsha'))
        .post(`${API}/contents`)
        .reply(201, {files: []})
        .get(`${API}/pulls`)
        .query({state: 'open', base: 'main', page: '1', limit: '50'})
        .reply(200, [])
        .post(`${API}/pulls`, body => {
          expect(body.title).to.eql('WIP: chore: release 1.0.0');
          return true;
        })
        .reply(201, draftResponse)
        .get(`${API}/pulls/23`)
        .reply(200, draftResponse);
      const created = await forgejo.createPullRequest(
        {...pullRequest, labels: []},
        'main',
        'chore: release 1.0.0',
        [staticUpdate('package.json', 'new')],
        {draft: true}
      );
      expect(created.number).to.eql(23);
      expect(created.title).to.eql('chore: release 1.0.0');
      scope.done();
    });

    it('uses a configured work in progress prefix', async () => {
      const github = new Forgejo({
        repository: forgejo.repository,
        request: request.defaults({
          baseUrl: `${HOST}/api/v1`,
          request: {fetch},
        }),
        webUrl: HOST,
        workInProgressPrefix: ' Draft: ',
      });
      const draftResponse = pullRequestResponse(24, {
        title: 'Draft: chore: release 1.0.0',
        draft: true,
      });
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old', 'pkgsha'))
        .post(`${API}/contents`)
        .reply(201, {files: []})
        .get(`${API}/pulls`)
        .query({state: 'open', base: 'main', page: '1', limit: '50'})
        .reply(200, [])
        .post(`${API}/pulls`, body => {
          expect(body.title).to.eql('Draft: chore: release 1.0.0');
          return true;
        })
        .reply(201, draftResponse)
        .get(`${API}/pulls/24`)
        .reply(200, draftResponse);
      const created = await github.createPullRequest(
        {...pullRequest, labels: []},
        'main',
        'chore: release 1.0.0',
        [staticUpdate('package.json', 'new')],
        {draft: true}
      );
      expect(created.title).to.eql('chore: release 1.0.0');
      scope.done();
    });

    it('skips unchanged files and returns 0 without changes', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('same'))
        .get(`${API}/contents/missing.txt`)
        .query({ref: 'main'})
        .reply(404, {message: 'not found'});
      const created = await forgejo.createPullRequest(
        pullRequest,
        'main',
        'chore: release 1.0.0',
        [
          staticUpdate('package.json', 'same'),
          staticUpdate('missing.txt', 'x', false),
        ]
      );
      expect(created.number).to.eql(0);
      scope.done();
    });

    it('explains that Forgejo v16 is required to overwrite branches', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old'))
        .post(`${API}/contents`)
        .reply(422, {message: 'branch already exists'})
        .get('/api/v1/version')
        .reply(200, {version: '15.0.2+gitea-1.22.0'});
      let error: unknown;
      try {
        await forgejo.createPullRequest(
          pullRequest,
          'main',
          'chore: release 1.0.0',
          [staticUpdate('package.json', 'new')]
        );
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(ConfigurationError);
      expect((error as Error).message).to.include('v16');
      scope.done();
    });

    it('warns about forks and instances that do not mark drafts', async () => {
      const logger = spyLogger();
      const github = await createForgejo(logger);
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old', 'pkgsha'))
        .post(`${API}/contents`)
        .reply(201, {files: []})
        .get(`${API}/pulls`)
        .query({state: 'open', base: 'main', page: '1', limit: '50'})
        .reply(200, [])
        .post(`${API}/pulls`)
        .reply(201, pullRequestResponse(25, {draft: false}))
        .get(`${API}/pulls/25`)
        .reply(200, pullRequestResponse(25));
      await github.createPullRequest(
        {...pullRequest, labels: []},
        'main',
        'chore: release 1.0.0',
        [staticUpdate('package.json', 'new')],
        {draft: true, fork: true}
      );
      sinon.assert.calledWithMatch(
        logger.warn,
        'opening pull requests from forks is not supported'
      );
      sinon.assert.calledWithMatch(
        logger.warn,
        'did not mark pull request 25 as draft'
      );
      scope.done();
    });

    it('rethrows 422 errors if the version is not below v16', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old'))
        .post(`${API}/contents`)
        .reply(422, {message: 'invalid'})
        .get('/api/v1/version')
        .reply(200, {version: 'development'});
      const error = await errorOf(() =>
        forgejo.createPullRequest(pullRequest, 'main', 'chore: release 1.0.0', [
          staticUpdate('package.json', 'new'),
        ])
      );
      expect(error).to.be.instanceOf(GitHubAPIError);
      expect((error as GitHubAPIError).status).to.eql(422);
      scope.done();
    });
  });

  describe('updatePullRequest', () => {
    function releasePullRequest(draft: boolean) {
      return {
        title: PullRequestTitle.ofTargetBranchVersion(
          'main',
          Version.parse('1.0.0')
        ),
        body: new PullRequestBody([{notes: 'release notes'}]),
        labels: [],
        headRefName: 'release-please--branches--main',
        draft,
        updates: [staticUpdate('package.json', 'new')],
      };
    }

    it('keeps the work in progress prefix of draft pull requests', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old', 'pkgsha'))
        .post(`${API}/contents`)
        .reply(201, {files: []})
        .get(`${API}/pulls/22`)
        .reply(
          200,
          pullRequestResponse(22, {
            title: '[WIP] chore(main): release 0.9.0',
            draft: true,
          })
        )
        .patch(`${API}/pulls/22`, body => {
          expect(body.title).to.eql('[WIP] chore(main): release 1.0.0');
          return true;
        })
        .reply(
          200,
          pullRequestResponse(22, {
            title: '[WIP] chore(main): release 1.0.0',
            draft: true,
          })
        );
      const updated = await forgejo.updatePullRequest(
        22,
        releasePullRequest(true),
        'main'
      );
      expect(updated.title).to.eql('chore(main): release 1.0.0');
      scope.done();
    });

    it('force-updates the branch and edits the pull request', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old', 'pkgsha'))
        .post(`${API}/contents`, body => {
          expect(body.new_branch).to.eql('release-please--branches--main');
          expect(body.force_overwrite_new_branch).to.be.true;
          expect(body.message).to.eql(
            'chore(main): release 1.0.0\n\nSigned-off-by: Bot <bot@example.com>'
          );
          return true;
        })
        .reply(201, {files: []})
        // marked as ready: stays ready even if drafts are configured
        .get(`${API}/pulls/22`)
        .reply(200, pullRequestResponse(22, {draft: false}))
        .patch(`${API}/pulls/22`, body => {
          expect(body.title).to.eql('chore(main): release 1.0.0');
          expect(body.state).to.eql('open');
          expect(body.body).to.include('release notes');
          return true;
        })
        .reply(200, pullRequestResponse(22));
      const updated = await forgejo.updatePullRequest(
        22,
        releasePullRequest(true),
        'main',
        {signoffUser: 'Bot <bot@example.com>'}
      );
      expect(updated.number).to.eql(22);
      scope.done();
    });

    it('only edits the pull request without code changes', async () => {
      const logger = spyLogger();
      const github = await createForgejo(logger);
      const handleOverflow = sinon.stub().resolves('overflow body');
      const scope = nock(HOST)
        .get(`${API}/contents/package.json`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('new'))
        .get(`${API}/pulls/22`)
        .reply(
          200,
          pullRequestResponse(22, {
            title: 'WIP: chore(main): release 0.9.0',
            draft: true,
          })
        )
        .patch(`${API}/pulls/22`, body => {
          expect(body).to.eql({
            title: 'WIP: chore(main): release 1.0.0',
            body: 'overflow body',
            state: 'open',
          });
          return true;
        })
        .reply(200, pullRequestResponse(22, {draft: false}));
      await github.updatePullRequest(22, releasePullRequest(true), 'main', {
        fork: true,
        pullRequestOverflowHandler: {
          handleOverflow,
        } as unknown as PullRequestOverflowHandler,
      });
      sinon.assert.calledOnce(handleOverflow);
      sinon.assert.calledWithMatch(
        logger.warn,
        'opening pull requests from forks is not supported'
      );
      sinon.assert.calledWithMatch(logger.warn, 'no code changes detected');
      sinon.assert.calledWithMatch(
        logger.warn,
        'Pull request 22 is no longer a draft'
      );
      scope.done();
    });
  });

  describe('createRelease', () => {
    const release = {
      tag: new TagName(Version.parse('1.2.3'), undefined, undefined, true),
      sha: 'abc123',
      notes: 'Some release notes',
      name: 'v1.2.3',
    };

    it('creates a release', async () => {
      const scope = nock(HOST)
        .post(`${API}/tags`, {tag_name: 'v1.2.3', target: 'abc123'})
        .reply(409, {message: 'tag exists'})
        .post(`${API}/releases`, {
          tag_name: 'v1.2.3',
          target_commitish: 'abc123',
          name: 'v1.2.3',
          body: 'Some release notes',
          draft: false,
          prerelease: true,
        })
        .reply(201, {
          id: 7,
          name: 'v1.2.3',
          tag_name: 'v1.2.3',
          target_commitish: 'abc123',
          body: 'Some release notes',
          html_url: `${HOST}/fake/fake/releases/tag/v1.2.3`,
          upload_url: `${HOST}/api/v1/repos/fake/fake/releases/7/assets`,
          draft: false,
        });
      const created = await forgejo.createRelease(release, {
        forceTag: true,
        prerelease: true,
      });
      expect(created).to.eql({
        id: 7,
        name: 'v1.2.3',
        tagName: 'v1.2.3',
        sha: 'abc123',
        notes: 'Some release notes',
        url: `${HOST}/fake/fake/releases/tag/v1.2.3`,
        draft: false,
        uploadUrl: `${HOST}/api/v1/repos/fake/fake/releases/7/assets`,
      });
      scope.done();
    });

    it('throws DuplicateReleaseError if the release exists', async () => {
      const scope = nock(HOST)
        .post(`${API}/releases`)
        .reply(409, {message: 'Release is has no Tag'});
      let error: unknown;
      try {
        await forgejo.createRelease(release);
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(DuplicateReleaseError);
      expect((error as DuplicateReleaseError).tag).to.eql('v1.2.3');
      scope.done();
    });

    it('rethrows errors creating the tag or the release', async () => {
      const scope = nock(HOST)
        .post(`${API}/tags`)
        .reply(500, {message: 'boom'})
        .post(`${API}/releases`)
        .reply(500, {message: 'boom'});
      const tagError = await errorOf(() =>
        forgejo.createRelease(release, {forceTag: true})
      );
      expect(tagError).to.be.instanceOf(GitHubAPIError);
      const releaseError = await errorOf(() => forgejo.createRelease(release));
      expect(releaseError).to.be.instanceOf(GitHubAPIError);
      expect(releaseError).to.not.be.instanceOf(DuplicateReleaseError);
      scope.done();
    });
  });

  describe('issues', () => {
    it('comments on an issue', async () => {
      const scope = nock(HOST)
        .post(`${API}/issues/3/comments`, {body: 'hello'})
        .reply(201, {html_url: `${HOST}/fake/fake/issues/3#issuecomment-1`});
      const url = await forgejo.commentOnIssue('hello', 3);
      expect(url).to.eql(`${HOST}/fake/fake/issues/3#issuecomment-1`);
      scope.done();
    });

    it('removes known labels by id', async () => {
      const scope = nock(HOST)
        .get(`${API}/labels`)
        .query(true)
        .reply(200, [{id: 1, name: 'autorelease: pending'}], {
          'x-hasmore': 'false',
        })
        .get('/api/v1/orgs/fake/labels')
        .query(true)
        .reply(200, [{id: 9, name: 'org-label'}], {'x-hasmore': 'false'})
        .delete(`${API}/issues/3/labels/1`)
        .reply(204)
        .delete(`${API}/issues/3/labels/9`)
        .reply(404, {message: 'not found'});
      await forgejo.removeIssueLabels(
        ['autorelease: pending', 'org-label', 'unknown'],
        3
      );
      scope.done();
    });

    it('does nothing without labels', async () => {
      await forgejo.addIssueLabels([], 3);
      await forgejo.removeIssueLabels([], 3);
    });
  });

  describe('createFileOnNewBranch', () => {
    it('creates the file on a force-overwritten branch', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/release-notes.md`)
        .query({ref: 'main'})
        .reply(404, {message: 'not found'})
        .post(`${API}/contents`, body => {
          expect(body.branch).to.eql('main');
          expect(body.new_branch).to.eql('my-branch--release-notes');
          expect(body.force_overwrite_new_branch).to.be.true;
          expect(body.files[0]).to.eql({
            operation: 'create',
            path: 'release-notes.md',
            content: b64('notes'),
          });
          return true;
        })
        .reply(201, {
          files: [
            {
              html_url: `${HOST}/fake/fake/src/branch/my-branch--release-notes/release-notes.md`,
            },
          ],
        });
      const url = await forgejo.createFileOnNewBranch(
        'release-notes.md',
        'notes',
        'my-branch--release-notes',
        'main'
      );
      expect(url).to.eql(
        `${HOST}/fake/fake/src/branch/my-branch--release-notes/release-notes.md`
      );
      scope.done();
    });

    it('updates an existing file and builds the URL itself', async () => {
      const scope = nock(HOST)
        .get(`${API}/contents/release-notes.md`)
        .query({ref: 'main'})
        .reply(200, contentsResponse('old notes', 'notessha'))
        .post(`${API}/contents`, body => {
          expect(body.files).to.eql([
            {
              operation: 'update',
              path: 'release-notes.md',
              content: b64('notes'),
              sha: 'notessha',
            },
          ]);
          return true;
        })
        .reply(201, {files: [null]});
      const url = await forgejo.createFileOnNewBranch(
        'release-notes.md',
        'notes',
        'my-branch',
        'main'
      );
      expect(url).to.eql(
        `${HOST}/fake/fake/src/branch/my-branch/release-notes.md`
      );
      scope.done();
    });
  });

  describe('generateReleaseNotes', () => {
    it('is not supported', async () => {
      let error: unknown;
      try {
        await forgejo.generateReleaseNotes('v1.0.0', 'main');
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(ConfigurationError);
    });
  });
});
