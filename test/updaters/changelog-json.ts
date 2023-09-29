// Copyright 2023 Google LLC
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

import snapshot = require('snap-shot-it');
import {describe, it} from 'mocha';
import {ChangelogJson} from '../../src/updaters/changelog-json';
import {Version} from '../../src/version';
import {parseConventionalCommits} from '../../src/commit';
import {buildMockCommit} from '../helpers';

const UUID_REGEX =
  /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
const ISO_DATE_REGEX =
  /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g; // 2023-01-05T16:42:33.446Z

describe('changelog.json', () => {
  it('prepends new release to empty changelog', async () => {
    const oldContent = '{"repository": "foo/bar", "entries": []}';
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
      language: 'JAVA',
    });
    const newContent = changelogJson.updateContent(oldContent);
    snapshot(
      newContent
        .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
        .replace(UUID_REGEX, 'abc-123-efd-qwerty')
        .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z')
    );
  });
  it('prepends latest release to existing changelog', async () => {
    const oldContent = '{"repository": "foo/bar", "entries": [{}, {}]}';
    const commits = [
      buildMockCommit('feat: some feature'),
      buildMockCommit('fix: some bugfix'),
      buildMockCommit('docs: some documentation'),
    ];
    const conventionalCommits = parseConventionalCommits(commits);
    const changelogJson = new ChangelogJson({
      version: Version.parse('14.0.0'),
      artifactName: 'foo-artifact',
      language: 'JAVA',
      commits: conventionalCommits,
    });
    const newContent = changelogJson.updateContent(oldContent);
    snapshot(
      newContent
        .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
        .replace(UUID_REGEX, 'abc-123-efd-qwerty')
        .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z')
    );
  });
  // In discussion with downstream implementers, we decideed that it would
  // make it easier to customize the CHANGELOG generated if we pre-parsed
  // the PR # suffix that GitHub adds to squashed commits.
  it('adds PR # suffix to issues array', async () => {
    const oldContent = '{"repository": "foo/bar", "entries": [{}, {}]}';
    const commits = [
      buildMockCommit('feat: some feature'),
      buildMockCommit('fix: Support TOML up to v1.0.0-rc.1 spec. (#1837)'),
      buildMockCommit('docs: some documentation'),
    ];
    const conventionalCommits = parseConventionalCommits(commits);
    const changelogJson = new ChangelogJson({
      version: Version.parse('14.0.0'),
      artifactName: 'foo-artifact',
      language: 'JAVA',
      commits: conventionalCommits,
    });
    const newContent = changelogJson.updateContent(oldContent);
    snapshot(
      newContent
        .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
        .replace(UUID_REGEX, 'abc-123-efd-qwerty')
        .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z')
    );
  });
});
