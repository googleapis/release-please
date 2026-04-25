// Copyright 2026 Google LLC
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

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {BunLock} from '../../src/updaters/node/bun-lock';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures';

describe('BunLock', () => {
  describe('updateContent monorepo', () => {
    it('updates workspace versions', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './bun.lock'),
        'utf8'
      );
      const versionsMap = new Map();
      versionsMap.set('release-please', new Version(14, 0, 0));
      versionsMap.set('release-please-foo', new Version(2, 0, 0));
      versionsMap.set('release-please-bar', new Version(3, 0, 0));
      const bunLock = new BunLock({
        version: Version.parse('14.0.0'),
        versionsMap,
      });
      const newContent = bunLock.updateContent(oldContent);
      snapshot(newContent.replace(/\r\n/g, '\n'));
    });
  });
});
