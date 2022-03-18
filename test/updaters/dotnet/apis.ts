// Copyright 2022 Google LLC
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
import {Apis} from '../../../src/updaters/dotnet/apis';
import {Version} from '../../../src/version';

const fixturesPath = './test/updaters/fixtures/dotnet';

describe('Apis', () => {
  describe('updateContent', () => {
    it('updates the specific version while preserving formatting', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './apis.json'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const updater = new Apis(
        'Google.Cloud.SecurityCenter.V1',
        Version.parse('2.12.0')
      );
      const newContent = updater.updateContent(oldContent);
      snapshot(newContent);
    });
  });
});
