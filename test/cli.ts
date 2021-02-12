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
import {factory} from '../src/factory';
import {GitHubRelease} from '../src/github-release';
import {ReleasePR} from '../src/release-pr';
import {describe, it, afterEach} from 'mocha';
import * as sinon from 'sinon';

import {parser, handleError} from '../src/bin/release-please';
import {ParseCallback} from 'yargs';
import chalk = require('chalk');

const sandbox = sinon.createSandbox();

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
      handleError.logger = ({
        error: (msg: string) => logs.push(msg),
      } as unknown) as Console;
      handleError.yargsArgs = {debug: true, _: ['foobar'], $0: 'mocha?'};
      handleError(err);
      expect(logs).to.eql([
        chalk.red('command foobar failed with status 404'),
        '---------',
        stack,
      ]);
    });
  });
  describe('release-pr', () => {
    it('instantiates release PR based on command line arguments', () => {
      let classToRun: ReleasePR;
      // This logic is used to capture the class that would
      // be executed, allowing us to validate that the appropriate
      // properties were assigned from the argument parser:
      sandbox.replace(
        factory,
        'run',
        // Parameter 'runnable' implicitly has an 'any' type.
        // Attempting to properly type this arrow func as matching the
        // factory.run overloads is unduly complex if even possible?
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore: stubbing an overloaded function.
        (runnable): Promise<undefined> => {
          classToRun = runnable as ReleasePR;
          return Promise.resolve(undefined);
        }
      );
      parser.parse(
        'release-pr --repo-url=googleapis/release-please-cli --package-name=cli-package'
      );
      assert.ok(classToRun! instanceof ReleasePR);
      assert.strictEqual(classToRun.gh.owner, 'googleapis');
      assert.strictEqual(classToRun.gh.repo, 'release-please-cli');
      assert.strictEqual(classToRun.packageName, 'cli-package');
      // Defaults to Node.js release type:
      assert.strictEqual(classToRun.constructor.name, 'Node');
    });
    it('validates releaseType choices', done => {
      sandbox.stub(factory, 'run').resolves(undefined);

      const cmd =
        'release-pr ' +
        '--release-type=foobar ' +
        '--repo-url=googleapis/release-please-cli ' +
        '--package-name=cli-package';
      const choices = [
        'go',
        'go-yoshi',
        'java-bom',
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
  describe('latest-tag', () => {
    it('instantiates release PR for latestTag', () => {
      let classToRun: ReleasePR;
      sandbox.replace(
        factory,
        'run',
        // Parameter 'runnable' implicitly has an 'any' type.
        // Attempting to properly type this arrow func as matching the
        // factory.run overloads is unduly complex if even possible?
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore: stubbing an overloaded function.
        (runnable): Promise<undefined> => {
          classToRun = runnable as ReleasePR;
          return Promise.resolve(undefined);
        }
      );
      parser.parse(
        'latest-tag --repo-url=googleapis/release-please-cli --package-name=cli-package'
      );
      assert.ok(classToRun! instanceof ReleasePR);
      assert.strictEqual(classToRun.gh.owner, 'googleapis');
      assert.strictEqual(classToRun.gh.repo, 'release-please-cli');
      assert.strictEqual(classToRun.packageName, 'cli-package');
      // Defaults to Node.js release type:
      assert.strictEqual(classToRun.constructor.name, 'Node');
    });
  });
  describe('github-release', () => {
    it('instantiates a GitHub released based on command line arguments', async () => {
      let classToRun: GitHubRelease;
      // This logic is used to capture the class that would
      // be executed, allowing us to validate that the appropriate
      // properties were assigned from the argument parser:
      sandbox.replace(
        factory,
        'run',
        // Parameter 'runnable' implicitly has an 'any' type.
        // Attempting to properly type this arrow func as matching the
        // factory.run overloads is unduly complex if even possible?
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore: stubbing an overloaded function.
        (runnable): Promise<undefined> => {
          classToRun = runnable as GitHubRelease;
          return Promise.resolve(undefined);
        }
      );
      const pkgName = 'cli-package';
      const cmd =
        'github-release ' +
        '--repo-url=googleapis/release-please-cli ' +
        '--release-type=node ' +
        `--package-name=${pkgName}`;
      parser.parse(cmd);
      assert.ok(classToRun! instanceof GitHubRelease);
      assert.strictEqual(classToRun.gh.owner, 'googleapis');
      assert.strictEqual(classToRun.gh.repo, 'release-please-cli');
      assert.strictEqual(classToRun.changelogPath, 'CHANGELOG.md');

      const jsonPkg = `{"name": "${pkgName}"}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sandbox.stub(classToRun.releasePR, 'getPkgJsonContents' as any).resolves({
        sha: 'abc123',
        content: Buffer.from(jsonPkg, 'utf8').toString('base64'),
        parsedContent: jsonPkg,
      });
      assert.strictEqual(
        (await classToRun.releasePR.getPackageName()).name,
        'cli-package'
      );
      // Defaults to Node.js release type:
      assert.strictEqual(classToRun.releasePR.constructor.name, 'Node');
    });
    it('instantiates a GitHub released without releaseType', async () => {
      let classToRun: GitHubRelease;
      // This logic is used to capture the class that would
      // be executed, allowing us to validate that the appropriate
      // properties were assigned from the argument parser:
      sandbox.replace(
        factory,
        'run',
        // Parameter 'runnable' implicitly has an 'any' type.
        // Attempting to properly type this arrow func as matching the
        // factory.run overloads is unduly complex if even possible?
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore: stubbing an overloaded function.
        (runnable): Promise<undefined> => {
          classToRun = runnable as GitHubRelease;
          return Promise.resolve(undefined);
        }
      );
      const cmd = 'github-release --repo-url=googleapis/release-please-cli ';
      parser.parse(cmd);
      assert.ok(classToRun! instanceof GitHubRelease);
      assert.strictEqual(classToRun.releasePR.constructor.name, 'ReleasePR');
      assert.strictEqual(
        (await classToRun.releasePR.getPackageName()).name,
        ''
      );
    });
  });
});
