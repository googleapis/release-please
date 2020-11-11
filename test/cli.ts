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

import {resolve} from 'path';

import {describe, it} from 'mocha';
import {expect, assert} from 'chai';

import command from '../src/bin/command';

function getExampleConfigurationPath() {
  return resolve('./test/fixtures/config', 'simple.json');
}

describe('CLI', () => {
  describe('release-pr', () => {
    it('can be configured using flags', () => {
      const argv = command.parse(
        'release-pr --repo-url=googleapis/release-please-cli --package-name=cli-package'
      );
      expect(argv).includes({
        repoUrl: 'googleapis/release-please-cli',
        releaseType: 'node',
        packageName: 'cli-package',
      });
    });

    it('can be configured using a file', () => {
      const argv = command.parse(
        `release-pr --config=${getExampleConfigurationPath()}`
      );
      expect(argv).includes({
        repoUrl: 'googleapis/release-please-cli',
        releaseType: 'node',
        packageName: 'cli-package--config',
      });
      expect(argv.changelogTypes).to.be.a('string').that.is.not.empty;
    });

    it('converts changelog-types => changelogSections', () => {
      const argv = command.parse(
        `release-pr --config=${getExampleConfigurationPath()}`
      );
      expect(argv).includes({
        repoUrl: 'googleapis/release-please-cli',
        releaseType: 'node',
        packageName: 'cli-package--config',
      });
      expect(argv.changelogTypes).to.be.a('string').that.is.not.empty;
      assert.sameDeepMembers(
        JSON.parse(argv.changelogTypes as string),
        argv.changelogSections as []
      );
    });
  });
});
