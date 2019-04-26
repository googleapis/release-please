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

import {Changelog} from '../../src/updaters/changelog';
import * as chai from 'chai';
import * as chaiJestSnapshot from 'chai-jest-snapshot';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {UpdateOptions} from '../../src/updaters/update';
 
const fixturesPath = './test/updaters/fixtures'

chai.use(chaiJestSnapshot).should();
beforeEach(function () { chaiJestSnapshot.configureUsingMochaContext(this) })

describe('ChangelogUpdater', () => {
  describe('updateContent', () => {
    it('inserts content at appropriate location if CHANGELOG exists', async () => {
      const oldContent = readFileSync(resolve(fixturesPath, './CHANGELOG.md'), 'utf8');
      const changelog = new Changelog({
        path: 'CHANGELOG.md',
        changelogEntry: "## 2.0.0\n\n* added a new foo to bar.",
        version: '1.0.0'
      });
      const newContent = changelog.updateContent(oldContent);
      newContent.should.matchSnapshot();
    });
  });
});
