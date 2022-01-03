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

import {GitHub, GitHubRelease} from '../src/github';
import {PullRequest} from '../src/pull-request';
import {TagName} from '../src/util/tag-name';
import {Version} from '../src/version';
import assert = require('assert');
import {DuplicateReleaseError, GitHubAPIError} from '../src/errors';
import {fail} from 'assert';

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
      const pomFiles = await github.findFilesByFilename('pom.xml');
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
        const pomFiles = await github.findFilesByFilename('pom.xml', prefix);
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
      const pomFiles = await github.findFilesByExtension('xml');
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
        const pomFiles = await github.findFilesByExtension('xml', prefix);
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
      const pomFiles = await github.findFilesByExtension('xml', 'appengine');
      req.done();
      expect(pomFiles).to.deep.equal(['pom.xml', 'foo/pom.xml']);
    });
  });

  describe('getFileContents', () => {
    it('should support Github Data API in case of a big file', async () => {
      const simpleAPIResponse = JSON.parse(
        readFileSync(
          resolve(
            fixturesPath,
            'github-data-api',
            '403-too-large-file-response.json'
          ),
          'utf8'
        )
      );
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

      req
        .get(
          '/repos/fake/fake/contents/package-lock.json?ref=refs%2Fheads%2Fmain'
        )
        .reply(403, simpleAPIResponse)
        .get('/repos/fake/fake/git/trees/main')
        .reply(200, dataAPITreesResponse)
        .get(
          '/repos/fake/fake/git/blobs/2f3d2c47bf49f81aca0df9ffc49524a213a2dc33'
        )
        .reply(200, dataAPIBlobResponse);

      const fileContents = await github.getFileContents('package-lock.json');
      expect(fileContents).to.have.property('content');
      expect(fileContents).to.have.property('parsedContent');
      expect(fileContents)
        .to.have.property('sha')
        .equal('2f3d2c47bf49f81aca0df9ffc49524a213a2dc33');
      snapshot(fileContents);
      req.done();
    });
  });

  describe('getFileContentsWithSimpleAPI', () => {
    const setupReq = (ref: string) => {
      req
        .get(
          `/repos/fake/fake/contents/release-please-manifest.json?ref=${ref}`
        )
        .reply(200, {
          sha: 'abc123',
          content: Buffer.from('I am a manifest').toString('base64'),
        });
      return req;
    };
    it('gets a file using shorthand branch name', async () => {
      const req = setupReq('refs%2Fheads%2Fmain');
      const ghFile = await github.getFileContentsWithSimpleAPI(
        'release-please-manifest.json',
        'main'
      );
      expect(ghFile)
        .to.have.property('parsedContent')
        .to.equal('I am a manifest');
      expect(ghFile).to.have.property('sha').to.equal('abc123');
      req.done();
    });
    it('gets a file using fully qualified branch name', async () => {
      const req = setupReq('refs%2Fheads%2Fmain');
      const ghFile = await github.getFileContentsWithSimpleAPI(
        'release-please-manifest.json',
        'refs/heads/main'
      );
      expect(ghFile)
        .to.have.property('parsedContent')
        .to.equal('I am a manifest');
      expect(ghFile).to.have.property('sha').to.equal('abc123');
      req.done();
    });
    it('gets a file using a non-branch "ref"', async () => {
      const req = setupReq('abc123');
      const ghFile = await github.getFileContentsWithSimpleAPI(
        'release-please-manifest.json',
        'abc123',
        false
      );
      expect(ghFile)
        .to.have.property('parsedContent')
        .to.equal('I am a manifest');
      expect(ghFile).to.have.property('sha').to.equal('abc123');
      req.done();
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
          tag_name: 'v1.2.3',
          draft: false,
          html_url: 'https://github.com/fake/fake/releases/v1.2.3',
          upload_url:
            'https://uploads.github.com/repos/fake/fake/releases/1/assets{?name,label}',
          target_commitish: 'abc123',
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
        sha: 'abc123',
        draft: false,
        prerelease: false,
      });
      expect(release).to.not.be.undefined;
      expect(release.tagName).to.eql('v1.2.3');
      expect(release.sha).to.eql('abc123');
      expect(release.draft).to.be.false;
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
      await assert.rejects(promise, error => {
        return (
          error instanceof DuplicateReleaseError &&
          // ensure stack contains calling method
          error.stack?.includes('GitHub.createRelease') &&
          !!error.cause
        );
      });
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
      await assert.rejects(promise, error => {
        return (
          error instanceof GitHubAPIError &&
          // ensure stack contains calling method
          error.stack?.includes('GitHub.createRelease') &&
          !!error.cause
        );
      });
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
        sha: 'abc123',
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
        sha: 'abc123',
        draft: false,
        prerelease: true,
      });
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
        expect(err.status).to.eql(410);
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
});
