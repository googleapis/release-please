// Copyright 2020 Google LLC
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

import {describe, it, afterEach} from 'mocha';
import * as nock from 'nock';

import {expect} from 'chai';
import {JavaBom} from '../../src/releasers/java-bom';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/java-bom';

describe('JavaBom', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR', async () => {
      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      const versionsContent = readFileSync(
        resolve(fixturesPath, 'versions.txt'),
        'utf8'
      );
      const readmeContent = readFileSync(
        resolve(fixturesPath, 'README.md'),
        'utf8'
      );
      const pomContents = readFileSync(
        resolve(fixturesPath, 'pom.xml'),
        'utf8'
      );
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, undefined)
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs/heads/main'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // This step looks for any existing, open, release PRs.
        .get('/repos/googleapis/java-cloud-bom/pulls?state=open&per_page=100')
        .reply(200, undefined)
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, [
          {
            base: {
              label: 'googleapis:main',
            },
            head: {
              label: 'googleapis:release-v0.123.4',
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
            merged_at: new Date().toISOString(),
          },
        ])
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // finding pom.xml files
        .get(
          '/search/code?q=filename%3Apom.xml+repo%3Agoogleapis%2Fjava-cloud-bom'
        )
        .reply(200, {
          total_count: 1,
          items: [{name: 'pom.xml', path: 'pom.xml'}],
        })
        // check for CHANGELOG
        .get(
          '/repos/googleapis/java-cloud-bom/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmain'
        )
        .reply(404)
        // update README.md
        .get(
          '/repos/googleapis/java-cloud-bom/contents/README.md?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(readmeContent, 'utf8').toString('base64'),
        })
        // update versions.txt
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // update pom.xml
        .get(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(pomContents, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // check for default branch
        .get('/repos/googleapis/java-cloud-bom')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-2.json'))
        // create release
        .post(
          '/repos/googleapis/java-cloud-bom/issues/22/labels',
          (req: {[key: string]: string}) => {
            snapshot('labels-bom', req);
            return true;
          }
        )
        .reply(200, {})
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/java-cloud-bom/pulls?state=open&per_page=100')
        .reply(200, []);
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('creates a snapshot PR', async () => {
      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      const versionsContent = readFileSync(
        resolve(fixturesPath, 'released-versions.txt'),
        'utf8'
      );
      const pomContents = readFileSync(
        resolve(fixturesPath, 'pom.xml'),
        'utf8'
      );
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, undefined)
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs/heads/main'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // This step lists any existing, open release PRs.
        .get('/repos/googleapis/java-cloud-bom/pulls?state=open&per_page=100')
        .reply(200, [])
        // getting the most recent commit:
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, [
          {
            base: {
              label: 'googleapis:main',
            },
            head: {
              label: 'googleapis:release-v0.123.4',
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
            merged_at: new Date().toISOString(),
          },
        ])
        // finding pom.xml files
        .get(
          '/search/code?q=filename%3Apom.xml+repo%3Agoogleapis%2Fjava-cloud-bom'
        )
        .reply(200, {
          total_count: 1,
          items: [{name: 'pom.xml', path: 'pom.xml'}],
        })
        // update versions.txt
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // update pom.xml
        .get(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(pomContents, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // check for default branch
        .get('/repos/googleapis/java-cloud-bom')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-2.json'))
        .post(
          '/repos/googleapis/java-cloud-bom/issues/22/labels',
          (req: {[key: string]: string}) => {
            snapshot('labels-bom-snapshot', req);
            return true;
          }
        )
        .reply(200, {})
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/java-cloud-bom/pulls?state=open&per_page=100')
        .reply(200, []);
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
        apiUrl: 'https://api.github.com',
        snapshot: true,
      });
      await releasePR.run();
      req.done();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('ignores a snapshot release if no snapshot needed', async () => {
      const versionsContent = readFileSync(
        resolve(fixturesPath, 'versions.txt'),
        'utf8'
      );
      const req = nock('https://api.github.com')
        .get('/repos/googleapis/java-cloud-bom')
        .reply(200, {
          default_branch: 'master',
        })
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, undefined)
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs/heads/master'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        });
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
        apiUrl: 'https://api.github.com',
        snapshot: true,
      });
      await releasePR.run();
      req.done();
    });

    it('creates a snapshot PR if an explicit release is requested, but a snapshot is needed', async () => {
      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      const versionsContent = readFileSync(
        resolve(fixturesPath, 'released-versions.txt'),
        'utf8'
      );
      const pomContents = readFileSync(
        resolve(fixturesPath, 'pom.xml'),
        'utf8'
      );
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
        )
        .reply(200, undefined)
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs/heads/main'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // Checks for existing open release PRs.
        .get('/repos/googleapis/java-cloud-bom/pulls?state=open&per_page=100')
        .reply(200, [])
        // getting the most recent commit:
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=updated&'
        )
        .reply(200, [
          {
            base: {
              label: 'googleapis:main',
            },
            head: {
              label: 'googleapis:release-v0.123.4',
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
            merged_at: new Date().toISOString(),
          },
        ])
        // finding pom.xml files
        .get(
          '/search/code?q=filename%3Apom.xml+repo%3Agoogleapis%2Fjava-cloud-bom'
        )
        .reply(200, {
          total_count: 1,
          items: [{name: 'pom.xml', path: 'pom.xml'}],
        })
        // update versions.txt
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // update pom.xml
        .get(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml?ref=refs%2Fheads%2Fmain'
        )
        .reply(200, {
          content: Buffer.from(pomContents, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // check for default branch
        .get('/repos/googleapis/java-cloud-bom')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-2.json'))
        .post(
          '/repos/googleapis/java-cloud-bom/issues/22/labels',
          (req: {[key: string]: string}) => {
            snapshot('labels-bom-snapshot-release', req);
            return true;
          }
        )
        .reply(200, {})
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/java-cloud-bom/pulls?state=open&per_page=100')
        .reply(200, []);
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
        apiUrl: 'https://api.github.com',
        snapshot: false,
      });
      await releasePR.run();
      req.done();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });

    it('merges conventional commit messages', async () => {
      // We stub the entire suggester API, asserting only that the
      // the appropriate changes are proposed:
      let expectedChanges = null;
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );
      const versionsContent = readFileSync(
        resolve(fixturesPath, 'versions.txt'),
        'utf8'
      );
      const readmeContent = readFileSync(
        resolve(fixturesPath, 'README.md'),
        'utf8'
      );
      const pomContents = readFileSync(
        resolve(fixturesPath, 'pom.xml'),
        'utf8'
      );
      const graphql = JSON.parse(
        readFileSync(resolve(fixturesPath, 'commits-with-feature.json'), 'utf8')
      );
      const req = nock('https://api.github.com')
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=updated&direction=desc'
        )
        .reply(200, undefined)
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs/heads/master'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // This step checks for existing open release PRs.
        .get('/repos/googleapis/java-cloud-bom/pulls?state=open&per_page=100')
        .reply(200, [])
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get(
          '/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100&sort=updated&direction=desc'
        )
        .reply(200, [
          {
            base: {
              label: 'googleapis:master',
            },
            head: {
              label: 'googleapis:release-v0.123.4',
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
            merged_at: new Date().toISOString(),
          },
        ])
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // finding pom.xml files
        .get(
          '/search/code?q=filename%3Apom.xml+repo%3Agoogleapis%2Fjava-cloud-bom'
        )
        .reply(200, {
          total_count: 1,
          items: [{name: 'pom.xml', path: 'pom.xml'}],
        })
        // check for CHANGELOG
        .get(
          '/repos/googleapis/java-cloud-bom/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmaster'
        )
        .reply(404)
        // update README.md
        .get(
          '/repos/googleapis/java-cloud-bom/contents/README.md?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from(readmeContent, 'utf8').toString('base64'),
        })
        // update versions.txt
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // update pom.xml
        .get(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml?ref=refs%2Fheads%2Fmaster'
        )
        .reply(200, {
          content: Buffer.from(pomContents, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // check for default branch
        .get('/repos/googleapis/java-cloud-bom')
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .reply(200, require('../../../test/fixtures/repo-get-1.json'))
        .post(
          '/repos/googleapis/java-cloud-bom/issues/22/labels',
          (req: {[key: string]: string}) => {
            snapshot('labels-bom-feature', req);
            return true;
          }
        )
        .reply(200, {})
        // this step tries to close any existing PRs; just return an empty list.
        .get('/repos/googleapis/java-cloud-bom/pulls?state=open&per_page=100')
        .reply(200, []);
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
        apiUrl: 'https://api.github.com',
      });
      await releasePR.run();
      req.done();
      snapshot(
        JSON.stringify(expectedChanges, null, 2).replace(
          /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
          '1983-10-10' // don't save a real date, this will break tests.
        )
      );
    });
  });

  describe('dependencyUpdates', () => {
    it('ignores non-conforming commits', async () => {
      const commits = [{sha: 'abcd', message: 'some message', files: []}];
      const versionMap = JavaBom.dependencyUpdates(commits);
      expect(versionMap.size).to.equal(0);
    });

    it('parses a conforming commit', async () => {
      const commits = [
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.3',
          files: [],
        },
      ];
      const versionMap = JavaBom.dependencyUpdates(commits);
      expect(versionMap.size).to.equal(1);
      expect(versionMap.has('com.example.foo:my-artifact')).to.equal(true);
      expect(versionMap.get('com.example.foo:my-artifact')).to.equal('v1.2.3');
    });

    it('parses multiple conforming commits', async () => {
      const commits = [
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.3',
          files: [],
        },
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:another-artifact to v2.3.4',
          files: [],
        },
      ];
      const versionMap = JavaBom.dependencyUpdates(commits);
      expect(versionMap.size).to.equal(2);
      expect(versionMap.has('com.example.foo:my-artifact')).to.equal(true);
      expect(versionMap.get('com.example.foo:my-artifact')).to.equal('v1.2.3');
      expect(versionMap.has('com.example.foo:another-artifact')).to.equal(true);
      expect(versionMap.get('com.example.foo:another-artifact')).to.equal(
        'v2.3.4'
      );
    });

    it('handles multiple updates of the same dependency', async () => {
      const commits = [
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.4',
          files: [],
        },
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.3',
          files: [],
        },
      ];
      const versionMap = JavaBom.dependencyUpdates(commits);
      expect(versionMap.size).to.equal(1);
      expect(versionMap.has('com.example.foo:my-artifact')).to.equal(true);
      expect(versionMap.get('com.example.foo:my-artifact')).to.equal('v1.2.4');
    });
    it('prefers the latest updates of the same dependency', async () => {
      const commits = [
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.3',
          files: [],
        },
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.4',
          files: [],
        },
      ];
      const versionMap = JavaBom.dependencyUpdates(commits);
      expect(versionMap.size).to.equal(1);
      expect(versionMap.has('com.example.foo:my-artifact')).to.equal(true);
      expect(versionMap.get('com.example.foo:my-artifact')).to.equal('v1.2.3');
    });
  });
  describe('isNonPatchVersion', () => {
    it('should parse a major version bump', async () => {
      const commit = {
        sha: 'abcd',
        message: 'deps: update dependency com.example.foo:my-artifact to v2',
        files: [],
      };
      expect(JavaBom.isNonPatchVersion(commit)).to.equal(true);
    });
    it('should parse a minor version bump', async () => {
      const commit = {
        sha: 'abcd',
        message:
          'deps: update dependency com.example.foo:my-artifact to v1.2.0',
        files: [],
      };
      expect(JavaBom.isNonPatchVersion(commit)).to.equal(true);
    });
    it('should parse a minor version bump', async () => {
      const commit = {
        sha: 'abcd',
        message:
          'deps: update dependency com.example.foo:my-artifact to v1.2.3',
        files: [],
      };
      expect(JavaBom.isNonPatchVersion(commit)).to.equal(false);
    });
    it('should ignore a non conforming commit', async () => {
      const commit = {
        sha: 'abcd',
        message: 'some message',
        files: [],
      };
      expect(JavaBom.isNonPatchVersion(commit)).to.equal(false);
    });
  });
  describe('determineBumpType', () => {
    it('should return patch for patch-only bumps', () => {
      const commits = [
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.3',
          files: [],
        },
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:another-artifact to v2.3.4',
          files: [],
        },
      ];
      expect(JavaBom.determineBumpType(commits)).to.equal('patch');
    });
    it('should return minor for bumps that include a minor', () => {
      const commits = [
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.3',
          files: [],
        },
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:another-artifact to v2.3.0',
          files: [],
        },
      ];
      expect(JavaBom.determineBumpType(commits)).to.equal('minor');
    });
    it('should return minor for bumps that include a major', () => {
      const commits = [
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:my-artifact to v1.2.3',
          files: [],
        },
        {
          sha: 'abcd',
          message:
            'deps: update dependency com.example.foo:another-artifact to v2',
          files: [],
        },
      ];
      expect(JavaBom.determineBumpType(commits)).to.equal('minor');
    });
  });
});
