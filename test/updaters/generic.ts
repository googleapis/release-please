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
import {mergeUpdates} from '../../src/updaters/composite';

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
        component: 'an-app-called-major',
      });
      const newContent = pom.updateContent(oldContent);
      snapshot(newContent);
    });

    describe('component scoped markers', () => {
      const version = Version.parse('2.3.4');
      const versionsMap = new Map<string, Version>();
      const oldContent = [
        'unscoped: 1.0.0 # x-release-please-version',
        'app1: 1.0.0 # x-release-please-app1-version',
        'app2: 1.0.0 # x-release-please-app2-version',
        'major: 1 # x-release-please-app1-major',
        'date-utils: 1.0.0 # x-release-please-date-utils-version',
        'html: 1.0.0 <!--x-release-please-app1-version-->',
        '# x-release-please-start-app1-version',
        'app1-block: 1.0.0',
        '# x-release-please-end',
        '# x-release-please-start-app2-version',
        'app2-block: 1.0.0',
        '# x-release-please-end',
      ].join('\n');

      it('updates markers scoped to its component and unscoped markers', () => {
        const updater = new Generic({version, versionsMap, component: 'app1'});
        const newContent = updater.updateContent(oldContent);
        expect(newContent.split('\n')).to.eql([
          'unscoped: 2.3.4 # x-release-please-version',
          'app1: 2.3.4 # x-release-please-app1-version',
          'app2: 1.0.0 # x-release-please-app2-version',
          'major: 2 # x-release-please-app1-major',
          'date-utils: 1.0.0 # x-release-please-date-utils-version',
          'html: 2.3.4 <!--x-release-please-app1-version-->',
          '# x-release-please-start-app1-version',
          'app1-block: 2.3.4',
          '# x-release-please-end',
          '# x-release-please-start-app2-version',
          'app2-block: 1.0.0',
          '# x-release-please-end',
        ]);
      });

      it('only updates unscoped markers without a component', () => {
        const updater = new Generic({version, versionsMap});
        const newContent = updater.updateContent(oldContent);
        expect(newContent.split('\n')).to.eql([
          'unscoped: 2.3.4 # x-release-please-version',
          'app1: 1.0.0 # x-release-please-app1-version',
          'app2: 1.0.0 # x-release-please-app2-version',
          'major: 1 # x-release-please-app1-major',
          'date-utils: 1.0.0 # x-release-please-date-utils-version',
          'html: 1.0.0 <!--x-release-please-app1-version-->',
          '# x-release-please-start-app1-version',
          'app1-block: 1.0.0',
          '# x-release-please-end',
          '# x-release-please-start-app2-version',
          'app2-block: 1.0.0',
          '# x-release-please-end',
        ]);
      });

      it('does not treat a component starting with a scope as that scope', () => {
        const updater = new Generic({
          version,
          versionsMap,
          component: 'date-utils',
        });
        const newContent = updater.updateContent(oldContent);
        expect(newContent.split('\n')[4]).to.eql(
          'date-utils: 2.3.4 # x-release-please-date-utils-version'
        );
        expect(newContent.split('\n')[1]).to.eql(
          'app1: 1.0.0 # x-release-please-app1-version'
        );
      });

      it('escapes regex characters in the component name', () => {
        const content = [
          'a: 1.0.0 # x-release-please-my.app-version',
          'b: 1.0.0 # x-release-please-myXapp-version',
        ].join('\n');
        const updater = new Generic({
          version,
          versionsMap,
          component: 'my.app',
        });
        expect(updater.updateContent(content).split('\n')).to.eql([
          'a: 2.3.4 # x-release-please-my.app-version',
          'b: 1.0.0 # x-release-please-myXapp-version',
        ]);
        expect(
          () => new Generic({version, versionsMap, component: 'my(app'})
        ).not.to.throw();
      });

      it('lets each component update its own markers in a shared file', () => {
        const merged = mergeUpdates([
          {
            path: 'values.yaml',
            createIfMissing: false,
            updater: new Generic({
              version: Version.parse('2.0.0'),
              versionsMap,
              component: 'app1',
            }),
          },
          {
            path: 'values.yaml',
            createIfMissing: false,
            updater: new Generic({
              version: Version.parse('3.0.0'),
              versionsMap,
              component: 'app2',
            }),
          },
        ]);
        expect(merged).to.have.lengthOf(1);
        const newContent = merged[0].updater.updateContent(oldContent);
        expect(newContent.split('\n')).to.include.members([
          'app1: 2.0.0 # x-release-please-app1-version',
          'app2: 3.0.0 # x-release-please-app2-version',
          'app1-block: 2.0.0',
          'app2-block: 3.0.0',
        ]);
      });
    });
  });
});
