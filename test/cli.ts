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
import {factory} from '../src/factory';
import {GitHubRelease} from '../src/github-release';
import {ReleasePR} from '../src/release-pr';
import {describe, it, afterEach} from 'mocha';
import * as sinon from 'sinon';

import {parser} from '../src/bin/release-please';

const sandbox = sinon.createSandbox();

describe('CLI', () => {
  afterEach(() => {
    sandbox.restore();
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
        (runnable): Promise<undefined> => {
          classToRun = runnable as ReleasePR;
          return Promise.resolve(undefined);
        }
      );
      parser.parse(
        'release-pr --repo-url=googleapis/release-please-cli --package-name=cli-package'
      );
      assert.ok(classToRun! instanceof ReleasePR);
      assert.strictEqual(classToRun.repoUrl, 'googleapis/release-please-cli');
      assert.strictEqual(classToRun.packageName, 'cli-package');
      // Defaults to Node.js release type:
      assert.strictEqual(classToRun.releaseType, 'node');
    });
  });
  describe('github-release', () => {
    it('instantiates a GitHub released based on command line arguments', () => {
      let classToRun: GitHubRelease;
      // This logic is used to capture the class that would
      // be executed, allowing us to validate that the appropriate
      // properties were assigned from the argument parser:
      sandbox.replace(
        factory,
        'run',
        (runnable): Promise<undefined> => {
          classToRun = runnable as GitHubRelease;
          return Promise.resolve(undefined);
        }
      );
      parser.parse(
        'github-release --repo-url=googleapis/release-please-cli --package-name=cli-package'
      );
      assert.ok(classToRun! instanceof GitHubRelease);
      assert.strictEqual(classToRun.repoUrl, 'googleapis/release-please-cli');
      assert.strictEqual(classToRun.packageName, 'cli-package');
      // Defaults to Node.js release type:
      assert.strictEqual(classToRun.releaseType, 'node');
      assert.strictEqual(classToRun.changelogPath, 'CHANGELOG.md');
    });
  });
});
