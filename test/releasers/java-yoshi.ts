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

import {describe, it, before} from 'mocha';
import * as nock from 'nock';
nock.disableNetConnect();

import {JavaYoshi} from '../../src/releasers/java-yoshi';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';

const fixturesPath = './test/releasers/fixtures/java-yoshi';

interface MochaThis {
  [skip: string]: Function;
}
function requireNode10(this: MochaThis) {
  const match = process.version.match(/v([0-9]+)/);
  if (match) {
    if (Number(match[1]) < 10) this.skip();
  }
}

describe('JavaYoshi', () => {
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
    const pomContents = readFileSync(resolve(fixturesPath, 'pom.xml'), 'utf8');
    const googleUtilsContent = readFileSync(
      resolve(fixturesPath, 'GoogleUtils.java'),
      'utf8'
    ).replace(/\r\n/g, '\n');
    const graphql = JSON.parse(
      readFileSync(resolve(fixturesPath, 'commits-yoshi-java.json'), 'utf8')
    );
    const req = nock('https://api.github.com')
      .get('/repos/googleapis/java-trace/pulls?state=closed&per_page=100')
      .reply(200, undefined)
      .get('/repos/googleapis/java-trace/contents/versions.txt')
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // fetch semver tags, this will be used to determine
      // the delta since the last release.
      .get('/repos/googleapis/java-trace/tags?per_page=100')
      .reply(200, [
        {
          name: 'v0.20.3',
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
      .get('/search/code?q=filename%3Apom.xml+repo%3Agoogleapis%2Fjava-trace')
      .reply(200, {
        total_count: 1,
        items: [{name: 'pom.xml', path: 'pom.xml'}],
      })
      // finding build.gradle files
      .get(
        '/search/code?q=filename%3Abuild.gradle+repo%3Agoogleapis%2Fjava-trace'
      )
      .reply(200, {
        total_count: 0,
        items: [],
      })
      // finding dependencies.properties files
      .get(
        '/search/code?q=filename%3Adependencies.properties+repo%3Agoogleapis%2Fjava-trace'
      )
      .reply(200, {
        total_count: 0,
        items: [],
      })
      // getting the latest tag
      .get('/repos/googleapis/java-trace/git/refs?per_page=100')
      .reply(200, [{ref: 'refs/tags/v0.20.3'}])
      // creating a new branch
      .post('/repos/googleapis/java-trace/git/refs')
      .reply(200)
      // check for CHANGELOG
      .get(
        '/repos/googleapis/java-trace/contents/CHANGELOG.md?ref=refs%2Fheads%2Frelease-v0.20.4'
      )
      .reply(404)
      .put(
        '/repos/googleapis/java-trace/contents/CHANGELOG.md',
        (req: {[key: string]: string}) => {
          snapshot('CHANGELOG-message', req.message);
          snapshot(
            'CHANGELOG',
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
        '/repos/googleapis/java-trace/contents/README.md?ref=refs%2Fheads%2Frelease-v0.20.4'
      )
      .reply(200, {
        content: Buffer.from(readmeContent, 'utf8').toString('base64'),
      })
      .put(
        '/repos/googleapis/java-trace/contents/README.md',
        (req: {[key: string]: string}) => {
          snapshot('README-message', req.message);
          snapshot(
            'README',
            Buffer.from(req.content, 'base64').toString('utf8')
          );
          return true;
        }
      )
      .reply(200)
      // update versions.txt
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs%2Fheads%2Frelease-v0.20.4'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      .put(
        '/repos/googleapis/java-trace/contents/versions.txt',
        (req: {[key: string]: string}) => {
          snapshot('versions-message', req.message);
          snapshot(
            'versions',
            Buffer.from(req.content, 'base64').toString('utf8')
          );
          return true;
        }
      )
      .reply(200)
      // update pom.xml
      .get(
        '/repos/googleapis/java-trace/contents/pom.xml?ref=refs%2Fheads%2Frelease-v0.20.4'
      )
      .reply(200, {
        content: Buffer.from(pomContents, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      .put(
        '/repos/googleapis/java-trace/contents/pom.xml',
        (req: {[key: string]: string}) => {
          snapshot('pom-message', req.message);
          snapshot('pom', Buffer.from(req.content, 'base64').toString('utf8'));
          return true;
        }
      )
      .reply(200)
      // Update GoogleUtils.java
      .get(
        '/repos/googleapis/java-trace/contents/google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java?ref=refs%2Fheads%2Frelease-v0.20.4'
      )
      .reply(200, {
        content: Buffer.from(googleUtilsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      .put(
        '/repos/googleapis/java-trace/contents/google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        (req: {[key: string]: string}) => {
          snapshot('GoogleUtils-message', req.message);
          snapshot(
            'GoogleUtils',
            Buffer.from(req.content, 'base64').toString('utf8')
          );
          return true;
        }
      )
      .reply(200)
      // check for default branch
      .get('/repos/googleapis/java-trace')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .reply(200, require('../../../test/fixtures/repo-get-1.json'))
      // create release
      .post(
        '/repos/googleapis/java-trace/pulls',
        (req: {[key: string]: string}) => {
          req.body = req.body.replace(/\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g, '');
          snapshot('PR body', req);
          return true;
        }
      )
      .reply(200, {number: 1})
      .post(
        '/repos/googleapis/java-trace/issues/1/labels',
        (req: {[key: string]: string}) => {
          snapshot('labels', req);
          return true;
        }
      )
      .reply(200, {})
      // this step tries to close any existing PRs; just return an empty list.
      .get('/repos/googleapis/java-trace/pulls?state=open&per_page=100')
      .reply(200, []);
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
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
    const pomContents = readFileSync(resolve(fixturesPath, 'pom.xml'), 'utf8');
    const graphql = JSON.parse(
      readFileSync(resolve(fixturesPath, 'commits-yoshi-java.json'), 'utf8')
    );
    const req = nock('https://api.github.com')
      .get('/repos/googleapis/java-trace/pulls?state=closed&per_page=100')
      .reply(200, undefined)
      .get('/repos/googleapis/java-trace/contents/versions.txt')
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
      .get('/repos/googleapis/java-trace/tags?per_page=100')
      .reply(200, [
        {
          name: 'v0.20.3',
          commit: {
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          },
        },
      ])
      // finding pom.xml files
      .get('/search/code?q=filename%3Apom.xml+repo%3Agoogleapis%2Fjava-trace')
      .reply(200, {
        total_count: 1,
        items: [{name: 'pom.xml', path: 'pom.xml'}],
      })
      // finding build.gradle files
      .get(
        '/search/code?q=filename%3Abuild.gradle+repo%3Agoogleapis%2Fjava-trace'
      )
      .reply(200, {
        total_count: 0,
        items: [],
      })
      // finding dependencies.properties files
      .get(
        '/search/code?q=filename%3Adependencies.properties+repo%3Agoogleapis%2Fjava-trace'
      )
      .reply(200, {
        total_count: 0,
        items: [],
      })
      // getting the latest tag
      .get('/repos/googleapis/java-trace/git/refs?per_page=100')
      .reply(200, [{ref: 'refs/tags/v0.20.3'}])
      // creating a new branch
      .post('/repos/googleapis/java-trace/git/refs')
      .reply(200)
      // update versions.txt
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs%2Fheads%2Frelease-v0.20.4-SNAPSHOT'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      .put(
        '/repos/googleapis/java-trace/contents/versions.txt',
        (req: {[key: string]: string}) => {
          snapshot(
            'versions-snapshot',
            Buffer.from(req.content, 'base64').toString('utf8')
          );
          return true;
        }
      )
      .reply(200)
      // update pom.xml
      .get(
        '/repos/googleapis/java-trace/contents/pom.xml?ref=refs%2Fheads%2Frelease-v0.20.4-SNAPSHOT'
      )
      .reply(200, {
        content: Buffer.from(pomContents, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      .put(
        '/repos/googleapis/java-trace/contents/pom.xml',
        (req: {[key: string]: string}) => {
          snapshot(
            'pom-snapshot',
            Buffer.from(req.content, 'base64').toString('utf8')
          );
          return true;
        }
      )
      .reply(200)
      // check for default branch
      .get('/repos/googleapis/java-trace')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .reply(200, require('../../../test/fixtures/repo-get-2.json'))
      // create release
      .post(
        '/repos/googleapis/java-trace/pulls',
        (req: {[key: string]: string}) => {
          req.body = req.body.replace(/\([0-9]{4}-[0-9]{2}-[0-9]{2}\)/g, '');
          snapshot('PR body-snapshot', req);
          return true;
        }
      )
      .reply(200, {number: 1})
      .post(
        '/repos/googleapis/java-trace/issues/1/labels',
        (req: {[key: string]: string}) => {
          snapshot('labels-snapshot', req);
          return true;
        }
      )
      .reply(200, {})
      // this step tries to close any existing PRs; just return an empty list.
      .get('/repos/googleapis/java-trace/pulls?state=open&per_page=100')
      .reply(200, []);
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
      apiUrl: 'https://api.github.com',
    });
    await releasePR.run();
    req.done();
  });
});
