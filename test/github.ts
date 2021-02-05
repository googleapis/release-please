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
import {beforeEach, describe, it} from 'mocha';
nock.disableNetConnect();

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

import {GitHub} from '../src/github';
import {fail} from 'assert';

const fixturesPath = './test/fixtures';

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

  beforeEach(() => {
    // Reset this before each test so we get a consistent
    // set of requests (some things are cached).
    github = new GitHub({owner: 'fake', repo: 'fake'});

    // This shared nock will take care of some common requests.
    req = getNock();
  });

  describe('commitsSinceSha', () => {
    it('returns commits immediately before sha', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const commitsSinceSha = await github.commitsSinceSha(
        'cf52ec0bcdc777dc9c5e76153d7d253bea95d44b'
      );
      snapshot(commitsSinceSha);
      req.done();
    });

    it('prefixes commits with labels from associated pull requests', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-with-labels.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const commitsSinceSha = await github.commitsSinceSha(
        '35abf13fa8acb3988aa086f3eb23f5ce1483cc5d',
        100,
        true
      );
      snapshot(commitsSinceSha);
      req.done();
    });
  });

  describe('normalizePrefix', () => {
    it('removes a leading slash', async () => {
      expect(github.normalizePrefix('/test')).to.equal('test');
    });
    it('removes a trailing slash', async () => {
      expect(github.normalizePrefix('test/')).to.equal('test');
    });
    it('removes a leading & trailing slash', async () => {
      expect(github.normalizePrefix('/test/')).to.equal('test');
    });
  });

  describe('findFilesByfilename', () => {
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
  });

  describe('findOpenReleasePRs', () => {
    it('returns PRs that have all release labels', async () => {
      req.get('/repos/fake/fake/pulls?state=open&per_page=100').reply(200, [
        {
          number: 99,
          labels: [{name: 'autorelease: pending'}, {name: 'process'}],
          base: {
            label: 'fake:main',
          },
        },
        {
          number: 100,
          labels: [{name: 'autorelease: pending'}],
          base: {
            label: 'fake:main',
          },
        },
      ]);
      const prs = await github.findOpenReleasePRs([
        'autorelease: pending',
        'process',
      ]);
      const numbers = prs.map(pr => pr.number);
      expect(numbers).to.include(99);
      expect(numbers).to.not.include(100);
      req.done();
    });

    it('returns PRs when only one release label is configured', async () => {
      req.get('/repos/fake/fake/pulls?state=open&per_page=100').reply(200, [
        {
          number: 99,
          labels: [{name: 'autorelease: pending'}, {name: 'process'}],
          base: {
            label: 'fake:main',
          },
        },
        {
          number: 100,
          labels: [{name: 'autorelease: pending'}],
          base: {
            label: 'fake:main',
          },
        },
      ]);
      const prs = await github.findOpenReleasePRs(['autorelease: pending']);
      const numbers = prs.map(pr => pr.number);
      expect(numbers).to.include(99);
      expect(numbers).to.include(100);
      req.done();
    });

    // Todo - not finding things from other branches
  });

  describe('latestTag', () => {
    it('handles monorepo composite branch names properly', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag-monorepo.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await github.latestTag('complex-package_name-v1-');
      expect(latestTag!.version).to.equal('1.1.0');
      req.done();
    });

    it('does not return monorepo composite tag, if no prefix provided', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag-monorepo.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns the latest tag on the main branch, based on PR date', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns the latest tag on a sub branch, based on PR date', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-alternate-branch.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });

      // We need a special one here to set an alternate branch.
      github = new GitHub({
        owner: 'fake',
        repo: 'fake',
        defaultBranch: 'legacy-8',
      });

      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('does not return pre-releases as latest tag', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });

      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.3.0');
      req.done();
    });

    it('returns pre-releases on the main branch as latest, when preRelease is true', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'latest-tag.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await github.latestTag(undefined, true);
      expect(latestTag!.version).to.equal('2.0.0-rc1');
      req.done();
    });

    it('returns pre-releases on a sub branch as latest, when preRelease is true', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-alternate-branch.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });

      // We need a special one here to set an alternate branch.
      github = new GitHub({
        owner: 'fake',
        repo: 'fake',
        defaultBranch: 'prerelease',
      });
      const latestTag = await github.latestTag(undefined, true);
      expect(latestTag!.version).to.equal('2.0.0-rc1');
      req.done();
    });

    it('falls back to using tags, for simple case', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-no-commits.json'),
          'utf8'
        )
      );
      req
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {sha: 'abc123'},
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'deadbeef'},
          },
        ]);
      const latestTag = await github.latestTag();
      expect(latestTag!.version).to.equal('1.1.0');
      req.done();
    });
    it('falls back to using tags, when prefix is provided', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-no-commits.json'),
          'utf8'
        )
      );
      req
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {sha: 'abc123'},
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'deadbeef'},
          },
          {
            name: 'foo-v1.9.0',
            commit: {sha: 'deadbeef'},
          },
          {
            name: 'v1.2.0',
            commit: {sha: 'deadbeef'},
          },
        ]);
      const latestTag = await github.latestTag('foo-');
      expect(latestTag!.version).to.equal('1.9.0');
      req.done();
    });
    it('allows for "@" rather than "-" when fallback used', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-no-commits.json'),
          'utf8'
        )
      );
      req
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {sha: 'abc123'},
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'deadbeef'},
          },
          {
            name: 'foo@v1.9.0',
            commit: {sha: 'dead'},
          },
          {
            name: 'v1.2.0',
            commit: {sha: 'beef'},
          },
          {
            name: 'foo@v2.1.0',
            commit: {sha: '123abc'},
          },
        ]);
      const latestTag = await github.latestTag('foo-');
      expect(latestTag!.version).to.equal('2.1.0');
      req.done();
    });
    it('allows for "/" rather than "-" when fallback used', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'latest-tag-no-commits.json'),
          'utf8'
        )
      );
      req
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        .get('/repos/fake/fake/tags?per_page=100')
        .reply(200, [
          {
            name: 'v1.0.0',
            commit: {sha: 'abc123'},
          },
          {
            name: 'v1.1.0',
            commit: {sha: 'deadbeef'},
          },
          {
            name: 'foo/v2.3.0',
            commit: {sha: 'dead'},
          },
          {
            name: 'v1.2.0',
            commit: {sha: 'beef'},
          },
          {
            name: 'foo/v2.1.0',
            commit: {sha: '123abc'},
          },
        ]);
      const latestTag = await github.latestTag('foo-');
      expect(latestTag!.version).to.equal('2.3.0');
      req.done();
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

  describe('findMergedPullRequests', () => {
    it('finds merged pull requests with labels', async () => {
      const pullRequests = JSON.parse(
        readFileSync(resolve(fixturesPath, 'merged-pull-requests.json'), 'utf8')
      );
      req
        .get(
          '/repos/fake/fake/pulls?state=closed&per_page=100&page=1&base=main&sort=created&direction=desc'
        )
        .reply(200, pullRequests);
      const mergedPullRequests = await github.findMergedPullRequests();
      snapshot(mergedPullRequests);
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
      const commitsSinceSha = await github.commitsSince(commit => {
        // this commit is the 2nd most recent
        return commit.sha === 'b29149f890e6f76ee31ed128585744d4c598924c';
      });
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
      const commitsSinceSha = await github.commitsSince(commit => {
        // this commit is on page 2
        return commit.sha === 'c6d9dfb03aa2dbe1abc329592af60713fe28586d';
      });
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
      const commitsSinceSha = await github.commitsSince(
        (commit, pullRequest) => {
          // PR #6 was rebase/merged so it has 4 associated commits
          return pullRequest?.number === 6;
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
      const commitsSinceSha = await github.commitsSince(commit => {
        // this commit is on page 2
        return commit.sha === 'c6d9dfb03aa2dbe1abc329592af60713fe28586d';
      }, 10);
      expect(commitsSinceSha.length).to.eql(10);
      snapshot(commitsSinceSha);
      req.done();
    });
  });

  describe('findMergeCommit', () => {
    it('finds commits up until a condition', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const commitWithPullRequest = await github.findMergeCommit(commit => {
        // this commit is the 2nd most recent
        return commit.sha === 'b29149f890e6f76ee31ed128585744d4c598924c';
      });
      expect(commitWithPullRequest).to.not.be.undefined;
      expect(commitWithPullRequest!.commit.sha).to.eql(
        'b29149f890e6f76ee31ed128585744d4c598924c'
      );
      expect(commitWithPullRequest!.pullRequest).to.not.be.undefined;
      expect(commitWithPullRequest!.pullRequest!.number).to.eql(7);
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

      const commitWithPullRequest = await github.findMergeCommit(commit => {
        // this commit is the 2nd most recent
        return commit.sha === 'c6d9dfb03aa2dbe1abc329592af60713fe28586d';
      });
      expect(commitWithPullRequest).to.not.be.undefined;
      expect(commitWithPullRequest!.commit.sha).to.eql(
        'c6d9dfb03aa2dbe1abc329592af60713fe28586d'
      );
      expect(commitWithPullRequest!.pullRequest).to.be.undefined;
      req.done();
    });

    it('finds first commit of a multi-commit merge pull request', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const commitWithPullRequest = await github.findMergeCommit(
        (commit, pullRequest) => {
          // PR #6 was rebase/merged so it has 4 associated commits
          return pullRequest?.number === 6;
        }
      );
      expect(commitWithPullRequest).to.not.be.undefined;
      expect(commitWithPullRequest!.commit.sha).to.eql(
        '2b4e0b3be2e231cd87cc44c411bd8f84b4587ab5'
      );
      expect(commitWithPullRequest!.pullRequest).to.not.be.undefined;
      expect(commitWithPullRequest!.pullRequest!.number).to.eql(6);
      req.done();
    });

    it('limits pagination', async () => {
      const graphql1 = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since-page-1.json'), 'utf8')
      );
      req.post('/graphql').reply(200, {
        data: graphql1,
      });

      const commitWithPullRequest = await github.findMergeCommit(commit => {
        // this commit is the 2nd most recent
        return commit.sha === 'c6d9dfb03aa2dbe1abc329592af60713fe28586d';
      }, 10);
      expect(commitWithPullRequest).to.be.undefined;
      req.done();
    });
  });

  describe('createRelease', () => {
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
        });
      const release = await github.createRelease(
        'my package',
        'v1.2.3',
        'abc123',
        'Some release notes',
        false
      );
      req.done();
      expect(release).to.not.be.undefined;
      expect(release!.tag_name).to.eql('v1.2.3');
      expect(release!.draft).to.be.false;
    });

    it('should create a release without a package prefix', async () => {
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
        });
      const release = await github.createRelease(
        '',
        'v1.2.3',
        'abc123',
        'Some release notes',
        false
      );
      req.done();
      expect(release).to.not.be.undefined;
      expect(release!.tag_name).to.eql('v1.2.3');
      expect(release!.draft).to.be.false;
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
      const comment = await github.commentOnIssue('This is a comment', 1347);
      expect(comment.body).to.eql('This is a comment');
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
});
