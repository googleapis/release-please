// Copyright 2026 Google LLC
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

import {afterEach, beforeEach, describe, it} from 'mocha';
import {expect} from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {request} from '@octokit/request';
import {Forgejo} from '../src/forgejo';
import {Manifest, CreatedRelease} from '../src/manifest';
import {main, parseInputs} from '../src/bin/forgejo-action';

const sandbox = sinon.createSandbox();

function readOutputs(outputFile: string): Record<string, string> {
  const outputs: Record<string, string> = {};
  const lines = fs.readFileSync(outputFile, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^([^<]+)<<(.+)$/);
    if (!match) continue;
    const value: string[] = [];
    for (i++; lines[i] !== match[2]; i++) {
      value.push(lines[i]);
    }
    outputs[match[1]] = value.join('\n');
  }
  return outputs;
}

function buildRelease(
  releasePath: string,
  version: string,
  overrides: Partial<CreatedRelease> = {}
): CreatedRelease {
  const [major, minor, patch] = version.split('.').map(Number);
  return {
    id: 1,
    path: releasePath,
    version,
    major,
    minor,
    patch,
    prNumber: 12,
    name: `v${version}`,
    tagName: `v${version}`,
    sha: 'abc123',
    notes: 'Release notes\nwith multiple lines',
    url: `https://git.example.com/owner/repo/releases/tag/v${version}`,
    draft: false,
    uploadUrl:
      'https://git.example.com/api/v1/repos/owner/repo/releases/1/assets',
    ...overrides,
  };
}

