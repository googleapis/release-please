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

import {describe, it, afterEach} from 'mocha';
import * as nock from 'nock';
nock.disableNetConnect();

import {JavaYoshi} from '../../src/releasers/java-yoshi';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/java-yoshi';

describe('JavaYoshi', () => {
  afterEach(() => {
    sandbox.restore();
  });
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
    const pomContents = readFileSync(resolve(fixturesPath, 'pom.xml'), 'utf8');
    const googleUtilsContent = readFileSync(
      resolve(fixturesPath, 'GoogleUtils.java'),
      'utf8'
    ).replace(/\r\n/g, '\n');
    const graphql = JSON.parse(
      readFileSync(resolve(fixturesPath, 'commits-yoshi-java.json'), 'utf8')
    );
    const req = nock('https://api.github.com')
      // This step looks for release PRs that are already open:
      .get('/repos/googleapis/java-trace/pulls?state=open&per_page=100')
      .reply(200, [])
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, undefined)
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs/heads/master'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // fetch semver tags, this will be used to determine
      // the delta since the last release.
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, [
        {
          base: {
            label: 'googleapis:master',
          },
          head: {
            label: 'googleapis:release-v0.20.3',
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          },
          merged_at: new Date().toISOString(),
        },
      ])
      .post('/graphql', (body: object) => {
        snapshot('graphql-body-java-release', body);
        return true;
      })
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
      // check for CHANGELOG
      .get(
        '/repos/googleapis/java-trace/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmaster'
      )
      .reply(404)
      // update README.md
      .get(
        '/repos/googleapis/java-trace/contents/README.md?ref=refs%2Fheads%2Fmaster'
      )
      .reply(200, {
        content: Buffer.from(readmeContent, 'utf8').toString('base64'),
      })
      // update versions.txt
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs%2Fheads%2Fmaster'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // update pom.xml
      .get(
        '/repos/googleapis/java-trace/contents/pom.xml?ref=refs%2Fheads%2Fmaster'
      )
      .reply(200, {
        content: Buffer.from(pomContents, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // Update GoogleUtils.java
      .get(
        '/repos/googleapis/java-trace/contents/google-api-client%2Fsrc%2Fmain%2Fjava%2Fcom%2Fgoogle%2Fapi%2Fclient%2Fgoogleapis%2FGoogleUtils.java?ref=refs%2Fheads%2Fmaster'
      )
      .reply(200, {
        content: Buffer.from(googleUtilsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // check for default branch
      .get('/repos/googleapis/java-trace')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .reply(200, require('../../../test/fixtures/repo-get-1.json'))
      .post(
        '/repos/googleapis/java-trace/issues/22/labels',
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
    const pomContents = readFileSync(resolve(fixturesPath, 'pom.xml'), 'utf8');
    const req = nock('https://api.github.com')
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, undefined)
      // This step looks for release PRs that are already open:
      .get('/repos/googleapis/java-trace/pulls?state=open&per_page=100')
      .reply(200, [])
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs/heads/main'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // fetch semver tags, this will be used to determine
      // the delta since the last release.
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, [
        {
          base: {
            label: 'googleapis:main',
          },
          head: {
            label: 'googleapis:release-v0.20.3',
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          },
          merged_at: new Date().toISOString(),
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
      // update versions.txt
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs%2Fheads%2Fmain'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // update pom.xml
      .get(
        '/repos/googleapis/java-trace/contents/pom.xml?ref=refs%2Fheads%2Fmain'
      )
      .reply(200, {
        content: Buffer.from(pomContents, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // check for default branch
      .get('/repos/googleapis/java-trace')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .reply(200, require('../../../test/fixtures/repo-get-2.json'))
      .post(
        '/repos/googleapis/java-trace/issues/22/labels',
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

  it('creates a snapshot PR, when latest release sha is head', async () => {
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
    const pomContents = readFileSync(resolve(fixturesPath, 'pom.xml'), 'utf8');
    const req = nock('https://api.github.com')
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, undefined)
      // This step looks for release PRs that are already open:
      .get('/repos/googleapis/java-trace/pulls?state=open&per_page=100')
      .reply(200, [])
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs/heads/main'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // fetch semver tags, this will be used to determine
      // the delta since the last release.
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, [
        {
          base: {
            label: 'googleapis:main',
          },
          head: {
            label: 'googleapis:release-v0.20.3',
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          },
          merged_at: new Date().toISOString(),
          labels: [],
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
      // update versions.txt
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs%2Fheads%2Fmain'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // update pom.xml
      .get(
        '/repos/googleapis/java-trace/contents/pom.xml?ref=refs%2Fheads%2Fmain'
      )
      .reply(200, {
        content: Buffer.from(pomContents, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // check for default branch
      .get('/repos/googleapis/java-trace')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .reply(200, require('../../../test/fixtures/repo-get-2.json'))
      .post(
        '/repos/googleapis/java-trace/issues/22/labels',
        (req: {[key: string]: string}) => {
          snapshot('labels-snapshot-empty', req);
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
      .get('/repos/googleapis/java-trace')
      .reply(200, {
        default_branch: 'master',
      })
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, undefined)
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs/heads/master'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      });
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
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
    const pomContents = readFileSync(resolve(fixturesPath, 'pom.xml'), 'utf8');
    const req = nock('https://api.github.com')
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, undefined)
      // This step looks for release PRs that are already open:
      .get('/repos/googleapis/java-trace/pulls?state=open&per_page=100')
      .reply(200, [])
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs/heads/main'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // fetch semver tags, this will be used to determine
      // the delta since the last release.
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, [
        {
          base: {
            label: 'googleapis:main',
          },
          head: {
            label: 'googleapis:release-v0.20.3',
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          },
          merged_at: new Date().toISOString(),
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
      // update versions.txt
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs%2Fheads%2Fmain'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // update pom.xml
      .get(
        '/repos/googleapis/java-trace/contents/pom.xml?ref=refs%2Fheads%2Fmain'
      )
      .reply(200, {
        content: Buffer.from(pomContents, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // check for default branch
      .get('/repos/googleapis/java-trace')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .reply(200, require('../../../test/fixtures/repo-get-2.json'))
      .post(
        '/repos/googleapis/java-trace/issues/22/labels',
        (req: {[key: string]: string}) => {
          snapshot('labels-snapshot-release', req);
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

  it('handles promotion to 1.0.0', async () => {
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
      resolve(fixturesPath, 'pre-ga-versions.txt'),
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
      readFileSync(resolve(fixturesPath, 'commits-promote-ga.json'), 'utf8')
    );
    const req = nock('https://api.github.com')
      // This step looks for release PRs that are already open:
      .get('/repos/googleapis/java-trace/pulls?state=open&per_page=100')
      .reply(200, [])
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, undefined)
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs/heads/master'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // fetch semver tags, this will be used to determine
      // the delta since the last release.
      .get(
        '/repos/googleapis/java-trace/pulls?state=closed&per_page=100&sort=merged_at&direction=desc'
      )
      .reply(200, [
        {
          base: {
            label: 'googleapis:master',
          },
          head: {
            label: 'googleapis:release-v0.20.3',
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
      // check for CHANGELOG
      .get(
        '/repos/googleapis/java-trace/contents/CHANGELOG.md?ref=refs%2Fheads%2Fmaster'
      )
      .reply(404)
      // update README.md
      .get(
        '/repos/googleapis/java-trace/contents/README.md?ref=refs%2Fheads%2Fmaster'
      )
      .reply(200, {
        content: Buffer.from(readmeContent, 'utf8').toString('base64'),
      })
      // update versions.txt
      .get(
        '/repos/googleapis/java-trace/contents/versions.txt?ref=refs%2Fheads%2Fmaster'
      )
      .reply(200, {
        content: Buffer.from(versionsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // update pom.xml
      .get(
        '/repos/googleapis/java-trace/contents/pom.xml?ref=refs%2Fheads%2Fmaster'
      )
      .reply(200, {
        content: Buffer.from(pomContents, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // Update GoogleUtils.java
      .get(
        '/repos/googleapis/java-trace/contents/google-api-client%2Fsrc%2Fmain%2Fjava%2Fcom%2Fgoogle%2Fapi%2Fclient%2Fgoogleapis%2FGoogleUtils.java?ref=refs%2Fheads%2Fmaster'
      )
      .reply(200, {
        content: Buffer.from(googleUtilsContent, 'utf8').toString('base64'),
        sha: 'abc123',
      })
      // check for default branch
      .get('/repos/googleapis/java-trace')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .reply(200, require('../../../test/fixtures/repo-get-1.json'))
      .post(
        '/repos/googleapis/java-trace/issues/22/labels',
        (req: {[key: string]: string}) => {
          snapshot('promotion labels', req);
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
    snapshot(
      JSON.stringify(expectedChanges, null, 2).replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10' // don't save a real date, this will break tests.
      )
    );
  });
});
