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

import {expect} from 'chai';
import {JavaBom} from '../../src/releasers/java-bom';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {GitHubFileContents} from '../../src/github';
import * as crypto from 'crypto';
import {Commit} from '../../src/graphql-to-commits';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/java-bom';

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

describe('JavaBom', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('creates a release PR', async () => {
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
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
          name: 'v0.123.4',
          sha: 'abc123',
          version: '0.123.4',
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
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      sandbox
        .stub(releasePR.gh, 'commitsSinceSha')
        .resolves([
          buildMockCommit(
            'deps: update dependency com.google.cloud:google-cloud-storage to v1.120.0'
          ),
          buildMockCommit(
            'deps: update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
          ),
          buildMockCommit('chore: update common templates'),
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
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
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
          name: 'v0.123.4',
          sha: 'abc123',
          version: '0.123.4',
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
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      sandbox
        .stub(releasePR.gh, 'commitsSinceSha')
        .resolves([
          buildMockCommit(
            'deps: update dependency com.google.cloud:google-cloud-storage to v1.120.0'
          ),
          buildMockCommit(
            'deps: update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
          ),
          buildMockCommit('chore: update common templates'),
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

    it('ignores a snapshot release if no snapshot needed', async () => {
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
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
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
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
          name: 'v0.123.4',
          sha: 'abc123',
          version: '0.123.4',
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
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      sandbox
        .stub(releasePR.gh, 'commitsSinceSha')
        .resolves([
          buildMockCommit(
            'deps: update dependency com.google.cloud:google-cloud-storage to v1.120.0'
          ),
          buildMockCommit(
            'deps: update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
          ),
          buildMockCommit('chore: update common templates'),
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

    it('merges conventional commit messages', async () => {
      const releasePR = new JavaBom({
        repoUrl: 'googleapis/java-cloud-bom',
        releaseType: 'java-bom',
        // not actually used by this type of repo.
        packageName: 'java-cloud-bom',
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
          name: 'v0.123.4',
          sha: 'abc123',
          version: '0.123.4',
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
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      sandbox
        .stub(releasePR.gh, 'commitsSinceSha')
        .resolves([
          buildMockCommit(
            'deps: update dependency com.google.cloud:google-cloud-storage to v1.120.1'
          ),
          buildMockCommit('feat: import google-cloud-game-servers'),
          buildMockCommit('chore: update common templates'),
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
