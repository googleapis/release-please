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
import {factory} from '../src/factory';
import * as sinon from 'sinon';
import {expect} from 'chai';

const sandbox = sinon.createSandbox();

describe('factory', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('releasePR', () => {
    it('returns instance of dynamically loaded releaser', () => {
      const releasePR = factory.releasePR({
        repoUrl: 'googleapis/simple-test-repo',
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
        releaseType: 'simple',
      });
      expect(releasePR.constructor.name).to.eql('Simple');
      expect(releasePR.packageName).to.eql('simple-test-repo');
    });
    it('throws an error on invalid release type', () => {
      let caught = false;
      try {
        factory.releasePR({
          repoUrl: 'googleapis/simple-test-repo',
          packageName: 'simple-test-repo',
          apiUrl: 'https://api.github.com',
          releaseType: 'base',
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
        factory.releasePRClass('base');
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
      expect(githubRelease.releaseType).to.eql('simple');
    });

    it('allows releaseType to be empty', () => {
      const githubRelease = factory.githubRelease({
        repoUrl: 'googleapis/simple-test-repo',
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
      });
      expect(githubRelease.constructor.name).to.eql('GitHubRelease');
      expect(githubRelease.releaseType).to.be.undefined;
    });
  });
  describe('run', () => {
    it('runs a runnable', async () => {
      const runnable = factory.releasePR({
        repoUrl: 'googleapis/simple-test-repo',
        packageName: 'simple-test-repo',
        apiUrl: 'https://api.github.com',
        releaseType: 'simple',
      });
      sandbox.stub(runnable, 'run').resolves(47);
      expect(await factory.run(runnable)).to.equal(47);
    });
  });
});
