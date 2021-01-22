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
import {GitHubFileContents} from '../../src/github';
import * as crypto from 'crypto';
import {Commit} from '../../src/graphql-to-commits';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/java-yoshi';

function buildFileContent(fixture: string): GitHubFileContents {
  const content = readFileSync(resolve(fixturesPath, fixture), 'utf8');
  return {
    content: Buffer.from(content, 'utf8').toString('base64'),
    parsedContent: content,
    // fake a consistent sha
    sha: crypto.createHash('md5').update(content).digest('hex'),
  };
}

function buildMockCommit(message: string): Commit {
  return {
    sha: crypto.createHash('md5').update(message).digest('hex'),
    message,
    files: [],
  };
}

describe('JavaYoshi', () => {
  afterEach(() => {
    sandbox.restore();
  });
  it('creates a release PR', async () => {
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
      apiUrl: 'https://api.github.com',
    });

    sandbox
      .stub(releasePR.gh, 'getDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR.gh, 'latestTag').returns(
      Promise.resolve({
        name: 'v0.20.3',
        sha: 'abc123',
        version: '0.20.3',
      })
    );

    const findFilesStub = sandbox.stub(
      releasePR.gh,
      'findFilesByFilenameAndRef'
    );
    findFilesStub
      .withArgs('pom.xml', 'master', undefined)
      .resolves(['pom.xml']);
    findFilesStub.withArgs('build.gradle', 'master', undefined).resolves([]);
    findFilesStub
      .withArgs('dependencies.properties', 'master', undefined)
      .resolves([]);

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', 'master')
      .resolves(buildFileContent('versions.txt'));
    getFileContentsStub
      .withArgs('README.md', 'master')
      .resolves(buildFileContent('README.md'));
    getFileContentsStub
      .withArgs('pom.xml', 'master')
      .resolves(buildFileContent('pom.xml'));
    getFileContentsStub
      .withArgs(
        'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        'master'
      )
      .resolves(buildFileContent('GoogleUtils.java'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    sandbox
      .stub(releasePR.gh, 'commitsSinceSha')
      .resolves([
        buildMockCommit(
          'fix: Fix declared dependencies from merge issue (#291)'
        ),
      ]);

    // TODO: maybe assert which labels added
    sandbox.stub(releasePR.gh, 'addLabels');

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
    await releasePR.run();
    snapshot(
      JSON.stringify(expectedChanges, null, 2).replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10' // don't save a real date, this will break tests.
      )
    );
  });

  it('creates a snapshot PR', async () => {
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
      apiUrl: 'https://api.github.com',
      snapshot: true,
    });

    sandbox
      .stub(releasePR.gh, 'getDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR.gh, 'latestTag').returns(
      Promise.resolve({
        name: 'v0.20.3',
        sha: 'abc123',
        version: '0.20.3',
      })
    );

    const findFilesStub = sandbox.stub(
      releasePR.gh,
      'findFilesByFilenameAndRef'
    );
    findFilesStub
      .withArgs('pom.xml', 'master', undefined)
      .resolves(['pom.xml']);
    findFilesStub.withArgs('build.gradle', 'master', undefined).resolves([]);
    findFilesStub
      .withArgs('dependencies.properties', 'master', undefined)
      .resolves([]);

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', 'master')
      .resolves(buildFileContent('released-versions.txt'));
    getFileContentsStub
      .withArgs('README.md', 'master')
      .resolves(buildFileContent('README.md'));
    getFileContentsStub
      .withArgs('pom.xml', 'master')
      .resolves(buildFileContent('pom.xml'));
    getFileContentsStub
      .withArgs(
        'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        'master'
      )
      .resolves(buildFileContent('GoogleUtils.java'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    sandbox
      .stub(releasePR.gh, 'commitsSinceSha')
      .resolves([
        buildMockCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
        ),
      ]);

    // TODO: maybe assert which labels added
    sandbox.stub(releasePR.gh, 'addLabels');

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
    await releasePR.run();
    snapshot(
      JSON.stringify(expectedChanges, null, 2).replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10' // don't save a real date, this will break tests.
      )
    );
  });

  it('creates a snapshot PR, when latest release sha is head', async () => {
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
      apiUrl: 'https://api.github.com',
      snapshot: true,
    });

    sandbox
      .stub(releasePR.gh, 'getDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR.gh, 'latestTag').returns(
      Promise.resolve({
        name: 'v0.20.3',
        sha: 'abc123',
        version: '0.20.3',
      })
    );

    const findFilesStub = sandbox.stub(
      releasePR.gh,
      'findFilesByFilenameAndRef'
    );
    findFilesStub
      .withArgs('pom.xml', 'master', undefined)
      .resolves(['pom.xml']);
    findFilesStub.withArgs('build.gradle', 'master', undefined).resolves([]);
    findFilesStub
      .withArgs('dependencies.properties', 'master', undefined)
      .resolves([]);

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', 'master')
      .resolves(buildFileContent('released-versions.txt'));
    getFileContentsStub
      .withArgs('README.md', 'master')
      .resolves(buildFileContent('README.md'));
    getFileContentsStub
      .withArgs('pom.xml', 'master')
      .resolves(buildFileContent('pom.xml'));
    getFileContentsStub
      .withArgs(
        'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        'master'
      )
      .resolves(buildFileContent('GoogleUtils.java'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    sandbox.stub(releasePR.gh, 'commitsSinceSha').resolves([]);

    // TODO: maybe assert which labels added
    sandbox.stub(releasePR.gh, 'addLabels');

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
    await releasePR.run();
    snapshot(
      JSON.stringify(expectedChanges, null, 2).replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10' // don't save a real date, this will break tests.
      )
    );
  });

  it('ignores a snapshot release if no snapshot needed', async () => {
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
      apiUrl: 'https://api.github.com',
      snapshot: true,
    });

    sandbox
      .stub(releasePR.gh, 'getDefaultBranch')
      .returns(Promise.resolve('master'));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', 'master')
      .resolves(buildFileContent('versions.txt'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    // should not attempt to create a pull request
    sandbox
      .stub(suggester, 'createPullRequest')
      .rejects(Error('should not get here'));

    await releasePR.run();
  });

  it('creates a snapshot PR if an explicit release is requested, but a snapshot is needed', async () => {
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
      apiUrl: 'https://api.github.com',
      snapshot: false,
    });

    sandbox
      .stub(releasePR.gh, 'getDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR.gh, 'latestTag').returns(
      Promise.resolve({
        name: 'v0.20.3',
        sha: 'abc123',
        version: '0.20.3',
      })
    );

    const findFilesStub = sandbox.stub(
      releasePR.gh,
      'findFilesByFilenameAndRef'
    );
    findFilesStub
      .withArgs('pom.xml', 'master', undefined)
      .resolves(['pom.xml']);
    findFilesStub.withArgs('build.gradle', 'master', undefined).resolves([]);
    findFilesStub
      .withArgs('dependencies.properties', 'master', undefined)
      .resolves([]);

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', 'master')
      .resolves(buildFileContent('released-versions.txt'));
    getFileContentsStub
      .withArgs('README.md', 'master')
      .resolves(buildFileContent('README.md'));
    getFileContentsStub
      .withArgs('pom.xml', 'master')
      .resolves(buildFileContent('pom.xml'));
    getFileContentsStub
      .withArgs(
        'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        'master'
      )
      .resolves(buildFileContent('GoogleUtils.java'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    sandbox
      .stub(releasePR.gh, 'commitsSinceSha')
      .resolves([
        buildMockCommit(
          'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
        ),
      ]);

    // TODO: maybe assert which labels added
    sandbox.stub(releasePR.gh, 'addLabels');

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
    await releasePR.run();
    snapshot(
      JSON.stringify(expectedChanges, null, 2).replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10' // don't save a real date, this will break tests.
      )
    );
  });

  it('handles promotion to 1.0.0', async () => {
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
      apiUrl: 'https://api.github.com',
    });

    sandbox
      .stub(releasePR.gh, 'getDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR.gh, 'latestTag').returns(
      Promise.resolve({
        name: 'v0.20.3',
        sha: 'abc123',
        version: '0.20.3',
      })
    );

    const findFilesStub = sandbox.stub(
      releasePR.gh,
      'findFilesByFilenameAndRef'
    );
    findFilesStub
      .withArgs('pom.xml', 'master', undefined)
      .resolves(['pom.xml']);
    findFilesStub.withArgs('build.gradle', 'master', undefined).resolves([]);
    findFilesStub
      .withArgs('dependencies.properties', 'master', undefined)
      .resolves([]);

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', 'master')
      .resolves(buildFileContent('pre-ga-versions.txt'));
    getFileContentsStub
      .withArgs('README.md', 'master')
      .resolves(buildFileContent('README.md'));
    getFileContentsStub
      .withArgs('pom.xml', 'master')
      .resolves(buildFileContent('pom.xml'));
    getFileContentsStub
      .withArgs(
        'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        'master'
      )
      .resolves(buildFileContent('GoogleUtils.java'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    sandbox
      .stub(releasePR.gh, 'commitsSinceSha')
      .resolves([
        buildMockCommit('feat: promote to 1.0.0 (#292)\n\nRelease-As: 1.0.0'),
      ]);

    // TODO: maybe assert which labels added
    sandbox.stub(releasePR.gh, 'addLabels');

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
    await releasePR.run();
    snapshot(
      JSON.stringify(expectedChanges, null, 2).replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10' // don't save a real date, this will break tests.
      )
    );
  });

  it('creates a release PR against a feature branch', async () => {
    const releasePR = new JavaYoshi({
      repoUrl: 'googleapis/java-trace',
      releaseType: 'java-yoshi',
      // not actually used by this type of repo.
      packageName: 'java-trace',
      apiUrl: 'https://api.github.com',
      defaultBranch: '1.x',
    });

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR.gh, 'latestTag').returns(
      Promise.resolve({
        name: 'v0.20.3',
        sha: 'abc123',
        version: '0.20.3',
      })
    );

    const findFilesStub = sandbox.stub(
      releasePR.gh,
      'findFilesByFilenameAndRef'
    );
    findFilesStub.withArgs('pom.xml', '1.x', undefined).resolves(['pom.xml']);
    findFilesStub.withArgs('build.gradle', '1.x', undefined).resolves([]);
    findFilesStub
      .withArgs('dependencies.properties', '1.x', undefined)
      .resolves([]);

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', '1.x')
      .resolves(buildFileContent('versions.txt'));
    getFileContentsStub
      .withArgs('README.md', '1.x')
      .resolves(buildFileContent('README.md'));
    getFileContentsStub
      .withArgs('pom.xml', '1.x')
      .resolves(buildFileContent('pom.xml'));
    getFileContentsStub
      .withArgs(
        'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        '1.x'
      )
      .resolves(buildFileContent('GoogleUtils.java'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    sandbox
      .stub(releasePR.gh, 'commitsSinceSha')
      .resolves([
        buildMockCommit(
          'fix: Fix declared dependencies from merge issue (#291)'
        ),
      ]);

    // TODO: maybe assert which labels added
    sandbox.stub(releasePR.gh, 'addLabels');

    // We stub the entire suggester API, asserting only that the
    // the appropriate changes are proposed:
    let expectedChanges = null;
    let expectedOptions = null;
    sandbox.replace(
      suggester,
      'createPullRequest',
      (_octokit, changes, options): Promise<number> => {
        expectedOptions = options;
        expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
        return Promise.resolve(22);
      }
    );
    await releasePR.run();
    snapshot(
      JSON.stringify(expectedChanges, null, 2).replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10' // don't save a real date, this will break tests.
      )
    );
    snapshot(
      JSON.stringify(expectedOptions, null, 2).replace(
        /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        '1983-10-10' // don't save a real date, this will break tests.
      )
    );
  });
});
