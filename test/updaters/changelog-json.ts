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

import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {ChangelogJson} from '../../src/updaters/changelog-json';
import {Version} from '../../src/version';
import {parseConventionalCommits} from '../../src/commit';
import {buildMockCommit} from '../helpers';

describe('changelog.json', () => {
  it('appends new release to empty changelog', async () => {
    const oldContent = '[]';
    const commits = [
      buildMockCommit('feat: some feature'),
      buildMockCommit('fix!: some bugfix'),
      buildMockCommit('docs(perf)!: some documentation'),
    ];
    const conventionalCommits = parseConventionalCommits(commits);
    const changelogJson = new ChangelogJson({
      version: Version.parse('14.0.0'),
      artifactName: 'foo-artifact',
      commits: conventionalCommits,
    });
    const newContent = changelogJson.updateContent(oldContent);
    snapshot(
      newContent
        .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
        .replace(
          /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g,
          'abc-123-efd-qwerty'
        ) // rewrite UUIDs.
    );
  });
  it('adds latest release to front of list', async () => {
    const oldContent = '[{}, {}]';
    const commits = [
      buildMockCommit('feat: some feature'),
      buildMockCommit('fix: some bugfix'),
      buildMockCommit('docs: some documentation'),
    ];
    const conventionalCommits = parseConventionalCommits(commits);
    const changelogJson = new ChangelogJson({
      version: Version.parse('14.0.0'),
      artifactName: 'foo-artifact',
      commits: conventionalCommits,
    });
    const newContent = changelogJson.updateContent(oldContent);
    snapshot(
      newContent
        .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
        .replace(
          /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g,
          'abc-123-efd-qwerty'
        ) // rewrite UUIDs.
    );
  });
});
