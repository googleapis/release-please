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

import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {VersionTxt} from '../../src/updaters/version-txt';

describe('VersionTxt', () => {
  describe('updateContent', () => {
    it('updates the package version', async () => {
      const versionTxt = new VersionTxt({
        path: 'version.txt',
        changelogEntry: '',
        version: '2.3.4',
        packageName: 'simple-package',
      });
      const newContent = versionTxt.updateContent();
      snapshot(newContent);
    });
  });
});
