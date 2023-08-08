"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHPYoshi = void 0;
const base_1 = require("./base");
const changelog_1 = require("../updaters/changelog");
const root_composer_update_packages_1 = require("../updaters/php/root-composer-update-packages");
const php_client_version_1 = require("../updaters/php/php-client-version");
const version_1 = require("../version");
const commit_1 = require("../commit");
const commit_split_1 = require("../util/commit-split");
const default_1 = require("../updaters/default");
const tag_name_1 = require("../util/tag-name");
const pull_request_title_1 = require("../util/pull-request-title");
const branch_name_1 = require("../util/branch-name");
const pull_request_body_1 = require("../util/pull-request-body");
const errors_1 = require("../errors");
const CHANGELOG_SECTIONS = [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance Improvements' },
    { type: 'revert', section: 'Reverts' },
    { type: 'docs', section: 'Documentation' },
    { type: 'misc', section: 'Miscellaneous' },
    { type: 'chore', section: 'Chores', hidden: true },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'Continuous Integration', hidden: true },
];
class PHPYoshi extends base_1.BaseStrategy {
    constructor(options) {
        super({
            ...options,
            changelogSections: CHANGELOG_SECTIONS,
        });
    }
    async buildReleasePullRequest(commits, latestRelease, draft, labels = []) {
        var _a, _b, _c;
        const conventionalCommits = await this.postProcessCommits((0, commit_1.parseConventionalCommits)(commits, this.logger));
        if (conventionalCommits.length === 0) {
            this.logger.info(`No commits for path: ${this.path}, skipping`);
            return undefined;
        }
        const newVersion = latestRelease
            ? await this.versioningStrategy.bump(latestRelease.tag.version, conventionalCommits)
            : this.initialReleaseVersion();
        const cs = new commit_split_1.CommitSplit();
        const splitCommits = cs.split(conventionalCommits);
        const topLevelDirectories = Object.keys(splitCommits).sort();
        const versionsMap = new Map();
        const directoryVersionContents = {};
        const component = await this.getComponent();
        const newVersionTag = new tag_name_1.TagName(newVersion, component);
        let releaseNotesBody = `## ${newVersion.toString()}`;
        for (const directory of topLevelDirectories) {
            try {
                const contents = await this.github.getFileContentsOnBranch(this.addPath(`${directory}/VERSION`), this.targetBranch);
                const version = version_1.Version.parse(contents.parsedContent);
                const composer = await this.github.getFileJson(this.addPath(`${directory}/composer.json`), this.targetBranch);
                directoryVersionContents[directory] = {
                    versionContents: contents,
                    composer,
                };
                const newVersion = await this.versioningStrategy.bump(version, splitCommits[directory]);
                versionsMap.set(composer.name, newVersion);
                const partialReleaseNotes = await this.changelogNotes.buildNotes(splitCommits[directory], {
                    host: this.changelogHost,
                    owner: this.repository.owner,
                    repository: this.repository.repo,
                    version: newVersion.toString(),
                    previousTag: (_a = latestRelease === null || latestRelease === void 0 ? void 0 : latestRelease.tag) === null || _a === void 0 ? void 0 : _a.toString(),
                    currentTag: newVersionTag.toString(),
                    targetBranch: this.targetBranch,
                    changelogSections: this.changelogSections,
                });
                releaseNotesBody = updatePHPChangelogEntry(`${composer.name} ${newVersion.toString()}`, releaseNotesBody, partialReleaseNotes);
            }
            catch (err) {
                if (err instanceof errors_1.FileNotFoundError) {
                    // if the updated path has no VERSION, assume this isn't a
                    // module that needs updating.
                    continue;
                }
                else {
                    throw err;
                }
            }
        }
        const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofComponentTargetBranchVersion(component || '', this.targetBranch, newVersion);
        const branchName = component
            ? branch_name_1.BranchName.ofComponentTargetBranch(component, this.targetBranch)
            : branch_name_1.BranchName.ofTargetBranch(this.targetBranch);
        const updates = await this.buildUpdates({
            changelogEntry: releaseNotesBody,
            newVersion,
            versionsMap,
            latestVersion: latestRelease === null || latestRelease === void 0 ? void 0 : latestRelease.tag.version,
            commits: conventionalCommits, // TODO(@bcoe): these commits will need to be divided into multiple changelog.json updates.
        });
        for (const directory in directoryVersionContents) {
            const componentInfo = directoryVersionContents[directory];
            const version = versionsMap.get(componentInfo.composer.name);
            if (!version) {
                this.logger.warn(`No version found for ${componentInfo.composer.name}`);
                continue;
            }
            updates.push({
                path: this.addPath(`${directory}/VERSION`),
                createIfMissing: false,
                cachedFileContents: componentInfo.versionContents,
                updater: new default_1.DefaultUpdater({
                    version,
                }),
            });
            if ((_c = (_b = componentInfo.composer.extra) === null || _b === void 0 ? void 0 : _b.component) === null || _c === void 0 ? void 0 : _c.entry) {
                updates.push({
                    path: this.addPath(`${directory}/${componentInfo.composer.extra.component.entry}`),
                    createIfMissing: false,
                    updater: new php_client_version_1.PHPClientVersion({
                        version,
                    }),
                });
            }
        }
        // TODO use pullrequest header here?
        const pullRequestBody = new pull_request_body_1.PullRequestBody([
            {
                component,
                version: newVersion,
                notes: releaseNotesBody,
            },
        ]);
        return {
            title: pullRequestTitle,
            body: pullRequestBody,
            updates,
            labels: [...labels, ...this.extraLabels],
            headRefName: branchName.toString(),
            version: newVersion,
            draft: draft !== null && draft !== void 0 ? draft : false,
        };
    }
    async parsePullRequestBody(pullRequestBody) {
        const body = pull_request_body_1.PullRequestBody.parse(pullRequestBody, this.logger);
        if (!body) {
            return undefined;
        }
        const component = await this.getComponent();
        const notes = body.releaseData
            .map(release => {
            var _a;
            return `<details><summary>${release.component}: ${(_a = release.version) === null || _a === void 0 ? void 0 : _a.toString()}</summary>\n\n${release.notes}\n</details>`;
        })
            .join('\n\n');
        return new pull_request_body_1.PullRequestBody([{ component, notes }], {
            footer: body.footer,
            header: body.header,
        });
    }
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        const versionsMap = options.versionsMap;
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        // update the aggregate package information in the root composer.json
        updates.push({
            path: this.addPath('composer.json'),
            createIfMissing: false,
            updater: new root_composer_update_packages_1.RootComposerUpdatePackages({
                version,
                versionsMap,
            }),
        });
        return updates;
    }
}
exports.PHPYoshi = PHPYoshi;
function updatePHPChangelogEntry(pkgKey, changelogEntry, entryUpdate) {
    // Remove the first line of the entry, in favor of <summary>.
    // This also allows us to use the same regex for extracting release
    // notes (since the string "## v0.0.0" doesn't show up multiple times).
    const entryUpdateSplit = entryUpdate.split(/\r?\n/);
    entryUpdateSplit.shift();
    entryUpdate = entryUpdateSplit.join('\n');
    return `${changelogEntry}

<details><summary>${pkgKey}</summary>

${entryUpdate}

</details>`;
}
//# sourceMappingURL=php-yoshi.js.map