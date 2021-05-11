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

import * as assert from 'assert';
import {expect} from 'chai';
import {
  factory,
  ReleasePRCallResult,
  CallResult,
  ReleasePRMethod,
  GitHubReleaseCallResult,
  Method,
  GitHubReleaseMethod,
  ManifestMethod,
  ManifestCallResult,
} from '../src/factory';
import {GitHubRelease} from '../src/github-release';
import {ReleasePR} from '../src/release-pr';
import {describe, it, afterEach} from 'mocha';
import * as sinon from 'sinon';

import {parser, handleError} from '../src/bin/release-please';
import {ParseCallback} from 'yargs';
import chalk = require('chalk');
import {Manifest} from '../src/manifest';
import snapshot = require('snap-shot-it');

const sandbox = sinon.createSandbox();

let instanceToRun: Manifest | ReleasePR | GitHubRelease;
let methodCalled: Method;

function callStub(
  instance: Manifest,
  method: ManifestMethod
): ManifestCallResult;
function callStub(
  instance: ReleasePR,
  method: ReleasePRMethod
): ReleasePRCallResult;
function callStub(
  instance: GitHubRelease,
  method: GitHubReleaseMethod
): GitHubReleaseCallResult;
function callStub(
  instance: Manifest | ReleasePR | GitHubRelease,
  method: Method
): CallResult {
  instanceToRun = instance;
  methodCalled = method;
  return Promise.resolve(undefined);
}

