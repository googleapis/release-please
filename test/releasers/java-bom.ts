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

import {describe, it, beforeEach} from 'mocha';

import {expect} from 'chai';
import {JavaBom} from '../../src/releasers/java-bom';

describe('JavaBom', () => {
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
});
