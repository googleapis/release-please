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
exports.GoYoshi = void 0;
const base_1 = require("./base");
const changelog_1 = require("../updaters/changelog");
const version_1 = require("../version");
const version_go_1 = require("../updaters/go/version-go");
const path_1 = require("path");
const CHANGELOG_SECTIONS = [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance Improvements' },
    { type: 'revert', section: 'Reverts' },
    { type: 'docs', section: 'Documentation' },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'Continuous Integration', hidden: true },
];
const REGEN_PR_REGEX = /.*auto-regenerate.*/;
const REGEN_ISSUE_REGEX = /(?<prefix>.*)\(#(?<pr>.*)\)(\n|$)/;
class GoYoshi extends base_1.BaseStrategy {
    constructor(options) {
        var _a;
        options.changelogPath = (_a = options.changelogPath) !== null && _a !== void 0 ? _a : 'CHANGES.md';
        super({
            ...options,
            changelogSections: CHANGELOG_SECTIONS,
        });
    }
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        updates.push({
            path: this.addPath('internal/version.go'),
            createIfMissing: false,
            updater: new version_go_1.VersionGo({
                version,
            }),
        });
        return updates;
    }
    async postProcessCommits(commits) {
        let regenCommit;
        const component = await this.getComponent();
        this.logger.debug('Filtering commits');
        const ignoredSubmodules = await this.getIgnoredSubModules();
        return commits.filter(commit => {
            var _a, _b;
            // Only have a single entry of the nightly regen listed in the changelog.
            // If there are more than one of these commits, append associated PR.
            if (this.repository.owner === 'googleapis' &&
                this.repository.repo === 'google-api-go-client' &&
                REGEN_PR_REGEX.test(commit.message)) {
                if (regenCommit) {
                    const match = commit.message.match(REGEN_ISSUE_REGEX);
                    if ((_a = match === null || match === void 0 ? void 0 : match.groups) === null || _a === void 0 ? void 0 : _a.pr) {
                        regenCommit.references.push({
                            action: 'refs',
                            issue: match.groups.pr,
                            prefix: '#',
                        });
                    }
                    return false;
                }
                else {
                    commit.sha = '';
                    regenCommit = commit;
                    const match = commit.bareMessage.match(REGEN_ISSUE_REGEX);
                    if ((_b = match === null || match === void 0 ? void 0 : match.groups) === null || _b === void 0 ? void 0 : _b.pr) {
                        regenCommit.references.push({
                            action: 'refs',
                            issue: match.groups.pr,
                            prefix: '#',
                        });
                        regenCommit.bareMessage = match.groups.prefix.trim();
                    }
                }
            }
            // For google-cloud-go, filter into 2 cases, a subset of modules
            // released independently, and the remainder
            if (this.repository.owner === 'googleapis' &&
                this.repository.repo === 'google-cloud-go') {
                // Skip commits that don't have a scope as we don't know where to
                // put them
                if (!commit.scope) {
                    this.logger.debug(`Skipping commit without scope: ${commit.message}`);
                    return false;
                }
                // Skip commits related to sub-modules as they are not part of
                // the parent module.
                if (this.includeComponentInTag) {
                    // This is a submodule release, so only include commits in this
                    // scope
                    if (!commitMatchesScope(commit.scope, component)) {
                        this.logger.debug(`Skipping commit scope: ${commit.scope} != ${component}`);
                        return false;
                    }
                }
                else {
                    // This is the main module release, so ignore sub modules that
                    // are released independently
                    for (const submodule of ignoredSubmodules) {
                        if (commitMatchesScope(commit.scope, submodule)) {
                            this.logger.debug(`Skipping ignored commit scope: ${commit.scope}`);
                            return false;
                        }
                    }
                }
            }
            return true;
        });
    }
    async getIgnoredSubModules() {
        // ignored submodules only applies to the root component of
        // googleapis/google-cloud-go
        if (this.repository.owner !== 'googleapis' ||
            this.repository.repo !== 'google-cloud-go' ||
            this.includeComponentInTag) {
            return new Set();
        }
        this.logger.info('Looking for go.mod files');
        const paths = (await this.github.findFilesByFilenameAndRef('go.mod', this.targetBranch))
            .filter(path => !path.includes('internal') && path !== 'go.mod')
            .map(path => (0, path_1.dirname)(path));
        this.logger.info(`Found ${paths.length} submodules`);
        this.logger.debug(JSON.stringify(paths));
        return new Set(paths);
    }
    // "closes" is a little presumptuous, let's just indicate that the
    // PR references these other commits:
    async buildReleaseNotes(conventionalCommits, newVersion, newVersionTag, latestRelease, commits) {
        const releaseNotes = await super.buildReleaseNotes(conventionalCommits, newVersion, newVersionTag, latestRelease, commits);
        return releaseNotes.replace(/, closes /g, ', refs ');
    }
    initialReleaseVersion() {
        return version_1.Version.parse('0.1.0');
    }
}
exports.GoYoshi = GoYoshi;
function commitMatchesScope(commitScope, scope) {
    return commitScope === scope || commitScope.startsWith(`${scope}/`);
}
//# sourceMappingURL=go-yoshi.js.map