describe('CLI', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('handleError', () => {
    it('handles an error', () => {
      const stack = 'bad\nmore\nbad';
      const err = {
        body: {a: 1},
        status: 404,
        message: 'bad',
        stack,
      };
      const logs: string[] = [];
      handleError.logger = {
        error: (msg: string) => logs.push(msg),
      } as unknown as Console;
      handleError.yargsArgs = {debug: true, _: ['foobar'], $0: 'mocha?'};
      handleError(err);
      expect(logs).to.eql([
        chalk.red('command foobar failed with status 404'),
        '---------',
        stack,
      ]);
    });
    it('needs yargs', () => {
      handleError.yargsArgs = undefined;
      expect(() => handleError({message: '', stack: ''})).to.throw(
        'Set handleError.yargsArgs with a yargs.Arguments instance.'
      );
    });
  });
  describe('manifest', () => {
    for (const [cmd, mtd] of [
      ['manifest-pr', 'pullRequest'],
      ['manifest-release', 'githubRelease'],
    ]) {
      it(`instantiates Manifest for ${cmd}/${mtd}`, () => {
        sandbox.replace(factory, 'call', callStub);
        parser.parse(`${cmd} --repo-url=googleapis/release-please-cli`);
        assert.strictEqual(methodCalled, mtd);
        assert.ok(instanceToRun! instanceof Manifest);
        assert.strictEqual(instanceToRun.gh.owner, 'googleapis');
        assert.strictEqual(instanceToRun.gh.repo, 'release-please-cli');
        assert.strictEqual(
          instanceToRun.configFileName,
          'release-please-config.json'
        );
        assert.strictEqual(
          instanceToRun.manifestFileName,
          '.release-please-manifest.json'
        );
      });
      it(`instantiates Manifest for ${cmd}/${mtd} config/manifest`, () => {
        sandbox.replace(factory, 'call', callStub);
        parser.parse(
          `${cmd} --repo-url=googleapis/release-please-cli ` +
            '--config-file=foo.json --manifest-file=.bar.json'
        );
        assert.strictEqual(methodCalled, mtd);
        assert.ok(instanceToRun! instanceof Manifest);
        assert.strictEqual(instanceToRun.gh.owner, 'googleapis');
        assert.strictEqual(instanceToRun.gh.repo, 'release-please-cli');
        assert.strictEqual(instanceToRun.configFileName, 'foo.json');
        assert.strictEqual(instanceToRun.manifestFileName, '.bar.json');
      });
    }
  });
  describe('release-pr', () => {
    it('instantiates release PR based on command line arguments', () => {
      sandbox.replace(factory, 'call', callStub);
      parser.parse(
        'release-pr ' +
          '--repo-url=googleapis/release-please-cli ' +
          '--package-name=cli-package ' +
          "--pull-request-title-pattern='chore${scope}: release${component} ${version}'"
      );
      assert.strictEqual(methodCalled, 'run');
      assert.ok(instanceToRun! instanceof ReleasePR);
      assert.strictEqual(instanceToRun.gh.owner, 'googleapis');
      assert.strictEqual(instanceToRun.gh.repo, 'release-please-cli');
      assert.strictEqual(instanceToRun.packageName, 'cli-package');
      // Defaults to Node.js release type:
      assert.strictEqual(instanceToRun.constructor.name, 'Node');
      assert.strictEqual(
        instanceToRun.pullRequestTitlePattern,
        'chore${scope}: release${component} ${version}'
      );
    });
    it('validates releaseType choices', done => {
      sandbox.stub(factory, 'call').resolves(undefined);
      const cmd =
        'release-pr ' +
        '--release-type=foobar ' +
        '--repo-url=googleapis/release-please-cli ' +
        '--package-name=cli-package';
      const choices = [
        'go',
        'go-yoshi',
        'java-bom',
        'java-lts',
        'java-yoshi',
        'node',
        'ocaml',
        'php-yoshi',
        'python',
        'ruby',
        'ruby-yoshi',
        'rust',
        'simple',
        'terraform-module',
        'helm',
      ];
      const parseCallback: ParseCallback = (err, _argv, _output) => {
        expect(err).to.be.an('Error');
        expect(err)
          .to.have.property('message')
          .to.equal(
            'Invalid values:\n  Argument: release-type, Given: "foobar", ' +
              'Choices: ' +
              choices.map(c => `"${c}"`).join(', ')
          );
        done();
      };
      parser.parse(cmd, parseCallback);
    });
  });
  describe('flags', () => {
    it('release-pr flags', done => {
      sandbox.stub(factory, 'call').resolves(undefined);
      const cmd = 'release-pr --help';
      const parseCallback: ParseCallback = (_err, _argv, output) => {
        snapshot(output);
        done();
      };
      parser.parse(cmd, parseCallback);
    });
    it('latest-tag flags', done => {
      sandbox.stub(factory, 'call').resolves(undefined);
      const cmd = 'latest-tag --help';
      const parseCallback: ParseCallback = (_err, _argv, output) => {
        snapshot(output);
        done();
      };
      parser.parse(cmd, parseCallback);
    });
    it('github-release flags', done => {
      sandbox.stub(factory, 'call').resolves(undefined);
      const cmd = 'github-release --help';
      const parseCallback: ParseCallback = (_err, _argv, output) => {
        snapshot(output);
        done();
      };
      parser.parse(cmd, parseCallback);
    });
    it('manifest-pr flags', done => {
      sandbox.stub(factory, 'call').resolves(undefined);
      const cmd = 'manifest-pr --help';
      const parseCallback: ParseCallback = (_err, _argv, output) => {
        snapshot(output);
        done();
      };
      parser.parse(cmd, parseCallback);
    });
    it('manifest-release flags', done => {
      sandbox.stub(factory, 'call').resolves(undefined);
      const cmd = 'manifest-release --help';
      const parseCallback: ParseCallback = (_err, _argv, output) => {
        snapshot(output);
        done();
      };
      parser.parse(cmd, parseCallback);
    });
  });
  describe('latest-tag', () => {
    it('instantiates release PR for latestTag', () => {
      sandbox.replace(factory, 'call', callStub);
      parser.parse(
        'latest-tag --repo-url=googleapis/release-please-cli --package-name=cli-package'
      );
      assert.strictEqual(methodCalled, 'latestTag');
      assert.ok(instanceToRun! instanceof ReleasePR);
      assert.strictEqual(instanceToRun.gh.owner, 'googleapis');
      assert.strictEqual(instanceToRun.gh.repo, 'release-please-cli');
      assert.strictEqual(instanceToRun.packageName, 'cli-package');
      // Defaults to Node.js release type:
      assert.strictEqual(instanceToRun.constructor.name, 'Node');
    });
  });
  describe('github-release', () => {
    it('instantiates a GitHub released based on command line arguments', async () => {
      sandbox.replace(factory, 'call', callStub);
      const pkgName = 'cli-package';
      const cmd =
        'github-release ' +
        '--repo-url=googleapis/release-please-cli ' +
        '--release-type=node ' +
        `--package-name=${pkgName}`;
      parser.parse(cmd);
      assert.strictEqual(methodCalled, 'run');
      assert.ok(instanceToRun! instanceof GitHubRelease);
      assert.strictEqual(instanceToRun.gh.owner, 'googleapis');
      assert.strictEqual(instanceToRun.gh.repo, 'release-please-cli');

      const jsonPkg = `{"name": "${pkgName}"}`;
      sandbox.stub(instanceToRun.releasePR.gh, 'getFileContents').resolves({
        sha: 'abc123',
        content: Buffer.from(jsonPkg, 'utf8').toString('base64'),
        parsedContent: jsonPkg,
      });
      assert.strictEqual(
        (await instanceToRun.releasePR.getPackageName()).name,
        'cli-package'
      );
      assert.strictEqual(instanceToRun.releasePR.changelogPath, 'CHANGELOG.md');
      // Defaults to Node.js release type:
      assert.strictEqual(instanceToRun.releasePR.constructor.name, 'Node');
    });
    it('instantiates a GitHub released without releaseType', async () => {
      sandbox.replace(factory, 'call', callStub);
      const cmd = 'github-release --repo-url=googleapis/release-please-cli ';
      parser.parse(cmd);
      assert.strictEqual(methodCalled, 'run');
      assert.ok(instanceToRun! instanceof GitHubRelease);
      assert.strictEqual(instanceToRun.releasePR.constructor.name, 'ReleasePR');
      assert.strictEqual(
        (await instanceToRun.releasePR.getPackageName()).name,
        ''
      );
    });
  });
});
