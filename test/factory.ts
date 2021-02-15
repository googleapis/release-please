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
import * as assert from 'assert';
import {factory, ReleasePRCommands} from '../src/factory';
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
          headers: (sinon.match.any as unknown) as RequestHeaders,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .resolves({data: {default_branch: 'main'}} as any);
      stub.throwsArg(0);
      const branch = await gh.getDefaultBranch();
      expect(branch).to.equal('main');
    });
  });
  describe('releasePR', () => {
    it('returns instance of dynamically loaded releaser', async () => {
      const releasePR = factory.releasePR({
        repoUrl: 'googleapis/ruby-test-repo',
        packageName: 'ruby-test-repo',
        releaseType: 'ruby',
      });
      expect(releasePR.constructor.name).to.equal('Ruby');
      expect(releasePR.labels).to.eql(['autorelease: pending']);
      expect(releasePR.bumpMinorPreMajor).to.be.false;
      expect(releasePR.fork).to.be.false;
      expect(releasePR.path).to.be.undefined;
      expect(releasePR.monorepoTags).to.be.false;
      expect(releasePR.releaseAs).to.be.undefined;
      expect(releasePR.snapshot).to.be.undefined;
      expect(releasePR.lastPackageVersion).to.be.undefined;
      expect(releasePR.changelogSections).to.be.undefined;
      expect((releasePR as Ruby).versionFile).to.equal('');
      const packageName = await releasePR.getPackageName();
      expect(packageName.name).to.equal('ruby-test-repo');
      expect(packageName.getComponent()).to.equal('ruby-test-repo');
    });
    it('throws an error on invalid release type', () => {
      let caught = false;
      try {
        factory.releasePR({
          repoUrl: 'googleapis/simple-test-repo',
          packageName: 'simple-test-repo',
          apiUrl: 'https://api.github.com',
          releaseType: 'unknown' as 'go', //hack the typing
        });
        assert.fail();
      } catch (e) {
        caught = true;
      }
      expect(caught).to.be.true;
    });
  });

  describe('releasePRClass', () => {
    it('returns a releaser class', () => {
      const releaseClass = factory.releasePRClass('ruby');
      expect(releaseClass.name).to.equal('Ruby');
    });

    it('throws and error on invalid release type', () => {
      let caught = false;
      try {
        factory.releasePRClass('unknown' as 'go'); // hack the typing
        assert.fail();
      } catch (e) {
        caught = true;
      }
      expect(caught).to.be.true;
    });
  });

  describe('githubRelease', () => {
    it('returns a GitHub release with a known release type', () => {
      const githubRelease = factory.githubRelease({
        repoUrl: 'googleapis/simple-test-repo',
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
        releaseType: 'simple',
      });
      expect(githubRelease.constructor.name).to.eql('GitHubRelease');
      expect(githubRelease.releasePR.constructor.name).to.eql('Simple');
    });

    it('allows releaseType to be empty', () => {
      const githubRelease = factory.githubRelease({
        repoUrl: 'googleapis/simple-test-repo',
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
      });
      expect(githubRelease.constructor.name).to.eql('GitHubRelease');
      expect(githubRelease.releasePR.constructor.name).to.eql('ReleasePR');
    });

    it('returns a GitHubRelease with all the things', () => {
      const ghr = factory.githubRelease({
        repoUrl: 'googleapis/simple-test-repo',
        defaultBranch: '1.x',
        token: 'some-token',
        apiUrl: 'https://some.api.com',
        releaseType: 'ruby',
        label: 'foo,bar',
        path: 'some/path',
        packageName: 'simple-test-repo',
        bumpMinorPreMajor: true,
        releaseAs: '1.2.3',
        snapshot: true,
        monorepoTags: true,
        fork: true,
        changelogSections: [{type: 'feat', section: 'Features'}],
        lastPackageVersion: '0.0.1',
        versionFile: 'some/ruby/version.rb',
      });
      expect(ghr.constructor.name).to.equal('GitHubRelease');
      expect(ghr.gh.owner).to.equal('googleapis');
      expect(ghr.gh.repo).to.equal('simple-test-repo');
      expect(ghr.gh.token).to.equal('some-token');
      expect(ghr.gh.apiUrl).to.equal('https://some.api.com');
      expect(ghr.releasePR.constructor.name).to.equal('Ruby');
      expect(ghr.releasePR.labels).to.eql(['foo', 'bar']);
      expect(ghr.releasePR.path).to.equal('some/path');
      expect(ghr.releasePR.path).to.equal('some/path');
      expect(ghr.releasePR.releaseAs).to.equal('1.2.3');
      expect(ghr.releasePR.bumpMinorPreMajor).to.be.true;
      expect(ghr.releasePR.monorepoTags).to.be.true;
      expect(ghr.releasePR.fork).to.be.true;
      expect(ghr.releasePR.changelogSections).to.eql([
        {type: 'feat', section: 'Features'},
      ]);
      expect(ghr.releasePR.lastPackageVersion).to.equal('0.0.1');
      expect((ghr.releasePR as Ruby).versionFile).to.equal(
        'some/ruby/version.rb'
      );
    });
  });

  describe('runCommand', () => {
    it('errors on bad command', async () => {
      sandbox.stub(factory, 'call').resolves(undefined);
      let caught = false;
      let err: Error;
      try {
        await factory.runCommand(
          'foobar' as ReleasePRCommands,
          ({bar: 'baz'} as unknown) as ReleasePRFactoryOptions
        );
      } catch (e) {
        err = e;
        caught = true;
      }
      expect(caught).to.be.true;
      expect(err!.message).to.equal(
        'Invalid command(foobar) with options({"bar":"baz"})'
      );
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
      let caught = false;
      let err: Error;
      try {
        await factory.call(instance, 'foo' as 'run');
      } catch (e) {
        err = e;
        caught = true;
      }
      expect(caught).to.be.true;
      expect(err!.message).to.equal('No such method(foo) on Simple');
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
      };
      sandbox.stub(instance, 'run').resolves(ghRelease);
      expect(await factory.call(instance, 'run')).to.eql(ghRelease);
    });
    it('errors with bad method on GitHubRelease', async () => {
      const instance = factory.githubRelease({
        repoUrl: 'googleapis/simple-test-repo',
        releaseType: 'simple',
      });
      let caught = false;
      let err: Error;
      try {
        await factory.call(instance, 'foo' as 'run');
      } catch (e) {
        err = e;
        caught = true;
      }
      expect(caught).to.be.true;
      expect(err!.message).to.equal('No such method(foo) on GitHubRelease');
    });
    it('errors with bad method on unknown', async () => {
      let caught = false;
      let err: Error;
      try {
        await factory.call(
          ({foo: () => 'in foo'} as unknown) as ReleasePR,
          'foo' as 'run'
        );
      } catch (e) {
        err = e;
        caught = true;
      }
      expect(caught).to.be.true;
      expect(err!.message).to.equal('Unknown instance.');
    });
  });
});