describe('forgejo-action', () => {
  let outputFile: string;
  let env: Record<string, string>;
  let fakeForgejo: Forgejo;
  let fakeManifest: Manifest;
  let forgejoCreateStub: sinon.SinonStub;

  beforeEach(() => {
    outputFile = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), 'forgejo-action-')),
      'output'
    );
    fs.writeFileSync(outputFile, '');
    env = {
      INPUT_TOKEN: 'secret',
      INPUT_REPO_URL: 'owner/repo',
      INPUT_API_URL: 'https://git.example.com/api/v1',
      GITHUB_OUTPUT: outputFile,
    };
    fakeForgejo = new Forgejo({
      repository: {owner: 'owner', repo: 'repo', defaultBranch: 'main'},
      request: request.defaults({}),
      webUrl: 'https://git.example.com',
    });
    fakeManifest = new Manifest(fakeForgejo, 'main', {}, {});
    forgejoCreateStub = sandbox.stub(Forgejo, 'create').resolves(fakeForgejo);
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('parseInputs', () => {
    it('requires a token', () => {
      expect(() => parseInputs({})).to.throw('token');
    });

    it('falls back to the Forgejo Actions environment', () => {
      const inputs = parseInputs({
        INPUT_TOKEN: 'secret',
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_SERVER_URL: 'https://git.example.com/',
      });
      expect(inputs.repoUrl).to.eql('owner/repo');
      expect(inputs.apiUrl).to.eql('https://git.example.com/api/v1');
      expect(inputs.configFile).to.eql('release-please-config.json');
      expect(inputs.manifestFile).to.eql('.release-please-manifest.json');
      expect(inputs.skipGitHubRelease).to.be.undefined;
    });

    it('parses boolean inputs with - or _ in the name', () => {
      const inputs = parseInputs({
        ...env,
        'INPUT_SKIP-GITHUB-RELEASE': 'true',
        INPUT_SKIP_GITHUB_PULL_REQUEST: 'False',
      });
      expect(inputs.skipGitHubRelease).to.be.true;
      expect(inputs.skipGitHubPullRequest).to.be.false;
      expect(() => parseInputs({...env, INPUT_SKIP_LABELING: 'yes'})).to.throw(
        'skip-labeling'
      );
    });
  });

  describe('main', () => {
    it('creates releases and pull requests and writes outputs', async () => {
      const fromManifestStub = sandbox
        .stub(Manifest, 'fromManifest')
        .resolves(fakeManifest);
      sandbox
        .stub(fakeManifest, 'createReleases')
        .resolves([
          buildRelease('.', '1.2.3'),
          buildRelease('packages/a', '0.1.0'),
          undefined,
        ]);
      const pullRequest = {
        title: 'chore: release main',
        body: 'body',
        headBranchName: 'release-please--branches--main',
        baseBranchName: 'main',
        number: 22,
        labels: [],
        files: [],
      };
      sandbox.stub(fakeManifest, 'createPullRequests').resolves([pullRequest]);

      await main(env);

      sinon.assert.calledOnceWithExactly(forgejoCreateStub, {
        owner: 'owner',
        repo: 'repo',
        apiUrl: 'https://git.example.com/api/v1',
        token: 'secret',
        defaultBranch: undefined,
        workInProgressPrefix: undefined,
      });
      sinon.assert.calledTwice(fromManifestStub);
      sinon.assert.calledWith(
        fromManifestStub,
        fakeForgejo,
        'main',
        'release-please-config.json',
        '.release-please-manifest.json',
        {}
      );
      const outputs = readOutputs(outputFile);
      expect(outputs.releases_created).to.eql('true');
      expect(outputs.release_created).to.eql('true');
      expect(outputs.tag_name).to.eql('v1.2.3');
      expect(outputs.version).to.eql('1.2.3');
      expect(outputs.major).to.eql('1');
      expect(outputs.pr_number).to.eql('12');
      expect(outputs.body).to.eql('Release notes\nwith multiple lines');
      expect(outputs.html_url).to.eql(
        'https://git.example.com/owner/repo/releases/tag/v1.2.3'
      );
      expect(JSON.parse(outputs.paths_released)).to.eql(['.', 'packages/a']);
      const releases = JSON.parse(outputs.releases);
      expect(releases).to.have.lengthOf(2);
      expect(releases[1]).to.include({
        path: 'packages/a',
        tag_name: 'v0.1.0',
        version: '0.1.0',
      });
      expect(outputs.prs_created).to.eql('true');
      expect(JSON.parse(outputs.pr)).to.eql(pullRequest);
      expect(JSON.parse(outputs.prs)).to.eql([pullRequest]);
    });

    it('honors skip flags and builds the manifest from release-type', async () => {
      const fromConfigStub = sandbox
        .stub(Manifest, 'fromConfig')
        .resolves(fakeManifest);
      const createReleasesStub = sandbox
        .stub(fakeManifest, 'createReleases')
        .resolves([]);
      const createPullRequestsStub = sandbox
        .stub(fakeManifest, 'createPullRequests')
        .resolves([]);

      await main({
        ...env,
        INPUT_RELEASE_TYPE: 'node',
        INPUT_TARGET_BRANCH: 'develop',
        INPUT_WIP_PREFIX: '[WIP]',
        INPUT_SKIP_GITHUB_PULL_REQUEST: 'true',
        INPUT_SKIP_LABELING: 'true',
      });

      sinon.assert.calledOnce(createReleasesStub);
      sinon.assert.notCalled(createPullRequestsStub);
      sinon.assert.calledOnceWithExactly(
        fromConfigStub,
        fakeForgejo,
        'develop',
        {
          releaseType: 'node',
          includeComponentInTag: undefined,
          changelogHost: undefined,
          versioning: undefined,
          releaseAs: undefined,
        },
        {skipLabeling: true},
        undefined
      );
      sinon.assert.calledWith(
        forgejoCreateStub,
        sinon.match({
          defaultBranch: 'develop',
          workInProgressPrefix: '[WIP]',
        })
      );
      const outputs = readOutputs(outputFile);
      expect(outputs.releases_created).to.eql('false');
      expect(outputs.paths_released).to.eql('[]');
      expect(outputs.prs_created).to.be.undefined;
    });

    it('overrides the changelog host for manifest releases', async () => {
      sandbox.stub(Manifest, 'fromManifest').resolves(fakeManifest);
      fakeManifest.repositoryConfig['.'] = {releaseType: 'node'};
      sandbox.stub(fakeManifest, 'createReleases').resolves([]);
      await main({
        ...env,
        INPUT_SKIP_GITHUB_PULL_REQUEST: 'true',
        INPUT_CHANGELOG_HOST: 'https://mirror.example.com',
      });
      expect(fakeManifest.repositoryConfig['.'].changelogHost).to.eql(
        'https://mirror.example.com'
      );
    });

    it('rejects an invalid repo-url', async () => {
      let error: unknown;
      try {
        await main({...env, INPUT_REPO_URL: 'invalid'});
      } catch (e) {
        error = e;
      }
      expect((error as Error).message).to.include('repo-url');
    });
  });
});
