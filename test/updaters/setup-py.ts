/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFileSync } from 'fs';
import { basename, resolve } from 'path';
import * as snapshot from 'snap-shot-it';

import { SetupPy } from '../../src/updaters/python/setup-py';

const fixturesPath = './test/updaters/fixtures';

describe('setup.py', () => {
  describe('updateContent', () => {
    it('updates version in setup.py', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './setup.py'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new SetupPy({
        path: 'setup.py',
        changelogEntry: '',
        version: '0.6.0',
        packageName: '',
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
