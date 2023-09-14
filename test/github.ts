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

import * as nock from 'nock';
import {expect} from 'chai';
import {afterEach, beforeEach, describe, it} from 'mocha';
nock.disableNetConnect();

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import * as sinon from 'sinon';

import {GH_API_URL, GitHub, GitHubRelease} from '../src/github';
import {PullRequest} from '../src/pull-request';
import {TagName} from '../src/util/tag-name';
import {Version} from '../src/version';
import assert = require('assert');
import {
  DuplicateReleaseError,
  GitHubAPIError,
  FileNotFoundError,
} from '../src/errors';
import {fail} from 'assert';
import {PullRequestBody} from '../src/util/pull-request-body';
import {PullRequestTitle} from '../src/util/pull-request-title';
import * as codeSuggesterCommitAndPush from 'code-suggester/build/src/github/commit-and-push';
import {HttpsProxyAgent} from 'https-proxy-agent';
import {HttpProxyAgent} from 'http-proxy-agent';
import {Commit} from '../src/commit';
import {mockReleaseData, MockPullRequestOverflowHandler} from './helpers';

const fixturesPath = './test/fixtures';
const sandbox = sinon.createSandbox();

describe('GitHub', () => {
  let github: GitHub;
  let req: nock.Scope;

  function getNock() {
    return nock('https://api.github.com/')
      .get('/repos/fake/fake')
      .optionally()
      .reply(200, {
        default_branch: 'main',
      });
  }

  beforeEach(async () => {
    // Reset this before each test so we get a consistent
    // set of requests (some things are cached).
    github = await GitHub.create({
      owner: 'fake',
      repo: 'fake',
      defaultBranch: 'main',
    });

    // This shared nock will take care of some common requests.
    req = getNock();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('create', () => {
    it('allows configuring the default branch explicitly', async () => {
      const github = await GitHub.create({
        owner: 'some-owner',
        repo: 'some-repo',
        defaultBranch: 'some-branch',
      });
      expect(github.repository.defaultBranch).to.eql('some-branch');
    });

    it('fetches the default branch', async () => {
      req.get('/repos/some-owner/some-repo').reply(200, {
        default_branch: 'some-branch-from-api',
      });
      const github = await GitHub.create({
        owner: 'some-owner',
        repo: 'some-repo',
      });
      req.done();

      expect(github.repository.defaultBranch).to.eql('some-branch-from-api');
    });

    it('default agent is undefined when no proxy option passed ', () => {
      expect(GitHub.createDefaultAgent('test_url')).eq(undefined);
    });

    it('should return a https agent', () => {
      expect(
        GitHub.createDefaultAgent(GH_API_URL, {
          host: 'http://proxy.com',
          port: 3000,
        })
      ).instanceof(HttpsProxyAgent);
    });

    it('should throw error when baseUrl is an invalid url', () => {
      expect(() => {
        GitHub.createDefaultAgent('invalid_url', {
          host: 'http://proxy.com',
          port: 3000,
        });
      }).to.throw('Invalid URL');
    });

    it('should return a http agent', () => {
      expect(
        GitHub.createDefaultAgent('http://www.github.com', {
          host: 'http://proxy.com',
          port: 3000,
        })
      ).instanceof(HttpProxyAgent);
    });

    it('should enable octokit throttling plugin', async () => {
      req.get('/repos/some-owner/some-repo').reply(
        403,
        {
          message:
            "API rate limit exceeded for xxx.xxx.xxx.xxx. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)",
          documentation_url:
            'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting',
        },
        {
          'x-ratelimit-limit': '60',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-used': '60',
          'x-ratelimit-reset': '1377013266',
        }
      );
      req.get('/repos/some-owner/some-repo').reply(200, {
        default_branch: 'some-branch-from-api',
      });
      const github = await GitHub.create({
        owner: 'some-owner',
        repo: 'some-repo',
        throttlingRetries: 1,
      });
      req.done();

      expect(github.repository.defaultBranch).to.eql('some-branch-from-api');
    });

    it('should enable octokit retry plugins', async () => {
      req.get('/repos/some-owner/some-repo').reply(500, {
        message: 'Server error',
      });
      req.get('/repos/some-owner/some-repo').reply(200, {
        default_branch: 'some-branch-from-api',
      });
      const github = await GitHub.create({
        owner: 'some-owner',
        repo: 'some-repo',
        retries: 1,
      });
      req.done();

      expect(github.repository.defaultBranch).to.eql('some-branch-from-api');
    });

    it('should enable octokit retry and trottling plugins', async () => {
      req.get('/repos/some-owner/some-repo').reply(500, {
        // handled by retry plugin
        message: 'Server error',
      });
      req.get('/repos/some-owner/some-repo').reply(
        // handled by throttling plugin
        403,
        {
          message:
            "API rate limit exceeded for xxx.xxx.xxx.xxx. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)",
          documentation_url:
            'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting',
        },
        {
          'x-ratelimit-limit': '60',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-used': '60',
          'x-ratelimit-reset': '1377013266',
        }
      );
      req.get('/repos/some-owner/some-repo').reply(200, {
        default_branch: 'some-branch-from-api',
      });
      const github = await GitHub.create({
        owner: 'some-owner',
        repo: 'some-repo',
        retries: 1,
        throttlingRetries: 1,
      });
      req.done();

      expect(github.repository.defaultBranch).to.eql('some-branch-from-api');
    });
  });

  describe('findFilesByFilename', () => {
    it('returns files matching the requested pattern', async () => {
      const fileSearchResponse = JSON.parse(
        readFileSync(resolve(fixturesPath, 'pom-file-search.json'), 'utf8')
      );
      req
        .get('/repos/fake/fake/git/trees/main?recursive=true')
        .reply(200, fileSearchResponse);
      const pomFiles = await github.findFilesByFilenameAndRef(
        'pom.xml',
        'main'
      );
      snapshot(pomFiles);
      req.done();
    });

    const prefixes = [
      'appengine',
      'appengine/',
      '/appengine',
      '/appengine/',
      'appengine\\',
      '\\appengine',
      '\\appengine\\',
    ];
    prefixes.forEach(prefix => {
      it(`scopes pattern matching files to prefix(${prefix})`, async () => {
        const fileSearchResponse = JSON.parse(
          readFileSync(
            resolve(fixturesPath, 'pom-file-search-with-prefix.json'),
            'utf8'
          )
        );
        req
          .get('/repos/fake/fake/git/trees/main?recursive=true')
          .reply(200, fileSearchResponse);
        const pomFiles = await github.findFilesByFilenameAndRef(
          'pom.xml',
          'main',
          prefix
        );
        req.done();
        expect(pomFiles).to.deep.equal(['pom.xml', 'foo/pom.xml']);
      });
    });
  });

  describe('findFilesByExtension', () => {
    it('returns files matching the requested pattern', async () => {
      const fileSearchResponse = JSON.parse(
        readFileSync(resolve(fixturesPath, 'pom-file-search.json'), 'utf8')
      );
      req
        .get('/repos/fake/fake/git/trees/main?recursive=true')
        .reply(200, fileSearchResponse);
      const pomFiles = await github.findFilesByExtensionAndRef('xml', 'main');
      snapshot(pomFiles);
      req.done();
    });

    const prefixes = [
      'appengine',
      'appengine/',
      '/appengine',
      '/appengine/',
      'appengine\\',
      '\\appengine',
      '\\appengine\\',
    ];
    prefixes.forEach(prefix => {
      it(`scopes pattern matching files to prefix(${prefix})`, async () => {
        const fileSearchResponse = JSON.parse(
          readFileSync(
            resolve(fixturesPath, 'pom-file-search-with-prefix.json'),
            'utf8'
          )
        );
        req
          .get('/repos/fake/fake/git/trees/main?recursive=true')
          .reply(200, fileSearchResponse);
        const pomFiles = await github.findFilesByExtensionAndRef(
          'xml',
          'main',
          prefix
        );
        req.done();
        expect(pomFiles).to.deep.equal(['pom.xml', 'foo/pom.xml']);
      });
    });
    it('ensures the prefix is a directory', async () => {
      const fileSearchResponse = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'pom-file-search-with-prefix.json'),
          'utf8'
        )
      );
      req
        .get('/repos/fake/fake/git/trees/main?recursive=true')
        .reply(200, fileSearchResponse);
      const pomFiles = await github.findFilesByExtensionAndRef(
        'xml',
        'main',
        'appengine'
      );
      req.done();
      expect(pomFiles).to.deep.equal(['pom.xml', 'foo/pom.xml']);
    });
  });

  describe('getFileContents', () => {
    beforeEach(() => {
      const dataAPITreesResponse = JSON.parse(
        readFileSync(
          resolve(
            fixturesPath,
            'github-data-api',
            'data-api-trees-successful-response.json'
          ),
          'utf8'
        )
      );
      req = req
        .get('/repos/fake/fake/git/trees/main?recursive=true')
        .reply(200, dataAPITreesResponse);
    });
    it('should support Github Data API in case of a big file', async () => {
      const dataAPIBlobResponse = JSON.parse(
        readFileSync(
          resolve(
            fixturesPath,
            'github-data-api',
            'data-api-blobs-successful-response.json'
          ),
          'utf8'
        )
      );

      req = req
        .get(
          '/repos/fake/fake/git/blobs/2f3d2c47bf49f81aca0df9ffc49524a213a2dc33'
        )
        .reply(200, dataAPIBlobResponse);

      const fileContents = await github.getFileContentsOnBranch(
        'package-lock.json',
        'main'
      );
      expect(fileContents).to.have.property('content');
      expect(fileContents).to.have.property('parsedContent');
      expect(fileContents)
        .to.have.property('sha')
        .equal('2f3d2c47bf49f81aca0df9ffc49524a213a2dc33');
      snapshot(fileContents);
      req.done();
    });

    it('should throw a missing file error', async () => {
      await assert.rejects(async () => {
        await github.getFileContentsOnBranch('non-existent-file', 'main');
      }, FileNotFoundError);
    });
  });

  describe('pullRequestIterator', () => {
    it('finds merged pull requests with labels', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'merged-pull-requests.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const generator = github.pullRequestIterator('main');
      const pullRequests: PullRequest[] = [];
      for await (const pullRequest of generator) {
        pullRequests.push(pullRequest);
      }
      expect(pullRequests).lengthOf(25);
      snapshot(pullRequests!);
      req.done();
    });
    it('handles merged pull requests without files', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'merged-pull-requests-no-files.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const generator = github.pullRequestIterator('main');
      const pullRequests: PullRequest[] = [];
      for await (const pullRequest of generator) {
        pullRequests.push(pullRequest);
      }
      expect(pullRequests).lengthOf(25);
      snapshot(pullRequests!);
      req.done();
    });
    it('uses REST API if files are not needed', async () => {
      req
        .get(
          '/repos/fake/fake/pulls?base=main&state=closed&sort=updated&direction=desc'
        )
        .reply(200, [
          {
            head: {
              ref: 'feature-branch',
            },
            base: {
              ref: 'main',
            },
            number: 123,
            title: 'some title',
            body: 'some body',
            labels: [{name: 'label 1'}, {name: 'label 2'}],
            merge_commit_sha: 'abc123',
            merged_at: '2022-08-08T19:07:20Z',
          },
          {
            head: {
              ref: 'feature-branch',
            },
            base: {
              ref: 'main',
            },
            number: 124,
            title: 'merged title 2 ',
            body: 'merged body 2',
            labels: [{name: 'label 1'}, {name: 'label 2'}],
            merge_commit_sha: 'abc123',
            merged_at: '2022-08-08T19:07:20Z',
          },
          {
            head: {
              ref: 'feature-branch',
            },
            base: {
              ref: 'main',
            },
            number: 125,
            title: 'closed title',
            body: 'closed body',
            labels: [{name: 'label 1'}, {name: 'label 2'}],
            merge_commit_sha: 'def234',
          },
        ]);
      const generator = github.pullRequestIterator('main', 'MERGED', 30, false);
      const pullRequests: PullRequest[] = [];
      for await (const pullRequest of generator) {
        pullRequests.push(pullRequest);
      }
      expect(pullRequests).lengthOf(2);
      snapshot(pullRequests!);
      req.done();
    });
  });

  describe('commitsSince', () => {
    it('finds commits up until a condition', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const targetBranch = 'main';
      const commitsSinceSha = await github.commitsSince(
        targetBranch,
        commit => {
          // this commit is the 2nd most recent
          return commit.sha === 'b29149f890e6f76ee31ed128585744d4c598924c';
        }
      );
      expect(commitsSinceSha.length).to.eql(1);
      snapshot(commitsSinceSha);
      req.done();
    });

    it('paginates through commits', async () => {
      const graphql1 = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since-page-1.json'), 'utf8')
      );
      const graphql2 = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since-page-2.json'), 'utf8')
      );
      req
        .post('/graphql')
        .reply(200, {
          data: graphql1,
        })
        .post('/graphql')
        .reply(200, {
          data: graphql2,
        });
      const targetBranch = 'main';
      const commitsSinceSha = await github.commitsSince(
        targetBranch,
        commit => {
          // this commit is on page 2
          return commit.sha === 'c6d9dfb03aa2dbe1abc329592af60713fe28586d';
        }
      );
      expect(commitsSinceSha.length).to.eql(11);
      snapshot(commitsSinceSha);
      req.done();
    });

    it('finds first commit of a multi-commit merge pull request', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const targetBranch = 'main';
      const commitsSinceSha = await github.commitsSince(
        targetBranch,
        commit => {
          // PR #6 was rebase/merged so it has 4 associated commits
          return commit.pullRequest?.number === 6;
        }
      );
      expect(commitsSinceSha.length).to.eql(3);
      snapshot(commitsSinceSha);
      req.done();
    });

    it('limits pagination', async () => {
      const graphql1 = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since-page-1.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql1,
      });
      const targetBranch = 'main';
      const commitsSinceSha = await github.commitsSince(
        targetBranch,
        commit => {
          // this commit is on page 2
          return commit.sha === 'c6d9dfb03aa2dbe1abc329592af60713fe28586d';
        },
        {
          maxResults: 10,
        }
      );
      expect(commitsSinceSha.length).to.eql(10);
      snapshot(commitsSinceSha);
      req.done();
    });

    it('returns empty commits if branch does not exist', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-since-missing-branch.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const targetBranch = 'main';
      const commitsSinceSha = await github.commitsSince(
        targetBranch,
        _commit => {
          return true;
        }
      );
      expect(commitsSinceSha.length).to.eql(0);
      req.done();
    });

    it('backfills commit files without pull requests', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since.json'), 'utf8')
      );
      req
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        .get(
          '/repos/fake/fake/commits/0cda26c2e7776748072ba5a24302474947b3ebbd'
        )
        .reply(200, {files: [{filename: 'abc'}]})
        .get(
          '/repos/fake/fake/commits/c6d9dfb03aa2dbe1abc329592af60713fe28586d'
        )
        .reply(200, {files: [{filename: 'def'}]})
        .get(
          '/repos/fake/fake/commits/c8f1498c92c323bfa8f5ffe84e0ade1c37e4ea6e'
        )
        .reply(200, {files: [{filename: 'ghi'}]});
      const targetBranch = 'main';
      const commitsSinceSha = await github.commitsSince(
        targetBranch,
        commit => {
          // this commit is the 2nd most recent
          return commit.sha === 'b29149f890e6f76ee31ed128585744d4c598924c';
        },
        {backfillFiles: true}
      );
      expect(commitsSinceSha.length).to.eql(1);
      snapshot(commitsSinceSha);
      req.done();
    });

    it('backfills commit files for pull requests with lots of files', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-since-many-files.json'),
          'utf8'
        )
      );
      req
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        .get(
          '/repos/fake/fake/commits/e6daec403626c9987c7af0d97b34f324cd84320a'
        )
        .reply(200, {files: [{filename: 'abc'}]});
      const targetBranch = 'main';
      const commitsSinceSha = await github.commitsSince(
        targetBranch,
        commit => {
          // this commit is the 2nd most recent
          return commit.sha === 'b29149f890e6f76ee31ed128585744d4c598924c';
        },
        {backfillFiles: true}
      );
      expect(commitsSinceSha.length).to.eql(1);
      snapshot(commitsSinceSha);
      req.done();
    });
  });

  describe('mergeCommitIterator', () => {
    it('handles merged pull requests without files', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-since-no-files.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const generator = github.mergeCommitIterator('main');
      const commits: Commit[] = [];
      for await (const commit of generator) {
        commits.push(commit);
      }
      expect(commits).lengthOf(2);
      snapshot(commits!);
      req.done();
    });
  });

  describe('getCommitFiles', () => {
    it('fetches the list of files', async () => {
      req
        .get('/repos/fake/fake/commits/abc123')
        .reply(200, {files: [{filename: 'abc'}]});
      const files = await github.getCommitFiles('abc123');
      expect(files).to.eql(['abc']);
      req.done();
    });

    it('paginates', async () => {
      req
        .get('/repos/fake/fake/commits/abc123')
        .reply(
          200,
          {files: [{filename: 'abc'}]},
          {
            link: '<https://api.github.com/repos/fake/fake/commits/abc123?page=2>; rel="next", <https://api.github.com/repos/fake/fake/commits/abc123?page=2>; rel="last"',
          }
        )
        .get('/repos/fake/fake/commits/abc123?page=2')
        .reply(200, {files: [{filename: 'def'}]});
      const files = await github.getCommitFiles('abc123');
      expect(files).to.eql(['abc', 'def']);
      req.done();
    });
  });

  describe('releaseIterator', () => {
    it('iterates through releases', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'releases.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const generator = github.releaseIterator();
      const releases: GitHubRelease[] = [];
      for await (const release of generator) {
        releases.push(release);
      }
      expect(releases).lengthOf(5);
    });

    it('iterates through up to 3 releases', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'releases.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const generator = github.releaseIterator({maxResults: 3});
      const releases: GitHubRelease[] = [];
      for await (const release of generator) {
        releases.push(release);
      }
      expect(releases).lengthOf(3);
    });

    it('correctly identifies draft releases', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'releases.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const generator = github.releaseIterator();
      let drafts = 0;
      for await (const release of generator) {
        if (release.draft) {
          drafts++;
        }
      }
      expect(drafts).eq(1);
    });

    it('iterates through a result withouth releases', async () => {
      req.post('/graphql').reply(200, {
        data: {
          repository: {
            releases: {
              nodes: [],
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
          },
        },
      });
      const generator = github.releaseIterator();
      const releases: GitHubRelease[] = [];
      for await (const release of generator) {
        releases.push(release);
      }
      expect(releases).lengthOf(0);
    });
  });

  describe('createRelease', () => {
    let githubCreateReleaseSpy: sinon.SinonSpy;
    beforeEach(async () => {
      githubCreateReleaseSpy = sandbox.spy(
        github['octokit'].repos,
        'createRelease'
      );
    });
    it('should create a release with a package prefix', async () => {
      req
        .post('/repos/fake/fake/releases', body => {
          snapshot(body);
          return true;
        })
        .reply(200, {
          id: 123456,
          tag_name: 'v1.2.3',
          draft: false,
          html_url: 'https://github.com/fake/fake/releases/v1.2.3',
          upload_url:
            'https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}',
          target_commitish: 'abc123',
          body: 'Some release notes response.',
        });
      const release = await github.createRelease({
        tag: new TagName(Version.parse('1.2.3')),
        sha: 'abc123',
        notes: 'Some release notes',
      });
      req.done();
      sinon.assert.calledOnceWithExactly(githubCreateReleaseSpy, {
        name: undefined,
        owner: 'fake',
        repo: 'fake',
        tag_name: 'v1.2.3',
        body: 'Some release notes',
        target_commitish: 'abc123',
        draft: false,
        prerelease: false,
      });
      expect(release).to.not.be.undefined;
      expect(release.id).to.eql(123456);
      expect(release.tagName).to.eql('v1.2.3');
      expect(release.sha).to.eql('abc123');
      expect(release.draft).to.be.false;
      expect(release.uploadUrl).to.eql(
        'https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}'
      );
      expect(release.notes).to.eql('Some release notes response.');
    });

    it('should raise a DuplicateReleaseError if already_exists', async () => {
      req
        .post('/repos/fake/fake/releases', body => {
          snapshot(body);
          return true;
        })
        .reply(422, {
          message: 'Validation Failed',
          errors: [
            {
              resource: 'Release',
              code: 'already_exists',
              field: 'tag_name',
            },
          ],
          documentation_url:
            'https://docs.github.com/rest/reference/repos#create-a-release',
        });

      const promise = github.createRelease({
        tag: new TagName(Version.parse('1.2.3')),
        sha: 'abc123',
        notes: 'Some release notes',
      });
      await assert.rejects(
        promise,
        error => error instanceof DuplicateReleaseError
      );
    });

    it('should raise a RequestError for other validation errors', async () => {
      req
        .post('/repos/fake/fake/releases', body => {
          snapshot(body);
          return true;
        })
        .reply(422, {
          message: 'Invalid request.\n\n"tag_name" wasn\'t supplied.',
          documentation_url:
            'https://docs.github.com/rest/reference/repos#create-a-release',
        });

      const promise = github.createRelease({
        tag: new TagName(Version.parse('1.2.3')),
        sha: 'abc123',
        notes: 'Some release notes',
      });
      await assert.rejects(promise, error => error instanceof GitHubAPIError);
    });

    it('should create a draft release', async () => {
      req
        .post('/repos/fake/fake/releases', body => {
          snapshot(body);
          return true;
        })
        .reply(200, {
          tag_name: 'v1.2.3',
          draft: true,
          html_url: 'https://github.com/fake/fake/releases/v1.2.3',
          upload_url:
            'https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}',
          target_commitish: 'abc123',
        });
      const release = await github.createRelease(
        {
          tag: new TagName(Version.parse('1.2.3')),
          sha: 'abc123',
          notes: 'Some release notes',
        },
        {draft: true}
      );
      req.done();
      sinon.assert.calledOnceWithExactly(githubCreateReleaseSpy, {
        name: undefined,
        owner: 'fake',
        repo: 'fake',
        tag_name: 'v1.2.3',
        body: 'Some release notes',
        target_commitish: 'abc123',
        draft: true,
        prerelease: false,
      });
      expect(release).to.not.be.undefined;
      expect(release.tagName).to.eql('v1.2.3');
      expect(release.sha).to.eql('abc123');
      expect(release.draft).to.be.true;
    });

    it('should create a prerelease release', async () => {
      req
        .post('/repos/fake/fake/releases', body => {
          snapshot(body);
          return true;
        })
        .reply(200, {
          id: 123456,
          tag_name: 'v1.2.3',
          draft: false,
          html_url: 'https://github.com/fake/fake/releases/v1.2.3',
          upload_url:
            'https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}',
          target_commitish: 'abc123',
        });
      const release = await github.createRelease(
        {
          tag: new TagName(Version.parse('1.2.3')),
          sha: 'abc123',
          notes: 'Some release notes',
        },
        {prerelease: true}
      );
      req.done();
      sinon.assert.calledOnceWithExactly(githubCreateReleaseSpy, {
        name: undefined,
        owner: 'fake',
        repo: 'fake',
        tag_name: 'v1.2.3',
        body: 'Some release notes',
        target_commitish: 'abc123',
        draft: false,
        prerelease: true,
      });
      expect(release.id).to.eql(123456);
      expect(release.tagName).to.eql('v1.2.3');
      expect(release.sha).to.eql('abc123');
      expect(release.draft).to.be.false;
    });
  });

  describe('commentOnIssue', () => {
    it('can create a comment', async () => {
      const createCommentResponse = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'create-comment-response.json'),
          'utf8'
        )
      );
      req
        .post('/repos/fake/fake/issues/1347/comments', body => {
          snapshot(body);
          return true;
        })
        .reply(201, createCommentResponse);
      const url = await github.commentOnIssue('This is a comment', 1347);
      expect(url).to.eql(
        'https://github.com/fake/fake/issues/1347#issuecomment-1'
      );
    });

    it('propagates error', async () => {
      req.post('/repos/fake/fake/issues/1347/comments').reply(410, 'Gone');
      let thrown = false;
      try {
        await github.commentOnIssue('This is a comment', 1347);
        fail('should have thrown');
      } catch (err) {
        thrown = true;
        expect((err as GitHubAPIError).status).to.eql(410);
      }
      expect(thrown).to.be.true;
    });
  });

  describe('generateReleaseNotes', () => {
    it('can generate notes with previous tag', async () => {
      req
        .post('/repos/fake/fake/releases/generate-notes', body => {
          snapshot(body);
          return body;
        })
        .reply(200, {
          name: 'Release v1.0.0 is now available!',
          body: '##Changes in Release v1.0.0 ... ##Contributors @monalisa',
        });
      const notes = await github.generateReleaseNotes(
        'v1.2.3',
        'main',
        'v1.2.2'
      );
      expect(notes).to.eql(
        '##Changes in Release v1.0.0 ... ##Contributors @monalisa'
      );
    });
    it('can generate notes without previous tag', async () => {
      req
        .post('/repos/fake/fake/releases/generate-notes', body => {
          snapshot(body);
          return body;
        })
        .reply(200, {
          name: 'Release v1.0.0 is now available!',
          body: '##Changes in Release v1.0.0 ... ##Contributors @monalisa',
        });
      const notes = await github.generateReleaseNotes('v1.2.3', 'main');
      expect(notes).to.eql(
        '##Changes in Release v1.0.0 ... ##Contributors @monalisa'
      );
    });
  });

  describe('createFileOnNewBranch', () => {
    it('forks a new branch if the branch does not exist', async () => {
      req = req
        .get('/repos/fake/fake/git/ref/heads%2Fbase-branch')
        .reply(200, {
          object: {
            sha: 'abc123',
          },
        })
        .get('/repos/fake/fake/git/ref/heads%2Fnew-branch')
        .reply(404)
        .post('/repos/fake/fake/git/refs', body => {
          expect(body.ref).to.eql('refs/heads/new-branch');
          expect(body.sha).to.eql('abc123');
          return body;
        })
        .reply(201, {
          object: {sha: 'abc123'},
        })
        .put('/repos/fake/fake/contents/new-file.txt', body => {
          expect(body.message).to.eql('Saving release notes');
          expect(body.branch).to.eql('new-branch');
          expect(Buffer.from(body.content, 'base64').toString('utf-8')).to.eql(
            'some contents'
          );
          return body;
        })
        .reply(201, {
          content: {
            html_url: 'https://github.com/fake/fake/blob/new-file.txt',
          },
        });
      const url = await github.createFileOnNewBranch(
        'new-file.txt',
        'some contents',
        'new-branch',
        'base-branch'
      );
      expect(url).to.eql('https://github.com/fake/fake/blob/new-file.txt');
    });
    it('reuses an existing branch', async () => {
      req = req
        .get('/repos/fake/fake/git/ref/heads%2Fbase-branch')
        .reply(200, {
          object: {
            sha: 'abc123',
          },
        })
        .get('/repos/fake/fake/git/ref/heads%2Fnew-branch')
        .reply(200, {
          object: {
            sha: 'def234',
          },
        })
        .patch('/repos/fake/fake/git/refs/heads%2Fnew-branch', body => {
          expect(body.force).to.be.true;
          expect(body.sha).to.eql('abc123');
          return body;
        })
        .reply(200, {
          object: {sha: 'abc123'},
        })
        .put('/repos/fake/fake/contents/new-file.txt', body => {
          expect(body.message).to.eql('Saving release notes');
          expect(body.branch).to.eql('new-branch');
          expect(Buffer.from(body.content, 'base64').toString('utf-8')).to.eql(
            'some contents'
          );
          return body;
        })
        .reply(201, {
          content: {
            html_url: 'https://github.com/fake/fake/blob/new-file.txt',
          },
        });
      const url = await github.createFileOnNewBranch(
        'new-file.txt',
        'some contents',
        'new-branch',
        'base-branch'
      );
      expect(url).to.eql('https://github.com/fake/fake/blob/new-file.txt');
    });
  });

  describe('updatePullRequest', () => {
    it('handles a ref branch different from the base branch', async () => {
      const forkBranchStub = sandbox
        .stub(github, <any>'forkBranch') // eslint-disable-line @typescript-eslint/no-explicit-any
        .withArgs('release-please--branches--main--changes--next', 'next')
        .resolves('the-pull-request-branch-sha');

      const commitAndPushStub = sandbox
        .stub(codeSuggesterCommitAndPush, 'commitAndPush')
        .withArgs(
          sinon.match.any,
          'the-pull-request-branch-sha',
          sinon.match.any,
          sinon.match.has(
            'branch',
            'release-please--branches--main--changes--next'
          ),
          sinon.match.string,
          true
        )
        .resolves();

      const getPullRequestStub = sandbox
        .stub(github, 'getPullRequest')
        .withArgs(123)
        .resolves({
          title: 'updated-title',
          headBranchName: 'release-please--branches--main--changes--next',
          baseBranchName: 'main',
          number: 123,
          body: 'updated body',
          labels: [],
          files: [],
        });

      req = req.patch('/repos/fake/fake/pulls/123').reply(200, {
        number: 123,
        title: 'updated-title',
        body: 'updated body',
        labels: [],
        head: {
          ref: 'release-please--branches--main--changes--next',
        },
        base: {
          ref: 'main',
        },
      });

      const pullRequest = {
        title: PullRequestTitle.ofTargetBranch('main', 'next'),
        body: new PullRequestBody(mockReleaseData(1000), {
          useComponents: true,
        }),
        labels: [],
        headRefName: 'release-please--branches--main--changes--next',
        draft: false,
        updates: [],
      };

      await github.updatePullRequest(123, pullRequest, 'main', 'next');
      sinon.assert.calledOnce(forkBranchStub);
      sinon.assert.calledOnce(commitAndPushStub);
      sinon.assert.calledOnce(getPullRequestStub);
      req.done();
    });

    it('handles a PR body that is too big', async () => {
      const commitAndPushStub = sandbox
        .stub(codeSuggesterCommitAndPush, 'commitAndPush')
        .resolves();
      const forkBranchStub = sandbox
        .stub(github, <any>'forkBranch') // eslint-disable-line @typescript-eslint/no-explicit-any
        .resolves('the-pull-request-branch-sha');
      req = req.patch('/repos/fake/fake/pulls/123').reply(200, {
        number: 123,
        title: 'updated-title',
        body: 'updated body',
        labels: [],
        head: {
          ref: 'release-please--branches--main',
        },
        base: {
          ref: 'main',
        },
      });
      const getPullRequestStub = sandbox
        .stub(github, 'getPullRequest')
        .withArgs(123)
        .resolves({
          title: 'updated-title',
          headBranchName: 'release-please--branches--main',
          baseBranchName: 'main',
          number: 123,
          body: 'updated body',
          labels: [],
          files: [],
        });
      const pullRequest = {
        title: PullRequestTitle.ofTargetBranch('main', 'main'),
        body: new PullRequestBody(mockReleaseData(1000), {useComponents: true}),
        labels: [],
        headRefName: 'release-please--branches--main',
        draft: false,
        updates: [],
      };
      const pullRequestOverflowHandler = new MockPullRequestOverflowHandler();
      const handleOverflowStub = sandbox
        .stub(pullRequestOverflowHandler, 'handleOverflow')
        .resolves('overflow message');
      await github.updatePullRequest(123, pullRequest, 'main', 'main', {
        pullRequestOverflowHandler,
      });
      sinon.assert.calledOnce(handleOverflowStub);
      sinon.assert.calledOnce(commitAndPushStub);
      sinon.assert.calledOnce(forkBranchStub);
      sinon.assert.calledOnce(getPullRequestStub);
      req.done();
    });
  });

  describe('isBranchASyncedWithB', () => {
    it('returns true if branch A is ahead', async () => {
      req = req
        .get('/repos/fake/fake/compare/base-branch...new-branch')
        .reply(200, {
          status: 'ahead',
        });
      const result = await github.isBranchASyncedWithB(
        'new-branch',
        'base-branch'
      );
      req.done();
      expect(result).to.eql(true);
    });

    it('returns true when identical', async () => {
      req = req
        .get('/repos/fake/fake/compare/base-branch...new-branch')
        .reply(200, {
          status: 'identical',
        });
      const result = await github.isBranchASyncedWithB(
        'new-branch',
        'base-branch'
      );
      req.done();
      expect(result).to.eql(true);
    });

    it('returns false if branch A is behind', async () => {
      req = req
        .get('/repos/fake/fake/compare/base-branch...new-branch')
        .reply(200, {
          status: 'behind',
        });
      const result = await github.isBranchASyncedWithB(
        'new-branch',
        'base-branch'
      );
      req.done();
      expect(result).to.eql(false);
    });

    it('returns true if branch A diverged and all divergent commits are present in branch B', async () => {
      req = req
        .get('/repos/fake/fake/compare/base-branch...new-branch')
        .reply(200, {
          status: 'diverged',
          merge_base_commit: {sha: 'merge_base_sha'},
          commits: [{sha: 'commit1A'}, {sha: 'commit2A'}],
        })
        .get('/repos/fake/fake/compare/merge_base_sha...base-branch')
        .reply(200, {
          commits: [
            // shuffled order to be sure we don't rely on ordering
            {sha: 'commit2B'},
            {sha: 'CommitOnlyPresentInBranchB'},
            {sha: 'commit1B'},
          ],
        })
        // Commits exclusive to branch A
        .get('/repos/fake/fake/commits/commit1A')
        .reply(200, {
          commit: {
            message: 'message1',
          },
          files: [
            {
              sha: 'file_sha1',
              filename: 'file1.txt',
              status: 'added',
              additions: 10,
              deletions: 0,
              changes: 10,
              patch: 'patch_data1',
            },
          ],
        })
        .get('/repos/fake/fake/commits/commit2A')
        .reply(200, {
          commit: {
            message: 'message2',
          },
          files: [
            {
              sha: 'file_sha2',
              filename: 'file2.txt',
              status: 'removed',
              additions: 20,
              deletions: 30,
              changes: 40,
              patch: 'patch_data2',
            },
          ],
        })
        // Commits exclusive to branch B
        .get('/repos/fake/fake/commits/commit1B')
        .reply(200, {
          commit: {
            message: 'message1',
          },
          files: [
            {
              sha: 'file_sha1',
              filename: 'file1.txt',
              status: 'added',
              additions: 10,
              deletions: 0,
              changes: 10,
              patch: 'patch_data1',
            },
          ],
        })
        .get('/repos/fake/fake/commits/commit2B')
        .reply(200, {
          commit: {
            message: 'message2',
          },
          files: [
            {
              sha: 'file_sha2',
              filename: 'file2.txt',
              status: 'removed',
              additions: 20,
              deletions: 30,
              changes: 40,
              patch: 'patch_data2',
            },
          ],
        })
        .get('/repos/fake/fake/commits/CommitOnlyPresentInBranchB')
        .reply(200, {
          commit: {
            message: 'message3B',
          },
          files: [
            {
              sha: 'file_sha3',
              filename: 'file3.txt',
              status: 'deleted',
              additions: 50,
              deletions: 60,
              changes: 70,
              patch: 'patch_data3',
            },
          ],
        });

      const result = await github.isBranchASyncedWithB(
        'new-branch',
        'base-branch'
      );
      req.done();

      expect(result).to.be.true;
    });

    it('returns false if branch A diverged and at least one commit is not present in branch B (message)', async () => {
      req = req
        .get('/repos/fake/fake/compare/base-branch...new-branch')
        .reply(200, {
          status: 'diverged',
          merge_base_commit: {sha: 'merge_base_sha'},
          commits: [{sha: 'commit1A'}, {sha: 'commit2A'}],
        })
        .get('/repos/fake/fake/compare/merge_base_sha...base-branch')
        .reply(200, {
          commits: [
            {sha: 'CommitOnlyPresentInBranchB'},
            {sha: 'commit1B'},
            {sha: 'commit2B'},
          ],
        })
        .get('/repos/fake/fake/commits/commit1A')
        .reply(200, {
          commit: {
            message: 'message1',
          },
          files: [
            {
              sha: 'file_sha1',
              filename: 'file1.txt',
              status: 'added',
              additions: 10,
              deletions: 0,
              changes: 10,
              patch: 'patch_data1',
            },
          ],
        })
        .get('/repos/fake/fake/commits/commit2A')
        .reply(200, {
          commit: {
            message: 'message2_different', // Different message, only on branch A
          },
          files: [
            {
              sha: 'file_sha2',
              filename: 'file2.txt',
              status: 'removed',
              additions: 20,
              deletions: 30,
              changes: 40,
              patch: 'patch_data2',
            },
          ],
        })
        .get('/repos/fake/fake/commits/commit1B')
        .reply(200, {
          commit: {
            message: 'message1',
          },
          files: [
            {
              sha: 'file_sha1',
              filename: 'file1.txt',
              status: 'added',
              additions: 10,
              deletions: 0,
              changes: 10,
              patch: 'patch_data1',
            },
          ],
        })
        .get('/repos/fake/fake/commits/commit2B')
        .reply(200, {
          commit: {
            message: 'message2',
          },
          files: [
            {
              sha: 'file_sha2',
              filename: 'file2.txt',
              status: 'removed',
              additions: 20,
              deletions: 30,
              changes: 40,
              patch: 'patch_data2',
            },
          ],
        })
        .get('/repos/fake/fake/commits/CommitOnlyPresentInBranchB')
        .reply(200, {
          commit: {
            message: 'message3B',
          },
          files: [
            {
              sha: 'file_sha3',
              filename: 'file3.txt',
              status: 'deleted',
              additions: 50,
              deletions: 60,
              changes: 70,
              patch: 'patch_data3',
            },
          ],
        });

      const result = await github.isBranchASyncedWithB(
        'new-branch',
        'base-branch'
      );
      req.done();

      expect(result).to.be.false;
    });

    it('returns false if branch A diverged and at least one commit is not present in branch B (extra file)', async () => {
      req = req
        .get('/repos/fake/fake/compare/base-branch...new-branch')
        .reply(200, {
          status: 'diverged',
          merge_base_commit: {sha: 'merge_base_sha'},
          commits: [{sha: 'commit1A'}, {sha: 'commit2A'}],
        })
        .get('/repos/fake/fake/compare/merge_base_sha...base-branch')
        .reply(200, {
          commits: [
            {sha: 'CommitOnlyPresentInBranchB'},
            {sha: 'commit1B'},
            {sha: 'commit2B'},
          ],
        })
        .get('/repos/fake/fake/commits/commit1A')
        .reply(200, {
          commit: {
            message: 'message1',
          },
          files: [
            {
              sha: 'file_sha1',
              filename: 'file1.txt',
              status: 'added',
              additions: 10,
              deletions: 0,
              changes: 10,
              patch: 'patch_data1',
            },
          ],
        })
        .get('/repos/fake/fake/commits/commit2A')
        .reply(200, {
          commit: {
            message: 'message2',
          },
          files: [
            {
              sha: 'file_sha2',
              filename: 'file2.txt',
              status: 'removed',
              additions: 20,
              deletions: 30,
              changes: 40,
              patch: 'patch_data2',
            },
            // Extra file only present in branch A
            {
              sha: 'file_sha__only_in_branch_a',
              filename: 'file__only_in_branch_a.txt',
              status: 'deleted',
              additions: 999,
              deletions: 333,
              changes: 666,
              patch: 'patch_data__only_in_branch_a',
            },
          ],
        })
        .get('/repos/fake/fake/commits/commit1B')
        .reply(200, {
          commit: {
            message: 'message1',
          },
          files: [
            {
              sha: 'file_sha1',
              filename: 'file1.txt',
              status: 'added',
              additions: 10,
              deletions: 0,
              changes: 10,
              patch: 'patch_data1',
            },
          ],
        })
        .get('/repos/fake/fake/commits/commit2B')
        .reply(200, {
          commit: {
            message: 'message2',
          },
          files: [
            {
              sha: 'file_sha2',
              filename: 'file2.txt',
              status: 'removed',
              additions: 20,
              deletions: 30,
              changes: 40,
              patch: 'patch_data2',
            },
          ],
        })
        .get('/repos/fake/fake/commits/CommitOnlyPresentInBranchB')
        .reply(200, {
          commit: {
            message: 'message3B',
          },
          files: [
            {
              sha: 'file_sha3',
              filename: 'file3.txt',
              status: 'deleted',
              additions: 50,
              deletions: 60,
              changes: 70,
              patch: 'patch_data3',
            },
          ],
        });

      const result = await github.isBranchASyncedWithB(
        'new-branch',
        'base-branch'
      );
      req.done();

      expect(result).to.be.false;
    });
  });
});
