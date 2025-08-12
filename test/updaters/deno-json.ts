// Copyright 2025 Google LLC
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
import {DenoJson} from '../../src/updaters/deno/deno-json';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures/deno';

describe('Deno', () => {
  describe('updateContent', () => {
    it('updates the package version with deno.json', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './deno.json'),
        'utf8'
      );
      const packageJson = new DenoJson({
        version: Version.parse('2.0.0'),
      });
      const newContent = packageJson.updateContent(oldContent);
      snapshot(newContent.replace(/\r\n/g, '\n'));
    });

    it('updates the package version with deno.jsonc', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './deno.jsonc'),
        'utf8'
      );
      const packageJson = new DenoJson({
        version: Version.parse('2.0.0'),
      });
      const newContent = packageJson.updateContent(oldContent);
      snapshot(newContent.replace(/\r\n/g, '\n'));
    });

    it('updates the package version with jsr.json', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './jsr.json'),
        'utf8'
      );
      const packageJson = new DenoJson({
        version: Version.parse('2.0.0'),
      });
      const newContent = packageJson.updateContent(oldContent);
      snapshot(newContent.replace(/\r\n/g, '\n'));
    });
  });
});
