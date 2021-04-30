// Copyright 2019 Google LLC
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

import {ConventionalCommits} from '../src/conventional-commits';
import {describe, it} from 'mocha';
import {expect} from 'chai';

import * as snapshot from 'snap-shot-it';

describe('ConventionalCommits', () => {
  describe('suggestBump', () => {
    it('suggests minor release for breaking change pre 1.0', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message: 'fix: addressed issues with foo',
            sha: 'abc123',
            files: [],
          },
          {
            message:
              'chore: upgrade to Node 7\n\nBREAKING CHANGE: we were on Node 6',
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const bump = await cc.suggestBump('0.3.0');
      expect(bump.releaseType).to.equal('minor');
      expect(bump.reason).to.equal('There is 1 BREAKING CHANGE and 1 features');
    });

    it('follows standard patch for minor bump behavior pre 1.0', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message: 'fix: addressed issues with foo',
            sha: 'abc123',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
      });
      const bump = await cc.suggestBump('0.3.0');
      expect(bump.releaseType).to.equal('patch');
      expect(bump.reason).to.equal(
        'There are 0 BREAKING CHANGES and 1 features'
      );
    });
  });

  describe('generateChangelogEntry', () => {
    it('includes multi-line breaking changes', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message:
              'chore: upgrade to Node 7\n\nBREAKING CHANGE: we were on Node 6\nsecond line\nthird line',
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1665-10-10'));
    });

    it('supports additional markdown for breaking change, if prefixed with fourth-level header', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message:
              'chore: upgrade to Node 7\n\nBREAKING CHANGE: we were on Node 6\n#### deleted APIs\n- deleted API',
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1665-10-10'));
    });

    it('supports additional markdown for breaking change, if prefixed with list', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message:
              'chore: upgrade to Node 7\n\nBREAKING CHANGE: we were on Node 6\n- deleted API foo\n- deleted API bar',
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1665-10-10'));
    });

    // See: https://github.com/googleapis/nodejs-logging/commit/ce29b498ebb357403c093053d1b9989f1a56f5af
    it('does not include content two newlines after BREAKING CHANGE', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message:
              'chore: upgrade to Node 7\n\nBREAKING CHANGE: we were on Node 6\n\nI should be removed',
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1665-10-10'));
    });

    it('parses additional commits in footers', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message:
              'chore: multiple commits\n\nfeat!: cool feature\nfix(subsystem): also a fix',
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1665-10-10'));
    });

    it('parses footer commits that contain footers', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message: `meta: multiple commits.

feat(recaptchaenterprise): migrate microgenertor
  Committer: @miraleung
  PiperOrigin-RevId: 345559154
  BREAKING-CHANGE: for some reason this migration is breaking.
  Source-Link: googleapis/googleapis@5e0dcb2

fix(securitycenter): fixes security center.
  Committer: @miraleung
  PiperOrigin-RevId: 345559182
  Source-Link: googleapis/googleapis@e5eef86`,
            sha: 'abc345',
            files: [],
          },
          {message: 'feat: awesome feature', sha: 'abc678', files: []},
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1665-10-10'));
    });

    it('parses commits from footer, when body contains multiple paragraphs', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message: `meta: multiple commits.

Details.

Some clarifying facts.

fix: fixes bug #733
feat(recaptchaenterprise): migrate microgenertor
  Committer: @miraleung
  PiperOrigin-RevId: 345559154
  BREAKING-CHANGE: for some reason this migration is breaking.
  Source-Link: goo gleapis/googleapis@5e0dcb2

fix(securitycenter): fixes security center.
  Committer: @miraleung
  PiperOrigin-RevId: 345559182
  Source-Link: googleapis/googleapis@e5eef86`,
            sha: 'abc345',
            files: [],
          },
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1665-10-10'));
    });

    it('includes any commits with a "Release-As" footer', async () => {
      const cc = new ConventionalCommits({
        commits: [
          {
            message: `meta: correct release

Release-As: v3.0.0`,
            sha: 'abc345',
            files: [],
          },
        ],
        owner: 'bcoe',
        repository: 'release-please',
        bumpMinorPreMajor: true,
      });
      const cl = await cc.generateChangelogEntry({
        version: 'v1.0.0',
      });
      snapshot(cl.replace(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, '1665-10-10'));
    });
  });
});
