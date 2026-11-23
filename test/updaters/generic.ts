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
import {expect} from 'chai';
import {Version} from '../../src/version';
import {Generic} from '../../src/updaters/generic';

const fixturesPath = './test/updaters/fixtures';

describe('Generic', () => {
  describe('updateContent', () => {
    it('updates generic version markers', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Version.java'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const versions = new Map<string, Version>();
      const currentDate = new Date('2023-12-01T12:00:00Z');
      const pom = new Generic({
        versionsMap: versions,
        version: Version.parse('v2.3.4'),
        date: currentDate,
        dateFormat: '%d-%m-%Y',
      });
      const newContent = pom.updateContent(oldContent);
      snapshot(newContent);
    });

    it('does not update Java update markers', async () => {
      const oldContent = `
      package com.google.cloud.eventarc.v1.stub;
      final class Version {
        // {x-version-update-start:google-cloud-eventarc:current}
        static final String VERSION = "0.0.0-SNAPSHOT";
        // {x-version-update-end}
      }
      `;
      const versions = new Map<string, Version>();
      versions.set('google-cloud-eventarc', Version.parse('1.0.0'));
      const updater = new Generic({
        versionsMap: versions,
        version: Version.parse('1.0.0'),
      });
      const newContent = updater.updateContent(oldContent);
      // Content should remain unchanged because Generic doesn't support these markers
      expect(newContent).to.eql(oldContent);
    });
  });
});
