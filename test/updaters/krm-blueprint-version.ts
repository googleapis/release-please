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

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {KRMBlueprintVersion} from '../../src/updaters/krm/krm-blueprint-version';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures/krm';

describe('KRM Blueprint', () => {
  const tests = [
    {
      name: 'simpleKRM.yaml',
      previousVersion: '0.2.0',
      expectedVersion: '2.1.0',
    },
    {
      name: 'multiKRMwithFn.yaml',
      previousVersion: '0.2.0',
      expectedVersion: '18.0.0',
    },
  ];
  describe('updateContent', () => {
    tests.forEach(test => {
      describe('with previousVersion', () => {
        it(`updates version in ${test.name}`, async () => {
          const oldContent = readFileSync(
            resolve(fixturesPath, test.name),
            'utf8'
          ).replace(/\r\n/g, '\n');

          const versionsMap = new Map();
          versionsMap.set(
            'previousVersion',
            Version.parse(test.previousVersion)
          );
          const version = new KRMBlueprintVersion({
            version: Version.parse(test.expectedVersion),
            versionsMap,
          });
          const newContent = version.updateContent(oldContent);
          snapshot(newContent);
        });
      });
      describe('without previousVersion', () => {
        it(`updates version in ${test.name}`, async () => {
          const oldContent = readFileSync(
            resolve(fixturesPath, test.name),
            'utf8'
          ).replace(/\r\n/g, '\n');

          const version = new KRMBlueprintVersion({
            version: Version.parse(test.expectedVersion),
          });
          const newContent = version.updateContent(oldContent);
          snapshot(newContent);
        });
      });
    });
  });
});
