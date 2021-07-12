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
import {
  factory,
  ReleasePRCommand,
  GitHubReleaseMethod,
  ManifestMethod,
  ReleasePRMethod,
} from '../src/factory';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {RequestHeaders} from '@octokit/types';
import {Ruby, ReleasePRFactoryOptions, ReleasePR} from '../src';

const sandbox = sinon.createSandbox();

describe('factory', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('gitHubInstance', () => {
    const owner = 'google';
    const repo = 'cloud';
    const repoUrls = [
      `${owner}/${repo}`,
      `https://github.com/${owner}/${repo}.git`,
      `git@github.com:${owner}/${repo}`,
    ];
    it('returns a default configured GitHub instance', async () => {
      const gh = factory.gitHubInstance({repoUrl});
      expect(gh.owner).to.equal(owner);
      expect(gh.repo).to.equal(repo);
      expect(gh.fork).to.be.false;
      expect(gh.apiUrl).to.equal('https://api.github.com');
      expect(gh.token).to.be.undefined;
      sandbox.stub(gh, 'getRepositoryDefaultBranch').resolves('main');
      const branch = await gh.getDefaultBranch();
      expect(branch).to.equal('main');
    });
    it('returns a fully configured GitHub instance', async () => {
      const gh = factory.gitHubInstance({
        repoUrl,
        fork: true,
        token: 'my-token',
        apiUrl: 'my-api-url',
        defaultBranch: '1.x',
      });
      expect(gh.owner).to.equal(owner);
      expect(gh.repo).to.equal(repo);
      expect(gh.fork).to.be.true;
      expect(gh.apiUrl).to.equal('my-api-url');
      expect(gh.token).to.equal('my-token');
      sandbox.mock(gh).expects('getRepositoryDefaultBranch').never();
      const branch = await gh.getDefaultBranch();
      expect(branch).to.equal('1.x');
    });
    for (const repoUrl of repoUrls) {
      it(`parses github repo url: ${repoUrl}`, () => {
        const gh = factory.gitHubInstance({repoUrl});
        expect(gh.owner).to.equal(owner);
        expect(gh.repo).to.equal(repo);
      });
    }

    const repoUrl = repoUrls[0];
    it('prefers configured defaultBranch', async () => {
      const gh = factory.gitHubInstance({repoUrl, defaultBranch: '1.x'});
      const branch = await gh.getDefaultBranch();
      expect(branch).to.equal('1.x');
    });
    it('falls back to github defaultBranch', async () => {
      const gh = factory.gitHubInstance({repoUrl});
      const stub = sandbox.stub(gh.octokit.repos, 'get');
      stub
        .withArgs({
          repo,
          owner,
          headers: sinon.match.any as unknown as RequestHeaders,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .resolves({data: {default_branch: 'main'}} as any);
      stub.throwsArg(0);
      const branch = await gh.getDefaultBranch();
      expect(branch).to.equal('main');
    });
  });
  describe('releasePR', () => {
    it('returns a default configured ReleasePR instance', async () => {
      const releasePR = factory.releasePR({
        repoUrl: 'googleapis/ruby-test-repo',
      });
      expect(releasePR.gh.fork).to.be.false;
      expect(releasePR.gh.token).to.be.undefined;
      expect(releasePR.gh.owner).to.equal('googleapis');
      expect(releasePR.gh.repo).to.equal('ruby-test-repo');
      expect(releasePR.gh.apiUrl).to.equal('https://api.github.com');
      expect(releasePR.constructor.name).to.equal('ReleasePR');
      expect(releasePR.labels).to.eql(['autorelease: pending']);
      expect(releasePR.bumpMinorPreMajor).to.be.false;
      expect(releasePR.bumpPatchForMinorPreMajor).to.be.false;
      expect(releasePR.versionBumpStrategy).to.be.undefined;
      expect(releasePR.path).to.be.undefined;
      expect(releasePR.monorepoTags).to.be.false;
      expect(releasePR.releaseAs).to.be.undefined;
      expect(releasePR.snapshot).to.be.undefined;
      expect(releasePR.lastPackageVersion).to.be.undefined;
      expect(releasePR.changelogSections).to.be.undefined;
      expect(releasePR.changelogPath).to.equal('CHANGELOG.md');
      const packageName = await releasePR.getPackageName();
      expect(packageName.name).to.equal('');
      expect(packageName.getComponent()).to.equal('');
    });
    it('returns a fully configured ReleasePR instance', async () => {
      const releasePR = factory.releasePR({
        repoUrl: 'googleapis/ruby-test-repo',
        fork: true,
        token: 'some-token',
        apiUrl: 'https://some.api.com',
        packageName: 'ruby-test-repo',
        releaseType: 'ruby',
        label: 'foo,bar',
        path: 'some/path',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        versionBumpStrategy: 'always-patch',
        releaseAs: '1.2.3',
        snapshot: true,
        monorepoTags: true,
        changelogSections: [{type: 'feat', section: 'Features'}],
        changelogPath: 'HISTORY.md',
        lastPackageVersion: '0.0.1',
        versionFile: 'some/ruby/version.rb',
      });
      expect(releasePR.gh.fork).to.be.true;
      expect(releasePR.gh.token).to.equal('some-token');
      expect(releasePR.gh.owner).to.equal('googleapis');
      expect(releasePR.gh.repo).to.equal('ruby-test-repo');
      expect(releasePR.gh.apiUrl).to.equal('https://some.api.com');
      expect(releasePR.constructor.name).to.equal('Ruby');
      expect(releasePR.labels).to.eql(['foo', 'bar']);
      expect(releasePR.bumpMinorPreMajor).to.be.true;
      expect(releasePR.bumpPatchForMinorPreMajor).to.be.true;
      expect(releasePR.versionBumpStrategy).to.equal('always-patch');
      expect(releasePR.path).to.equal('some/path');
      expect(releasePR.monorepoTags).to.be.true;
      expect(releasePR.releaseAs).to.equal('1.2.3');
      expect(releasePR.snapshot).to.be.true;
      expect(releasePR.lastPackageVersion).to.equal('0.0.1');
      expect((releasePR as Ruby).versionFile).to.equal('some/ruby/version.rb');
      expect(releasePR.changelogSections).to.eql([
        {type: 'feat', section: 'Features'},
      ]);
      expect(releasePR.changelogPath).to.equal('HISTORY.md');
      const packageName = await releasePR.getPackageName();
      expect(packageName.name).to.equal('ruby-test-repo');
      expect(packageName.getComponent()).to.equal('ruby-test-repo');
    });
    it('throws an error on invalid release type', () => {
      expect(() =>
        factory.releasePR({
          repoUrl: 'googleapis/simple-test-repo',
          packageName: 'simple-test-repo',
          apiUrl: 'https://api.github.com',
          releaseType: 'unknown' as 'go', //hack the typing
        })
      ).to.throw();
    });
  });

  describe('releasePRClass', () => {
    it('returns a releaser class', () => {
      const releaseClass = factory.releasePRClass('ruby');
      expect(releaseClass.name).to.equal('Ruby');
    });
    it('returns base class when no releaseType', () => {
      const releaseClass = factory.releasePRClass();
      expect(releaseClass.name).to.equal('ReleasePR');
    });
    it('returns base class when unrecognized releaseType', () => {
      const releaseClass = factory.releasePRClass();
      expect(releaseClass.name).to.equal('ReleasePR');
    });
  });

  describe('githubRelease', () => {
    it('returns a default configured GitHubRelease instance', async () => {
      const ghr = factory.githubRelease({
        repoUrl: 'googleapis/simple-test-repo',
      });
      expect(ghr.constructor.name).to.equal('GitHubRelease');
      expect(ghr.draft).to.be.false;
      expect(ghr.gh.owner).to.equal('googleapis');
      expect(ghr.gh.repo).to.equal('simple-test-repo');
      expect(ghr.gh.token).to.be.undefined;
      expect(ghr.gh.apiUrl).to.equal('https://api.github.com');
      expect(ghr.gh.fork).to.be.false;
      expect(ghr.releasePR.constructor.name).to.equal('ReleasePR');
      expect(ghr.releasePR.labels).to.eql(['autorelease: pending']);
      expect(ghr.releasePR.path).to.be.undefined;
      expect(ghr.releasePR.releaseAs).to.be.undefined;
      expect(ghr.releasePR.bumpMinorPreMajor).to.be.false;
      expect(ghr.releasePR.bumpPatchForMinorPreMajor).to.be.false;
      expect(ghr.releasePR.versionBumpStrategy).to.be.undefined;
      expect(ghr.releasePR.monorepoTags).to.be.false;
      expect(ghr.releasePR.changelogSections).to.be.undefined;
      expect(ghr.releasePR.changelogPath).to.equal('CHANGELOG.md');
      expect(ghr.releasePR.lastPackageVersion).to.be.undefined;
      const packageName = await ghr.releasePR.getPackageName();
      expect(packageName.name).to.equal('');
      expect(packageName.getComponent()).to.equal('');
    });
    it('returns a fully configured GitHubRelease instance', async () => {
      const ghr = factory.githubRelease({
        repoUrl: 'googleapis/ruby-test-repo',
        defaultBranch: '1.x',
        fork: true,
        token: 'some-token',
        apiUrl: 'https://some.api.com',
        releaseType: 'ruby',
        label: 'foo,bar',
        path: 'some/path',
        packageName: 'ruby-test-repo',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        versionBumpStrategy: 'always-patch',
        releaseAs: '1.2.3',
        snapshot: true,
        monorepoTags: true,
        changelogSections: [{type: 'feat', section: 'Features'}],
        changelogPath: 'HISTORY.md',
        lastPackageVersion: '0.0.1',
        versionFile: 'some/ruby/version.rb',
        draft: true,
      });
      expect(ghr.constructor.name).to.equal('GitHubRelease');
      expect(ghr.draft).to.be.true;
      expect(ghr.gh.owner).to.equal('googleapis');
      expect(ghr.gh.repo).to.equal('ruby-test-repo');
      expect(ghr.gh.token).to.equal('some-token');
      expect(ghr.gh.apiUrl).to.equal('https://some.api.com');
      expect(ghr.gh.fork).to.be.true;
      const branch = await ghr.gh.getDefaultBranch();
      expect(branch).to.equal('1.x');
      expect(ghr.releasePR.constructor.name).to.equal('Ruby');
      expect(ghr.releasePR.labels).to.eql(['foo', 'bar']);
      expect(ghr.releasePR.path).to.equal('some/path');
      expect(ghr.releasePR.releaseAs).to.equal('1.2.3');
      expect(ghr.releasePR.bumpMinorPreMajor).to.be.true;
      expect(ghr.releasePR.bumpPatchForMinorPreMajor).to.be.true;
      expect(ghr.releasePR.versionBumpStrategy).to.equal('always-patch');
      expect(ghr.releasePR.monorepoTags).to.be.true;
      expect(ghr.releasePR.changelogSections).to.eql([
        {type: 'feat', section: 'Features'},
      ]);
      expect(ghr.releasePR.changelogPath).to.equal('HISTORY.md');
      expect(ghr.releasePR.lastPackageVersion).to.equal('0.0.1');
      expect((ghr.releasePR as Ruby).versionFile).to.equal(
        'some/ruby/version.rb'
      );
      const packageName = await ghr.releasePR.getPackageName();
      expect(packageName.name).to.equal('ruby-test-repo');
      expect(packageName.getComponent()).to.equal('ruby-test-repo');
    });
  });
  describe('manifest', () => {
    it('returns a default configured Manifest class', () => {
      const m = factory.manifest({repoUrl: 'googleapis/simple-test-repo'});
      expect(m.constructor.name).to.equal('Manifest');
      expect(m.gh.owner).to.equal('googleapis');
      expect(m.gh.repo).to.equal('simple-test-repo');
      expect(m.gh.token).to.be.undefined;
      expect(m.gh.apiUrl).to.equal('https://api.github.com');
      expect(m.gh.fork).to.be.false;
      expect(m.configFileName).to.equal('release-please-config.json');
      expect(m.manifestFileName).to.equal('.release-please-manifest.json');
    });
    it('returns a fully configured Manifest class', async () => {
      const m = factory.manifest({
        repoUrl: 'googleapis/ruby-test-repo',
        defaultBranch: '1.x',
        fork: true,
        token: 'some-token',
        apiUrl: 'https://some.api.com',
        configFile: 'foo-config.json',
        manifestFile: '.foo-manifest.json',
      });
      expect(m.constructor.name).to.equal('Manifest');
      expect(m.gh.owner).to.equal('googleapis');
      expect(m.gh.repo).to.equal('ruby-test-repo');
      expect(m.gh.token).to.equal('some-token');
      expect(m.gh.apiUrl).to.equal('https://some.api.com');
      expect(m.gh.fork).to.be.true;
      const branch = await m.gh.getDefaultBranch();
      expect(branch).to.equal('1.x');
      expect(m.configFileName).to.equal('foo-config.json');
      expect(m.manifestFileName).to.equal('.foo-manifest.json');
    });
  });

  describe('runCommand', () => {
    it('errors on bad command', async () => {
      sandbox.stub(factory, 'call').resolves(undefined);
      expect(() =>
        factory.runCommand(
          'foobar' as ReleasePRCommand,
          {bar: 'baz'} as unknown as ReleasePRFactoryOptions
        )
      ).to.throw('Invalid command(foobar) with options({"bar":"baz"})');
    });
  });

  describe('call', () => {
    it('calls ReleasePR.run', async () => {
      const instance = factory.releasePR({
        repoUrl: 'googleapis/simple-test-repo',
        releaseType: 'simple',
      });
      sandbox.stub(instance, 'run').resolves(47);
      expect(await factory.call(instance, 'run')).to.equal(47);
    });
    it('errors with bad method on ReleasePR', async () => {
      const instance = factory.releasePR({
        repoUrl: 'googleapis/simple-test-repo',
        releaseType: 'simple',
      });
      expect(() => factory.call(instance, 'foo' as ReleasePRMethod)).to.throw(
        'No such method(foo) on Simple'
      );
    });
    it('calls a GitHubRelease instance', async () => {
      const instance = factory.githubRelease({
        repoUrl: 'googleapis/simple-test-repo',
        releaseType: 'simple',
      });
      const ghRelease = {
        major: 1,
        minor: 2,
        patch: 3,
        version: '1.2.3',
        sha: 'abc123',
        html_url: 'https://release.url',
        upload_url: 'https://upload.url/',
        name: 'v1.2.3',
        tag_name: 'v1.2.3',
        pr: 1,
        draft: false,
        body: '\n* entry',
      };
      sandbox.stub(instance, 'run').resolves(ghRelease);
      expect(await factory.call(instance, 'run')).to.eql(ghRelease);
    });
    it('errors with bad method on GitHubRelease', async () => {
      const instance = factory.githubRelease({
        repoUrl: 'googleapis/simple-test-repo',
        releaseType: 'simple',
      });
      expect(() =>
        factory.call(instance, 'foo' as GitHubReleaseMethod)
      ).to.throw('No such method(foo) on GitHubRelease');
    });
    it('calls a Manifest instance', async () => {
      const instance = factory.manifest({
        repoUrl: 'googleapis/simple-test-repo',
      });
      sandbox.stub(instance, 'pullRequest').resolves(32);
      expect(await factory.call(instance, 'pullRequest')).to.eql(32);
    });
    it('errors with bad method on Manifest', async () => {
      const instance = factory.manifest({
        repoUrl: 'googleapis/simple-test-repo',
      });
      expect(() => factory.call(instance, 'foo' as ManifestMethod)).to.throw(
        'No such method(foo) on Manifest'
      );
    });
    it('errors with bad method on unknown', async () => {
      expect(() =>
        factory.call(
          {foo: () => 'in foo'} as unknown as ReleasePR,
          'foo' as ReleasePRMethod
        )
      ).to.throw('Unknown instance.');
    });
  });
});
