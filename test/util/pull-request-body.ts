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
  describe('customReleaseNotes', () => {
    it('should parse custom release notes from body', () => {
      const body = [
        ':robot: I have created a release *beep* *boop*',
        '---',
        '<!-- BEGIN CUSTOM RELEASE NOTES -->',
        'Please read the [migration guide](https://example.com).',
        '<!-- END CUSTOM RELEASE NOTES -->',
        '## [1.2.3](https://github.com/fake/repo/compare/v1.2.2...v1.2.3) (2024-01-01)',
        '',
        '### Features',
        '',
        '* some feature',
        '---',
        'This PR was generated with Release Please.',
      ].join('\n');
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      expect(pullRequestBody!.customReleaseNotes).to.eql(
        'Please read the [migration guide](https://example.com).'
      );
      expect(pullRequestBody!.releaseData).lengthOf(1);
      expect(pullRequestBody!.releaseData[0].version?.toString()).to.eql(
        '1.2.3'
      );
      expect(pullRequestBody!.releaseData[0].notes).to.not.include(
        'BEGIN CUSTOM RELEASE NOTES'
      );
    });

    it('should parse custom release notes placed after version heading', () => {
      const body = [
        ':robot: I have created a release *beep* *boop*',
        '---',
        '## [2.0.0](https://github.com/fake/repo/compare/v1.0.0...v2.0.0) (2024-01-01)',
        '',
        '<!-- BEGIN CUSTOM RELEASE NOTES -->',
        'Breaking: new API',
        '<!-- END CUSTOM RELEASE NOTES -->',
        '',
        '### Features',
        '',
        '* big change',
        '---',
        'This PR was generated with Release Please.',
      ].join('\n');
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      expect(pullRequestBody!.customReleaseNotes).to.eql('Breaking: new API');
      expect(pullRequestBody!.releaseData[0].notes).to.not.include(
        'BEGIN CUSTOM RELEASE NOTES'
      );
    });

    it('should return undefined when no custom release notes', () => {
      const body = [
        ':robot: I have created a release *beep* *boop*',
        '---',
        '## [1.0.0](https://github.com/fake/repo/compare/v0.9.0...v1.0.0) (2024-01-01)',
        '',
        '### Features',
        '',
        '* init',
        '---',
        'This PR was generated with Release Please.',
      ].join('\n');
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      expect(pullRequestBody!.customReleaseNotes).to.be.undefined;
    });

    it('should round-trip custom release notes through toString and parse', () => {
      const data = [
        {
          component: 'pkg1',
          version: Version.parse('1.2.3'),
          notes: '### Features\n\n* some feature',
        },
        {
          component: 'pkg2',
          version: Version.parse('2.0.0'),
          notes: '### Bug Fixes\n\n* some fix',
        },
      ];
      const body1 = new PullRequestBody(data, {
        customReleaseNotes: 'Check the upgrade guide!',
      });
      const output = body1.toString();
      expect(output).to.include('BEGIN CUSTOM RELEASE NOTES');
      expect(output).to.include('Check the upgrade guide!');

      const body2 = PullRequestBody.parse(output);
      expect(body2).to.not.be.undefined;
      expect(body2!.customReleaseNotes).to.eql('Check the upgrade guide!');
      expect(body2!.releaseData).lengthOf(2);
      expect(body2!.releaseData[0].version?.toString()).to.eql('1.2.3');
      expect(body2!.releaseData[0].notes).to.not.include(
        'BEGIN CUSTOM RELEASE NOTES'
      );
    });

    it('should concatenate multiple custom release notes blocks', () => {
      const body = [
        ':robot: I have created a release *beep* *boop*',
        '---',
        '<!-- BEGIN CUSTOM RELEASE NOTES -->',
        'First block',
        '<!-- END CUSTOM RELEASE NOTES -->',
        '## [1.0.0](https://github.com/fake/repo/compare/v0.9.0...v1.0.0) (2024-01-01)',
        '',
        '<!-- BEGIN CUSTOM RELEASE NOTES -->',
        'Second block',
        '<!-- END CUSTOM RELEASE NOTES -->',
        '',
        '### Features',
        '',
        '* init',
        '---',
        'This PR was generated with Release Please.',
      ].join('\n');
      const pullRequestBody = PullRequestBody.parse(body);
      expect(pullRequestBody).to.not.be.undefined;
      expect(pullRequestBody!.customReleaseNotes).to.eql(
        'First block\n\nSecond block'
      );
      expect(pullRequestBody!.releaseData[0].notes).to.not.include(
        'BEGIN CUSTOM RELEASE NOTES'
      );
    });

    it('should carry forward custom notes when rebuilding', () => {
      // Simulate: existing PR has custom notes, new PR is built without them
      const existingBody = [
        ':robot: I have created a release *beep* *boop*',
        '---',
        '<!-- BEGIN CUSTOM RELEASE NOTES -->',
        'My custom notes',
        '<!-- END CUSTOM RELEASE NOTES -->',
        '## [1.0.0](https://github.com/fake/repo/compare/v0.9.0...v1.0.0) (2024-01-01)',
        '',
        '### Features',
        '',
        '* init',
        '---',
        'This PR was generated with Release Please.',
      ].join('\n');
      const parsed = PullRequestBody.parse(existingBody);
      expect(parsed!.customReleaseNotes).to.eql('My custom notes');

      // Build a new PR body (as release-please would on update)
      const newData = [
        {
          version: Version.parse('1.0.0'),
          notes:
            '## [1.0.0](https://github.com/fake/repo/compare/v0.9.0...v1.0.0) (2024-01-01)\n\n### Features\n\n* init\n* another feature',
        },
      ];
      const newBody = new PullRequestBody(newData);
      // Carry forward
      newBody.customReleaseNotes = parsed!.customReleaseNotes;

      const output = newBody.toString();
      expect(output).to.include('My custom notes');

      // Verify it parses cleanly
      const reparsed = PullRequestBody.parse(output);
      expect(reparsed!.customReleaseNotes).to.eql('My custom notes');
      expect(reparsed!.releaseData[0].notes).to.not.include('My custom notes');
    });
  });
});
