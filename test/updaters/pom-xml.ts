/**
 * Copyright 2019 Google LLC. All Rights Reserved.
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

import { PomXML } from '../../src/updaters/java/pom-xml';
import { UpdateOptions } from '../../src/updaters/update';

const fixturesPath = './test/updaters/fixtures';

describe('PomXML', () => {
  describe('updateContent', () => {
    it('updates version in pom.xml', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './pom.xml'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const pomXML = new PomXML({
        path: 'pom.xml',
        changelogEntry: '',
        version: '0.19.0',
        packageName: 'google-auth-library-java',
      });
      const newContent = pomXML.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
