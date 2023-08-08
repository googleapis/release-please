"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const snapshot = require("snap-shot-it");
const mocha_1 = require("mocha");
const changelog_json_1 = require("../../src/updaters/changelog-json");
const version_1 = require("../../src/version");
const commit_1 = require("../../src/commit");
const helpers_1 = require("../helpers");
const UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
const ISO_DATE_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z/g; // 2023-01-05T16:42:33.446Z
(0, mocha_1.describe)('changelog.json', () => {
    (0, mocha_1.it)('prepends new release to empty changelog', async () => {
        const oldContent = '{"repository": "foo/bar", "entries": []}';
        const commits = [
            (0, helpers_1.buildMockCommit)('feat: some feature'),
            (0, helpers_1.buildMockCommit)('fix!: some bugfix'),
            (0, helpers_1.buildMockCommit)('docs(perf)!: some documentation'),
        ];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        const changelogJson = new changelog_json_1.ChangelogJson({
            version: version_1.Version.parse('14.0.0'),
            artifactName: 'foo-artifact',
            commits: conventionalCommits,
            language: 'JAVA',
        });
        const newContent = changelogJson.updateContent(oldContent);
        snapshot(newContent
            .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
            .replace(UUID_REGEX, 'abc-123-efd-qwerty')
            .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'));
    });
    (0, mocha_1.it)('prepends latest release to existing changelog', async () => {
        const oldContent = '{"repository": "foo/bar", "entries": [{}, {}]}';
        const commits = [
            (0, helpers_1.buildMockCommit)('feat: some feature'),
            (0, helpers_1.buildMockCommit)('fix: some bugfix'),
            (0, helpers_1.buildMockCommit)('docs: some documentation'),
        ];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        const changelogJson = new changelog_json_1.ChangelogJson({
            version: version_1.Version.parse('14.0.0'),
            artifactName: 'foo-artifact',
            language: 'JAVA',
            commits: conventionalCommits,
        });
        const newContent = changelogJson.updateContent(oldContent);
        snapshot(newContent
            .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
            .replace(UUID_REGEX, 'abc-123-efd-qwerty')
            .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'));
    });
    // In discussion with downstream implementers, we decideed that it would
    // make it easier to customize the CHANGELOG generated if we pre-parsed
    // the PR # suffix that GitHub adds to squashed commits.
    (0, mocha_1.it)('adds PR # suffix to issues array', async () => {
        const oldContent = '{"repository": "foo/bar", "entries": [{}, {}]}';
        const commits = [
            (0, helpers_1.buildMockCommit)('feat: some feature'),
            (0, helpers_1.buildMockCommit)('fix: Support TOML up to v1.0.0-rc.1 spec. (#1837)'),
            (0, helpers_1.buildMockCommit)('docs: some documentation'),
        ];
        const conventionalCommits = (0, commit_1.parseConventionalCommits)(commits);
        const changelogJson = new changelog_json_1.ChangelogJson({
            version: version_1.Version.parse('14.0.0'),
            artifactName: 'foo-artifact',
            language: 'JAVA',
            commits: conventionalCommits,
        });
        const newContent = changelogJson.updateContent(oldContent);
        snapshot(newContent
            .replace(/\r\n/g, '\n') // make newline consistent regardless of OS.
            .replace(UUID_REGEX, 'abc-123-efd-qwerty')
            .replace(ISO_DATE_REGEX, '2023-01-05T16:42:33.446Z'));
    });
});
//# sourceMappingURL=changelog-json.js.map