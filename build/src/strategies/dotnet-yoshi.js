"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DotnetYoshi = void 0;
const base_1 = require("./base");
const changelog_1 = require("../updaters/changelog");
const apis_1 = require("../updaters/dotnet/apis");
const errors_1 = require("../errors");
const CHANGELOG_SECTIONS = [
    { type: 'feat', section: 'New features' },
    { type: 'fix', section: 'Bug fixes' },
    { type: 'perf', section: 'Performance improvements' },
    { type: 'revert', section: 'Reverts' },
    { type: 'chore', section: 'Miscellaneous chores', hidden: true },
    { type: 'docs', section: 'Documentation improvements' },
    { type: 'style', section: 'Styles', hidden: true },
    { type: 'refactor', section: 'Code Refactoring', hidden: true },
    { type: 'test', section: 'Tests', hidden: true },
    { type: 'build', section: 'Build System', hidden: true },
    { type: 'ci', section: 'Continuous Integration', hidden: true },
];
const DEFAULT_CHANGELOG_PATH = 'docs/history.md';
const DEFAULT_PULL_REQUEST_TITLE_PATTERN = 'Release${component} version ${version}';
const DEFAULT_PULL_REQUEST_HEADER = ':robot: I have created a release *beep* *boop*';
const RELEASE_NOTES_HEADER_PATTERN = /#{2,3} \[?(\d+\.\d+\.\d+-?[^\]]*)\]?.* \((\d{4}-\d{2}-\d{2})\)/;
class DotnetYoshi extends base_1.BaseStrategy {
    constructor(options) {
        var _a, _b, _c, _d, _e;
        options.changelogSections = (_a = options.changelogSections) !== null && _a !== void 0 ? _a : CHANGELOG_SECTIONS;
        options.changelogPath = (_b = options.changelogPath) !== null && _b !== void 0 ? _b : DEFAULT_CHANGELOG_PATH;
        options.pullRequestTitlePattern =
            (_c = options.pullRequestTitlePattern) !== null && _c !== void 0 ? _c : DEFAULT_PULL_REQUEST_TITLE_PATTERN;
        options.pullRequestHeader =
            (_d = options.pullRequestHeader) !== null && _d !== void 0 ? _d : DEFAULT_PULL_REQUEST_HEADER;
        options.includeVInTag = (_e = options.includeVInTag) !== null && _e !== void 0 ? _e : false;
        super(options);
    }
    async buildReleaseNotes(conventionalCommits, newVersion, newVersionTag, latestRelease) {
        const notes = await super.buildReleaseNotes(conventionalCommits, newVersion, newVersionTag, latestRelease);
        return notes.replace(RELEASE_NOTES_HEADER_PATTERN, '## Version $1, released $2');
    }
    async getApi() {
        try {
            const contents = await this.github.getFileContentsOnBranch('apis/apis.json', this.targetBranch);
            const apis = JSON.parse(contents.parsedContent);
            const component = await this.getComponent();
            return apis.apis.find(api => api.id === component);
        }
        catch (e) {
            if (e instanceof errors_1.FileNotFoundError) {
                throw new errors_1.MissingRequiredFileError('apis/apis.json', DotnetYoshi.name, `${this.repository.owner}/${this.repository.repo}`);
            }
            throw e;
        }
    }
    async getDefaultComponent() {
        // default component is based on the path
        const pathParts = this.path.split('/');
        return pathParts[pathParts.length - 1];
    }
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        const component = await this.getComponent();
        const api = await this.getApi();
        if (api === null || api === void 0 ? void 0 : api.noVersionHistory) {
            this.logger.info(`Skipping changelog for ${component} via noVersionHistory configuration`);
        }
        else {
            updates.push({
                path: this.addPath(this.changelogPath),
                createIfMissing: true,
                updater: new changelog_1.Changelog({
                    version,
                    changelogEntry: options.changelogEntry,
                    versionHeaderRegex: '\n## Version [0-9[]+',
                }),
            });
        }
        if (!component) {
            this.logger.warn('Dotnet strategy expects to use components, could not update all files');
            return updates;
        }
        updates.push({
            path: 'apis/apis.json',
            createIfMissing: false,
            updater: new apis_1.Apis(component, version),
        });
        return updates;
    }
}
exports.DotnetYoshi = DotnetYoshi;
//# sourceMappingURL=dotnet-yoshi.js.map