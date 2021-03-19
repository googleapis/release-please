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

import {GitHub, Repository, PullRequests} from '../src/github';
import {fail} from 'assert';
import {PREdge} from '../src/graphql-to-commits';

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

    it('retries the graphql on a timeout', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve(fixturesPath, 'commits-yoshi-php-monorepo.json'),
          'utf8'
        )
      );
      req
        .post('/graphql')
        .reply(502, 'unavailable')
        .post('/graphql')
        .reply(200, {
          data: graphql,
        });
      const commitsSinceSha = await github.commitsSinceSha(
        'cf52ec0bcdc777dc9c5e76153d7d253bea95d44b'
      );
      snapshot(commitsSinceSha);
      req.done();
    });

    it('runs out of the graphql retries', async () => {
      req
        .post('/graphql')
        .reply(502, 'unavailable')
        .post('/graphql')
        .reply(502, 'unavailable')
        .post('/graphql')
        .reply(502, 'unavailable')
        .post('/graphql')
        .reply(502, 'unavailable');
      let thrown = false;
      try {
        await github.commitsSinceSha(
          'cf52ec0bcdc777dc9c5e76153d7d253bea95d44b'
        );
        fail('should have thrown');
      } catch (err) {
        thrown = true;
      }
      expect(thrown).to.be.true;
      req.done();
    });
  });

  describe('commitsSinceShaRest', () => {
    it('returns commits immediately before sha', async () => {
      req
        .get('/repos/fake/fake/commits?sha=main&page=1&per_page=100')
        .reply(200, [
          {
            sha: 'abcdefg',
            commit: {message: 'abcdefg message'},
            parents: [{sha: 'skip-me'}],
          },
          {
            sha: 'skip-me',
            commit: {message: 'merge commit'},
            // 2 parents for a merge commit
            parents: [{sha: 'abc123'}, {sha: 'some-merged-branch'}],
          },
          {
            sha: 'hikjlm',
            commit: {message: 'hikjlm message'},
            parents: [{sha: 'empty-commit'}],
          },
          {
            sha: 'empty-commit',
            commit: {message: 'no files'},
            parents: [{sha: 'abc123'}],
          },
          {
            sha: 'abc123',
            commit: {message: 'hikjlm message'},
            parents: [{sha: 'xyz321'}],
          },
        ]);
      req.get('/repos/fake/fake/commits/abcdefg?page=1').reply(200, {
        files: [
          {
            filename: 'abcdefg-file1',
          },
          {
            filename: 'abcdefg-file2',
          },
          {
            filename: 'abcdefg-file3',
          },
        ],
      });
      req.get('/repos/fake/fake/commits/empty-commit?page=1').reply(200, {});
      const manyFiles = [];
      for (const f of Array(601).keys()) {
        manyFiles.push(`file${f}.txt`);
      }
      req.get('/repos/fake/fake/commits/hikjlm?page=1').reply(200, {
        files: manyFiles.slice(0, 300).map(f => ({filename: f})),
      });
      req.get('/repos/fake/fake/commits/hikjlm?page=2').reply(200, {
        files: manyFiles.slice(300, 600).map(f => ({filename: f})),
      });
      req.get('/repos/fake/fake/commits/hikjlm?page=3').reply(200, {
        files: manyFiles.slice(600).map(f => ({filename: f})),
      });
      const commitsSinceShaRest = await github.commitsSinceShaRest('abc123');
      req.done();
      expect(commitsSinceShaRest).to.eql([
        {
          sha: 'abcdefg',
          message: 'abcdefg message',
          files: ['abcdefg-file1', 'abcdefg-file2', 'abcdefg-file3'],
        },
        {
          sha: 'hikjlm',
          message: 'hikjlm message',
          files: manyFiles,
        },
        {
          sha: 'empty-commit',
          message: 'no files',
          files: [],
        },
      ]);
    });

    it('finds more than 100 commits', async () => {
      const commits = [];
      for (const n of Array(102).keys()) {
        commits.push({
          sha: `abcdefg${n}`,
          commit: {message: `some message ${n}`},
          parents: [{sha: `abcdefg${n + 1}`}],
        });
      }
      req
        .get('/repos/fake/fake/commits?sha=main&page=1&per_page=100')
        .reply(200, commits.slice(0, 100));
      req
        .get('/repos/fake/fake/commits?sha=main&page=2&per_page=100')
        .reply(200, commits.slice(100, 102));
      for (const commit of commits.slice(0, 101)) {
        req.get(`/repos/fake/fake/commits/${commit.sha}?page=1`).reply(200, {
          files: [{filename: 'file-' + commit.sha}],
        });
      }
      const commitsSinceShaRest = await github.commitsSinceShaRest(
        'abcdefg101'
      );
      req.done();
      const expected = [];
      for (const commit of commits.slice(0, 101)) {
        expected.push({
          sha: commit.sha,
          message: commit.commit.message,
          files: [`file-${commit.sha}`],
        });
      }
      expect(commitsSinceShaRest).to.eql(expected);
    });
  });

  describe('getRepositoryDefaultBranch', () => {
    it('gets default repository branch', async () => {
      const branch = await github.getRepositoryDefaultBranch();
      expect(branch).to.equal('main');
      const branchAgain = await github.getRepositoryDefaultBranch();
      expect(branchAgain).to.equal('main');
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

  describe('addLabels', () => {
    it('labels a PR', async () => {
      req
        .post('/repos/fake/fake/issues/1/labels', {labels: ['foo']})
        .reply(200);
      const created = await github.addLabels(['foo'], 1);
      expect(created).to.be.true;
      req.done();
    });
    it('does not label a PR on a forked repo', async () => {
      const gh = new GitHub({owner: 'fake', repo: 'fake', fork: true});
      const created = await gh.addLabels(['foo'], 1);
      expect(created).to.be.false;
    });
  });

  describe('removeLabels', () => {
    it('unlabels a PR', async () => {
      req.delete('/repos/fake/fake/issues/1/labels/foo').reply(200);
      const removed = await github.removeLabels(['foo'], 1);
      expect(removed).to.be.true;
      req.done();
    });
    it('does not unlabel a PR on a forked repo', async () => {
      const gh = new GitHub({owner: 'fake', repo: 'fake', fork: true});
      const removed = await gh.removeLabels(['foo'], 1);
      expect(removed).to.be.false;
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

  describe('closePR', () => {
    it('updates a PR to state.closed', async () => {
      req.patch('/repos/fake/fake/pulls/1', {state: 'closed'}).reply(200);
      const closed = await github.closePR(1);
      expect(closed).to.be.true;
      req.done();
    });
    it('does not close a PR from a forked repo', async () => {
      const gh = new GitHub({owner: 'fake', repo: 'fake', fork: true});
      const closed = await gh.closePR(1);
      expect(closed).to.be.false;
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

    it('retries the graphql on a timeout', async () => {
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-since.json'), 'utf8')
      );
      req
        .post('/graphql')
        .reply(502, 'unavailable')
        .post('/graphql')
        .reply(200, {
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

  describe('latestTagFallback', () => {
    it('falls back to using tags, for simple case', async () => {
      req.get('/repos/fake/fake/tags?per_page=100').reply(200, [
        {
          name: 'v1.0.0',
          commit: {sha: 'abc123'},
        },
        {
          name: 'v1.1.0',
          commit: {sha: 'deadbeef'},
        },
      ]);
      const latestTag = await github.latestTagFallback();
      expect(latestTag!.version).to.equal('1.1.0');
      req.done();
    });

    it('falls back to using tags, when prefix is provided', async () => {
      req.get('/repos/fake/fake/tags?per_page=100').reply(200, [
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
      const latestTag = await github.latestTagFallback('foo-');
      expect(latestTag!.version).to.equal('1.9.0');
      req.done();
    });

    it('allows for "@" rather than "-" when fallback used', async () => {
      req.get('/repos/fake/fake/tags?per_page=100').reply(200, [
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
      const latestTag = await github.latestTagFallback('foo-');
      expect(latestTag!.version).to.equal('2.1.0');
      req.done();
    });

    it('allows for "/" rather than "-" when fallback used', async () => {
      req.get('/repos/fake/fake/tags?per_page=100').reply(200, [
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
      const latestTag = await github.latestTagFallback('foo-');
      expect(latestTag!.version).to.equal('2.3.0');
      req.done();
    });
  });
  describe('lastMergedPRByHeadBranch', () => {
    const getLastMergedManifestPRGraphQL = (
      files: string[],
      nextPage: boolean
    ): Repository<PullRequests> => {
      const nodeFiles = [{path: '.release-please-manifest.json'}];
      nodeFiles.push(...files.map(path => ({path})));
      return {
        repository: {
          pullRequests: {
            nodes: [
              {
                title: 'some Title',
                body: 'some Body',
                number: 22,
                mergeCommit: {oid: 'abc123'},
                files: {
                  nodes: nodeFiles,
                  pageInfo: {hasNextPage: nextPage, endCursor: 'MQ'},
                },
                labels: {
                  nodes: [{name: 'foo'}, {name: 'bar'}],
                },
              },
            ],
          },
        },
      };
    };
    const getPullRequestFilesGraphQL = (
      files: string[],
      nextPage: boolean
    ): Repository<{pullRequest: PREdge['node']}> => {
      return {
        repository: {
          pullRequest: {
            number: 22,
            mergeCommit: {oid: 'abc123'},
            files: {
              edges: files.map(path => ({node: {path}})),
              pageInfo: {hasNextPage: nextPage, endCursor: 'MQ'},
            },
            labels: {edges: []},
          },
        },
      };
    };
    it('finds no previously merged PR', async () => {
      const noPrs: Repository<PullRequests> = {
        repository: {
          pullRequests: {
            nodes: [],
          },
        },
      };
      req.post('/graphql').reply(200, {
        data: noPrs,
      });
      const pr = await github.lastMergedPRByHeadBranch('headBranch');
      req.done();
      expect(pr).to.be.undefined;
    });
    it('finds the last merged PR with fewer than 100 files', async () => {
      const files = ['node/pkg1/package.json', 'py/setup.py'];
      const graphql = getLastMergedManifestPRGraphQL(files, false);
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      files.unshift('.release-please-manifest.json');
      const pr = await github.lastMergedPRByHeadBranch('headBranch');
      req.done();
      expect(pr).to.not.be.undefined;
      expect(pr!.sha).to.equal('abc123');
      expect(pr!.title).to.equal('some Title');
      expect(pr!.body).to.equal('some Body');
      expect(pr!.number).to.equal(22);
      expect(pr!.baseRefName).to.equal('main');
      expect(pr!.headRefName).to.equal('headBranch');
      expect(pr!.files).to.eql(files);
    });
    it('finds the last merged PR with greater than "100" files', async () => {
      // 100 files is the github limit but since we trigger on
      // PageInfo.hasNextPage we'll mock that knob so we can deal with fewer
      // file (6 in this case).
      const files1 = ['node/pkg1/package.json', 'py/setup.py'];
      const files2 = ['node/pkg2/package.json', 'py2/setup.py'];
      const files3 = ['node/pkg3/package.json', 'py3/setup.py'];
      const graphql1 = getLastMergedManifestPRGraphQL(files1, true);
      const graphql2 = getPullRequestFilesGraphQL(files2, true);
      const graphql3 = getPullRequestFilesGraphQL(files3, false);
      req.post('/graphql').reply(200, {
        data: graphql1,
      });
      req.post('/graphql').reply(200, {
        data: graphql2,
      });
      req.post('/graphql').reply(200, {
        data: graphql3,
      });

      const pr = await github.lastMergedPRByHeadBranch('headBranch');
      req.done();

      const files = ['.release-please-manifest.json'];
      files.push(...files1, ...files2, ...files3);
      expect(pr).to.not.be.undefined;
      expect(pr!.sha).to.equal('abc123');
      expect(pr!.title).to.equal('some Title');
      expect(pr!.body).to.equal('some Body');
      expect(pr!.number).to.equal(22);
      expect(pr!.baseRefName).to.equal('main');
      expect(pr!.headRefName).to.equal('headBranch');
      expect(pr!.files).to.eql(files);
    });
  });
});
