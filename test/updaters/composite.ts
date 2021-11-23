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

import {CompositeUpdater} from '../../src/updaters/composite';
import {JavaUpdate} from '../../src/updaters/java/java-update';
import {Version} from '../../src/version';
import {describe, it} from 'mocha';
import {expect} from 'chai';

describe('CompositeUpdater', () => {
  describe('updateContent', () => {
    it('updates content multiple times', async () => {
      const versions1 = new Map<string, Version>();
      const version1 = Version.parse('1.2.3');
      versions1.set('artifact1', version1);
      const updater1 = new JavaUpdate({
        versionsMap: versions1,
        version: version1,
      });
      const versions2 = new Map<string, Version>();
      const version2 = Version.parse('2.0.0');
      versions2.set('artifact2', version2);
      const updater2 = new JavaUpdate({
        versionsMap: versions2,
        version: version2,
      });
      const composite = new CompositeUpdater(updater1, updater2);
      const input =
        'v1: 1.2.2 // {x-version-update:artifact1:current}\nv2: 1.9.9 // {x-version-update:artifact2:current}';
      const output = await composite.updateContent(input);
      expect(output).to.eql(
        'v1: 1.2.3 // {x-version-update:artifact1:current}\nv2: 2.0.0 // {x-version-update:artifact2:current}'
      );
    });
  });
});
