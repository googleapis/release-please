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

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {PullRequestBody} from '../../src/util/pull-request-body';
import snapshot = require('snap-shot-it');
import {Version} from '../../src/version';

const fixturesPath = './test/fixtures/release-notes';

describe('PullRequestBody', () => {
  describe('parse', () => {
    it('should parse multiple components', () => {
      const body = readFileSync(
        resolve(fixturesPath, './multiple.txt'),
        'utf8'
      );
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(4);
      expect(releaseData[0].component).to.eql(
        '@google-automations/bot-config-utils'
      );
      expect(releaseData[0].version?.toString()).to.eql('3.2.0');
      expect(releaseData[0].notes).matches(/^### Features/);
      expect(releaseData[1].component).to.eql(
        '@google-automations/label-utils'
      );
      expect(releaseData[1].version?.toString()).to.eql('1.1.0');
      expect(releaseData[1].notes).matches(/^### Features/);
      expect(releaseData[2].component).to.eql(
        '@google-automations/object-selector'
      );
      expect(releaseData[2].version?.toString()).to.eql('1.1.0');
      expect(releaseData[2].notes).matches(/^### Features/);
      expect(releaseData[3].component).to.eql(
        '@google-automations/datastore-lock'
      );
      expect(releaseData[3].version?.toString()).to.eql('2.1.0');
      expect(releaseData[3].notes).matches(/^### Features/);
    });
    it('should parse multiple components mixed with componentless', () => {
      const body = readFileSync(
        resolve(fixturesPath, './mixed-componentless-manifest.txt'),
        'utf8'
      );
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(2);
      expect(releaseData[0].component).to.be.undefined;
      expect(releaseData[0].version?.toString()).to.eql('3.2.0');
      expect(releaseData[0].notes).matches(/^### Features/);
      expect(releaseData[1].component).to.eql(
        '@google-automations/label-utils'
      );
      expect(releaseData[1].version?.toString()).to.eql('1.1.0');
      expect(releaseData[1].notes).matches(/^### Features/);
    });
    it('should parse single component from legacy manifest release', () => {
      const body = readFileSync(
        resolve(fixturesPath, './single-manifest.txt'),
        'utf8'
      );
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(1);
      expect(releaseData[0].component).to.eql('@google-cloud/release-brancher');
      expect(releaseData[0].version?.toString()).to.eql('1.3.1');
      expect(releaseData[0].notes).matches(/^### Bug Fixes/);
    });
    it('should parse standalone release', () => {
      const body = readFileSync(resolve(fixturesPath, './single.txt'), 'utf8');
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(1);
      expect(releaseData[0].component).to.be.undefined;
      expect(releaseData[0].version?.toString()).to.eql('3.2.7');
      expect(releaseData[0].notes).matches(/^### \[3\.2\.7\]/);
    });
    it('should parse standalone prerelease', () => {
      const body = readFileSync(
        resolve(fixturesPath, './single-prerelease.txt'),
        'utf8'
      );
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(1);
      expect(releaseData[0].component).to.be.undefined;
      expect(releaseData[0].version?.toString()).to.eql('3.2.7-pre.0');
      expect(releaseData[0].notes).matches(/^### \[3\.2\.7-pre\.0]/);
    });
    it('should parse legacy PHP body', () => {
      const body = readFileSync(
        resolve(fixturesPath, './legacy-php-yoshi.txt'),
        'utf8'
      );
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(109);
      expect(releaseData[0].component).to.eql('google/cloud-access-approval');
      expect(releaseData[0].version?.toString()).to.eql('0.3.0');
      expect(releaseData[0].notes).matches(/Database operations/);
    });

    it('can parse initial release pull rqeuest body', () => {
      const body = readFileSync(
        resolve(fixturesPath, './initial-version.txt'),
        'utf8'
      );
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(1);
      expect(releaseData[0].component).to.be.undefined;
      expect(releaseData[0].version?.toString()).to.eql('0.1.0');
      expect(releaseData[0].notes).matches(/initial generation/);
    });

    it('should preserve escaped html through a parse/toString round trip', () => {
      const notes = '### Features\n\n* claim :v&lt;version&gt; only on main';
      const body = new PullRequestBody([
        {component: 'pkg-a', version: Version.parse('1.0.1'), notes},
        {component: 'pkg-b', version: Version.parse('2.0.1'), notes},
        {
          component: 'pkg-c',
          version: Version.parse('3.0.1'),
          notes: '### Features\n\n* unrelated',
        },
      ]).toString();
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(3);
      expect(releaseData[0].component).to.eql('pkg-a');
      expect(releaseData[0].notes).to.eql(notes);
      expect(releaseData[1].component).to.eql('pkg-b');
      expect(releaseData[1].notes).to.eql(notes);
      expect(releaseData[2].component).to.eql('pkg-c');
      expect(pullRequestBody!.toString()).to.eql(body);
      const reparsed = PullRequestBody.parse(pullRequestBody!.toString());
      expect(reparsed).to.not.be.undefined;
      expect(reparsed!.releaseData).to.eql(releaseData);
    });

    it('should not let a raw html tag inside notes hide later components', () => {
      const notes = '### Features\n\n* add `--report <path>` flag';
      const body = new PullRequestBody([
        {component: 'pkg-a', version: Version.parse('1.0.0'), notes},
        {component: 'pkg-b', version: Version.parse('2.0.0'), notes},
      ]).toString();
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(2);
      expect(releaseData[0].component).to.eql('pkg-a');
      expect(releaseData[0].notes).to.eql(notes);
      expect(releaseData[1].component).to.eql('pkg-b');
      expect(releaseData[1].notes).to.eql(notes);
    });

    it('should not treat a raw <details> token inside notes as a section', () => {
      const notes =
        '## [0.9.1](https://github.com/example/repo/compare/v0.9.0...v0.9.1) (2026-08-22)\n\n\n### Bug Fixes\n\n* escape an unbalanced `<details>` tag';
      const body = new PullRequestBody([
        {version: Version.parse('0.9.1'), notes},
      ]).toString();
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(1);
      expect(releaseData[0].component).to.be.undefined;
      expect(releaseData[0].version?.toString()).to.eql('0.9.1');
      expect(releaseData[0].notes).to.eql(notes);
    });

    it('should not end a section at a stray </details> inside notes', () => {
      const notes =
        '### Bug Fixes\n\n* mention `</details>` handling\n* another fix';
      const body = new PullRequestBody([
        {component: 'pkg-a', version: Version.parse('1.0.0'), notes},
        {
          component: 'pkg-b',
          version: Version.parse('2.0.0'),
          notes: '### Bug Fixes\n\n* unrelated',
        },
      ]).toString();
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(2);
      expect(releaseData[0].component).to.eql('pkg-a');
      expect(releaseData[0].notes).to.eql(notes);
      expect(releaseData[1].component).to.eql('pkg-b');
      expect(releaseData[1].notes).to.eql('### Bug Fixes\n\n* unrelated');
    });

    it('should keep a nested collapsible block inside the notes', () => {
      const notes =
        '### Features\n\n* a feature\n\n<details><summary>Full diff</summary>\n\nsome diff\n</details>';
      const body = new PullRequestBody([
        {component: 'pkg-a', version: Version.parse('1.0.0'), notes},
        {
          component: 'pkg-b',
          version: Version.parse('2.0.0'),
          notes: '### Features\n\n* unrelated',
        },
      ]).toString();
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(2);
      expect(releaseData[0].component).to.eql('pkg-a');
      expect(releaseData[0].notes).to.eql(notes);
      expect(releaseData[1].component).to.eql('pkg-b');
      expect(releaseData[1].notes).to.eql('### Features\n\n* unrelated');
    });

    it('should tolerate a section without a closing marker', () => {
      const body = new PullRequestBody([
        {
          component: 'pkg-a',
          version: Version.parse('1.0.0'),
          notes: '### Features\n\n* a feature',
        },
        {
          component: 'pkg-b',
          version: Version.parse('2.0.0'),
          notes: '### Features\n\n* unrelated',
        },
      ])
        .toString()
        .replace('* unrelated\n</details>', '* unrelated');
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      const releaseData = pullRequestBody!.releaseData;
      expect(releaseData).lengthOf(2);
      expect(releaseData[0].component).to.eql('pkg-a');
      expect(releaseData[0].notes).to.eql('### Features\n\n* a feature');
      expect(releaseData[1].component).to.eql('pkg-b');
      expect(releaseData[1].notes).to.eql('### Features\n\n* unrelated');
    });
  });
  describe('toString', () => {
    it('can handle multiple entries', () => {
      const data = [
        {
          component: 'pkg1',
          version: Version.parse('1.2.3'),
          notes: 'some special notes go here',
        },
        {
          component: 'pkg2',
          version: Version.parse('2.0.0'),
          notes: 'more special notes go here',
        },
      ];
      const pullRequestBody = new PullRequestBody(data);
      snapshot(pullRequestBody.toString());
    });

    it('can handle a single entries', () => {
      const data = [
        {
          component: 'pkg1',
          version: Version.parse('1.2.3'),
          notes: 'some special notes go here',
        },
      ];
      const pullRequestBody = new PullRequestBody(data);
      snapshot(pullRequestBody.toString());
    });

    it('can handle a single entries forced components', () => {
      const data = [
        {
          component: 'pkg1',
          version: Version.parse('1.2.3'),
          notes: 'some special notes go here',
        },
      ];
      const pullRequestBody = new PullRequestBody(data, {useComponents: true});
      snapshot(pullRequestBody.toString());
    });

    it('can handle a custom header and footer', () => {
      const data = [
        {
          component: 'pkg1',
          version: Version.parse('1.2.3'),
          notes: 'some special notes go here',
        },
        {
          component: 'pkg2',
          version: Version.parse('2.0.0'),
          notes: 'more special notes go here',
        },
      ];
      const pullRequestBody = new PullRequestBody(data, {
        header: 'My special header!!!',
        footer: 'A custom footer',
      });
      snapshot(pullRequestBody.toString());
    });

    it('can parse the generated output', () => {
      const data = [
        {
          component: 'pkg1',
          version: Version.parse('1.2.3'),
          notes: 'some special notes go here',
        },
        {
          component: 'pkg2',
          version: Version.parse('2.0.0'),
          notes: 'more special notes go here',
        },
      ];
      const pullRequestBody = new PullRequestBody(data, {
        header: 'My special header!!!',
        footer: 'A custom footer',
      });
      const pullRequestBody2 = PullRequestBody.parse(
        pullRequestBody.toString()
      );
      expect(pullRequestBody2?.releaseData).to.eql(data);
      expect(pullRequestBody2?.header).to.eql('My special header!!!');
      expect(pullRequestBody2?.footer).to.eql('A custom footer');
    });

    it('can handle componently entries', () => {
      const data = [
        {
          version: Version.parse('1.2.3'),
          notes: 'some special notes go here',
        },
        {
          component: 'pkg2',
          version: Version.parse('2.0.0'),
          notes: 'more special notes go here',
        },
      ];
      const pullRequestBody = new PullRequestBody(data);
      snapshot(pullRequestBody.toString());
    });
  });
});
