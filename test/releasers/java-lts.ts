// Copyright 2021 Google LLC
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

import {describe, it, afterEach, beforeEach} from 'mocha';
import * as nock from 'nock';
nock.disableNetConnect();

import {JavaLTS} from '../../src/releasers/java-lts';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {GitHubFileContents, GitHub} from '../../src/github';
import {expect} from 'chai';
import {buildGitHubFileContent} from './utils';
import {buildMockCommit, stubSuggesterWithSnapshot} from '../helpers';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {ReleasePR} from '../../src/release-pr';

const sandbox = sinon.createSandbox();

function buildFileContent(fixture: string): GitHubFileContents {
  return buildGitHubFileContent(
    './test/releasers/fixtures/java-yoshi',
    fixture
  );
}

describe('JavaLTS', () => {
  afterEach(() => {
    sandbox.restore();
  });
  it('creates a release PR', async function () {
    const releasePR = new JavaLTS({
      github: new GitHub({owner: 'googleapis', repo: 'java-trace'}),
      packageName: 'java-trace',
    });

    sandbox
      .stub(releasePR.gh, 'getRepositoryDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    sandbox.stub(releasePR, 'latestTag').returns(
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
      .resolves(buildFileContent('versions-lts-snapshot.txt'));
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

    const addLabelStub = sandbox
      .stub(releasePR.gh, 'addLabels')
      .withArgs(['autorelease: pending'], 22)
      .resolves();

    stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
    await releasePR.run();
    expect(addLabelStub.callCount).to.eql(1);
  });

  it('creates a snapshot PR', async function () {
    const releasePR = new JavaLTS({
      github: new GitHub({owner: 'googleapis', repo: 'java-trace'}),
      packageName: 'java-trace',
      snapshot: true,
    });

    sandbox
      .stub(releasePR.gh, 'getRepositoryDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR, 'latestTag').returns(
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
      .resolves(buildFileContent('released-lts-versions.txt'));
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

    stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
    await releasePR.run();
  });

  it('creates a snapshot PR, when latest release sha is head', async function () {
    const releasePR = new JavaLTS({
      github: new GitHub({owner: 'googleapis', repo: 'java-trace'}),
      packageName: 'java-trace',
      snapshot: true,
    });

    sandbox
      .stub(releasePR.gh, 'getRepositoryDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR, 'latestTag').returns(
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

    stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
    await releasePR.run();
  });

  it('ignores a snapshot release if no snapshot needed', async () => {
    const releasePR = new JavaLTS({
      github: new GitHub({owner: 'googleapis', repo: 'java-trace'}),
      packageName: 'java-trace',
      snapshot: true,
    });

    sandbox
      .stub(releasePR.gh, 'getRepositoryDefaultBranch')
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
      .resolves(buildFileContent('versions-lts-snapshot.txt'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    // should not attempt to create a pull request
    sandbox
      .stub(suggester, 'createPullRequest')
      .rejects(Error('should not get here'));

    await releasePR.run();
  });

  it('creates a snapshot PR if an explicit release is requested, but a snapshot is needed', async function () {
    const releasePR = new JavaLTS({
      github: new GitHub({owner: 'googleapis', repo: 'java-trace'}),
      packageName: 'java-trace',
      snapshot: false,
    });

    sandbox
      .stub(releasePR.gh, 'getRepositoryDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR, 'latestTag').returns(
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
      .resolves(buildFileContent('released-lts-versions.txt'));
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

    stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
    await releasePR.run();
  });

  it('creates a release PR against a feature branch', async function () {
    const defaultBranch = '1.x';
    const releasePR = new JavaLTS({
      github: new GitHub({
        defaultBranch,
        owner: 'googleapis',
        repo: 'java-trace',
      }),
      packageName: 'java-trace',
    });

    sandbox
      .stub(releasePR.gh, 'getRepositoryDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR, 'latestTag').returns(
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
      .withArgs('pom.xml', defaultBranch, undefined)
      .resolves(['pom.xml']);
    findFilesStub
      .withArgs('build.gradle', defaultBranch, undefined)
      .resolves([]);
    findFilesStub
      .withArgs('dependencies.properties', defaultBranch, undefined)
      .resolves([]);

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', defaultBranch)
      .resolves(buildFileContent('versions-lts-snapshot.txt'));
    getFileContentsStub
      .withArgs('README.md', defaultBranch)
      .resolves(buildFileContent('README.md'));
    getFileContentsStub
      .withArgs('pom.xml', defaultBranch)
      .resolves(buildFileContent('pom.xml'));
    getFileContentsStub
      .withArgs(
        'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        defaultBranch
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

    stubSuggesterWithSnapshot(sandbox, this.test!.fullTitle());
    await releasePR.run();
  });

  it('ignores non-release commits', async () => {
    const defaultBranch = '1.x';
    const releasePR = new JavaLTS({
      github: new GitHub({
        defaultBranch,
        owner: 'googleapis',
        repo: 'java-trace',
      }),
      packageName: 'java-trace',
    });

    sandbox
      .stub(releasePR.gh, 'getRepositoryDefaultBranch')
      .returns(Promise.resolve('master'));

    // No open release PRs, so create a new release PR
    sandbox
      .stub(releasePR.gh, 'findOpenReleasePRs')
      .returns(Promise.resolve([]));

    sandbox
      .stub(releasePR.gh, 'findMergedReleasePR')
      .returns(Promise.resolve(undefined));

    // Indicates that there are no PRs currently waiting to be released:
    sandbox.stub(releasePR, 'latestTag').returns(
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
      .withArgs('pom.xml', defaultBranch, undefined)
      .resolves(['pom.xml']);
    findFilesStub
      .withArgs('build.gradle', defaultBranch, undefined)
      .resolves([]);
    findFilesStub
      .withArgs('dependencies.properties', defaultBranch, undefined)
      .resolves([]);

    const getFileContentsStub = sandbox.stub(
      releasePR.gh,
      'getFileContentsOnBranch'
    );
    getFileContentsStub
      .withArgs('versions.txt', defaultBranch)
      .resolves(buildFileContent('versions-lts-snapshot.txt'));
    getFileContentsStub
      .withArgs('README.md', defaultBranch)
      .resolves(buildFileContent('README.md'));
    getFileContentsStub
      .withArgs('pom.xml', defaultBranch)
      .resolves(buildFileContent('pom.xml'));
    getFileContentsStub
      .withArgs(
        'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
        defaultBranch
      )
      .resolves(buildFileContent('GoogleUtils.java'));
    getFileContentsStub.rejects(
      Object.assign(Error('not found'), {status: 404})
    );

    sandbox
      .stub(releasePR.gh, 'commitsSinceSha')
      .resolves([buildMockCommit('chore: something irrelevant')]);

    // should not attempt to create a pull request
    sandbox
      .stub(suggester, 'createPullRequest')
      .rejects(Error('should not get here'));

    await releasePR.run();
  });

  describe('latestTag', () => {
    let req: nock.Scope;
    let releasePR: ReleasePR;

    beforeEach(() => {
      req = nock('https://api.github.com/');

      releasePR = new JavaLTS({
        github: new GitHub({owner: 'googleapis', repo: 'java-trace'}),
      });

      sandbox.stub(releasePR.gh, 'getRepositoryDefaultBranch').resolves('main');
    });

    it('returns a stable branch pull request', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve('./test/fixtures', 'latest-tag-sp-version.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag();
      expect(latestTag!.version).to.equal('1.127.0-sp.1');
      req.done();
    });

    it('returns a prerelease tag stable branch', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve('./test/fixtures', 'latest-tag-sp-version.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag(undefined, true);
      expect(latestTag!.version).to.equal('1.127.1-sp.1-SNAPSHOT');
      req.done();
    });

    it('returns a SP tag stable branch', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve('./test/fixtures', 'latest-tag-sp-version.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag(undefined, false);
      expect(latestTag!.version).to.equal('1.127.0-sp.1');
      req.done();
    });

    it('returns a renamed PR title', async () => {
      const graphql = JSON.parse(
        readFileSync(
          resolve('./test/fixtures', 'latest-tag-renamed.json'),
          'utf8'
        )
      );
      req.post('/graphql').reply(200, {
        data: graphql,
      });
      const latestTag = await releasePR.latestTag();
      expect(latestTag!.version).to.equal('1.2.1');
      req.done();
    });
  });
});
