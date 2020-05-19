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

import {describe, it, before} from 'mocha';
import * as nock from 'nock';

import {expect} from 'chai';
import {JavaBom} from '../../src/releasers/java-bom';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

const fixturesPath = './test/releasers/fixtures/java-bom';

interface MochaThis {
  [skip: string]: Function;
}
function requireNode10(this: MochaThis) {
  const match = process.version.match(/v([0-9]+)/);
  if (match) {
    if (Number(match[1]) < 10) this.skip();
  }
}

describe('JavaBom', () => {
  describe('run', () => {
    before(requireNode10);
    it('creates a release PR', async () => {
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
        .get('/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100')
        .reply(200, undefined)
        .get('/repos/googleapis/java-cloud-bom/contents/versions.txt')
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get('/repos/googleapis/java-cloud-bom/tags?per_page=100')
        .reply(200, [
          {
            name: 'v0.123.4',
            commit: {
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
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
        // getting the latest tag
        .get('/repos/googleapis/java-cloud-bom/git/refs?per_page=100')
        .reply(200, [{ref: 'refs/tags/v0.123.4'}])
        // creating a new branch
        .post('/repos/googleapis/java-cloud-bom/git/refs')
        .reply(200)
        // check for CHANGELOG
        .get(
          '/repos/googleapis/java-cloud-bom/contents/CHANGELOG.md?ref=refs%2Fheads%2Frelease-v0.124.0'
        )
        .reply(404)
        .put(
          '/repos/googleapis/java-cloud-bom/contents/CHANGELOG.md',
          (req: {[key: string]: string}) => {
            snapshot(
              'CHANGELOG-bom',
              Buffer.from(req.content, 'base64')
                .toString('utf8')
                .replace(/\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g, '')
            );
            return true;
          }
        )
        .reply(201)
        // update README.md
        .get(
          '/repos/googleapis/java-cloud-bom/contents/README.md?ref=refs%2Fheads%2Frelease-v0.124.0'
        )
        .reply(200, {
          content: Buffer.from(readmeContent, 'utf8').toString('base64'),
        })
        .put(
          '/repos/googleapis/java-cloud-bom/contents/README.md',
          (req: {[key: string]: string}) => {
            snapshot(
              'README-bom',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(200)
        // update versions.txt
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs%2Fheads%2Frelease-v0.124.0'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt',
          (req: {[key: string]: string}) => {
            snapshot(
              'versions-bom',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(200)
        // update pom.xml
        .get(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml?ref=refs%2Fheads%2Frelease-v0.124.0'
        )
        .reply(200, {
          content: Buffer.from(pomContents, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml',
          (req: {[key: string]: string}) => {
            snapshot(
              'pom-bom',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(200)
        // create release
        .post(
          '/repos/googleapis/java-cloud-bom/pulls',
          (req: {[key: string]: string}) => {
            const body = req.body.replace(
              /\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g,
              ''
            );
            snapshot('PR body-bom', body);
            return true;
          }
        )
        .reply(200, {number: 1})
        .post(
          '/repos/googleapis/java-cloud-bom/issues/1/labels',
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
    });
    it('creates a snapshot PR', async () => {
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
        .get('/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100')
        .reply(200, undefined)
        .get('/repos/googleapis/java-cloud-bom/contents/versions.txt')
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // getting the most recent commit:
        .post('/graphql')
        .reply(200, {
          data: graphql,
        })
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get('/repos/googleapis/java-cloud-bom/tags?per_page=100')
        .reply(200, [
          {
            name: 'v0.123.4',
            commit: {
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
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
        // getting the latest tag
        .get('/repos/googleapis/java-cloud-bom/git/refs?per_page=100')
        .reply(200, [{ref: 'refs/tags/v0.123.4'}])
        // creating a new branch
        .post('/repos/googleapis/java-cloud-bom/git/refs')
        .reply(200)
        // update versions.txt
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs%2Fheads%2Frelease-v0.123.5-SNAPSHOT'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt',
          (req: {[key: string]: string}) => {
            snapshot(
              'versions-bom-snapshot',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(200)
        // update pom.xml
        .get(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml?ref=refs%2Fheads%2Frelease-v0.123.5-SNAPSHOT'
        )
        .reply(200, {
          content: Buffer.from(pomContents, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml',
          (req: {[key: string]: string}) => {
            snapshot(
              'pom-bom-snapshot',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(200)
        // create release
        .post(
          '/repos/googleapis/java-cloud-bom/pulls',
          (req: {[key: string]: string}) => {
            const body = req.body.replace(
              /\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g,
              ''
            );
            snapshot('PR body-bom-snapshot', body);
            return true;
          }
        )
        .reply(200, {number: 1})
        .post(
          '/repos/googleapis/java-cloud-bom/issues/1/labels',
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
      });
      await releasePR.run();
      req.done();
    });
    it('merges conventional commit messages', async () => {
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
        .get('/repos/googleapis/java-cloud-bom/pulls?state=closed&per_page=100')
        .reply(200, undefined)
        .get('/repos/googleapis/java-cloud-bom/contents/versions.txt')
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        // fetch semver tags, this will be used to determine
        // the delta since the last release.
        .get('/repos/googleapis/java-cloud-bom/tags?per_page=100')
        .reply(200, [
          {
            name: 'v0.123.4',
            commit: {
              sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            },
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
        // getting the latest tag
        .get('/repos/googleapis/java-cloud-bom/git/refs?per_page=100')
        .reply(200, [{ref: 'refs/tags/v0.123.4'}])
        // creating a new branch
        .post('/repos/googleapis/java-cloud-bom/git/refs')
        .reply(200)
        // check for CHANGELOG
        .get(
          '/repos/googleapis/java-cloud-bom/contents/CHANGELOG.md?ref=refs%2Fheads%2Frelease-v0.124.0'
        )
        .reply(404)
        .put(
          '/repos/googleapis/java-cloud-bom/contents/CHANGELOG.md',
          (req: {[key: string]: string}) => {
            snapshot(
              'CHANGELOG-bom-feature',
              Buffer.from(req.content, 'base64')
                .toString('utf8')
                .replace(/\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g, '')
            );
            return true;
          }
        )
        .reply(201)
        // update README.md
        .get(
          '/repos/googleapis/java-cloud-bom/contents/README.md?ref=refs%2Fheads%2Frelease-v0.124.0'
        )
        .reply(200, {
          content: Buffer.from(readmeContent, 'utf8').toString('base64'),
        })
        .put(
          '/repos/googleapis/java-cloud-bom/contents/README.md',
          (req: {[key: string]: string}) => {
            snapshot(
              'README-bom-feature',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(200)
        // update versions.txt
        .get(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt?ref=refs%2Fheads%2Frelease-v0.124.0'
        )
        .reply(200, {
          content: Buffer.from(versionsContent, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/java-cloud-bom/contents/versions.txt',
          (req: {[key: string]: string}) => {
            snapshot(
              'versions-bom-feature',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(200)
        // update pom.xml
        .get(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml?ref=refs%2Fheads%2Frelease-v0.124.0'
        )
        .reply(200, {
          content: Buffer.from(pomContents, 'utf8').toString('base64'),
          sha: 'abc123',
        })
        .put(
          '/repos/googleapis/java-cloud-bom/contents/pom.xml',
          (req: {[key: string]: string}) => {
            snapshot(
              'pom-bom-feature',
              Buffer.from(req.content, 'base64').toString('utf8')
            );
            return true;
          }
        )
        .reply(200)
        // create release
        .post(
          '/repos/googleapis/java-cloud-bom/pulls',
          (req: {[key: string]: string}) => {
            const body = req.body.replace(
              /\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g,
              ''
            );
            snapshot('PR body-bom-feature', body);
            return true;
          }
        )
        .reply(200, {number: 1})
        .post(
          '/repos/googleapis/java-cloud-bom/issues/1/labels',
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
