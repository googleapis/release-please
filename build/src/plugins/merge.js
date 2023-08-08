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
exports.Merge = void 0;
const plugin_1 = require("../plugin");
const manifest_1 = require("../manifest");
const pull_request_title_1 = require("../util/pull-request-title");
const pull_request_body_1 = require("../util/pull-request-body");
const branch_name_1 = require("../util/branch-name");
const composite_1 = require("../updaters/composite");
/**
 * This plugin merges multiple pull requests into a single
 * release pull request.
 *
 * Release notes are broken up using `<summary>`/`<details>` blocks.
 */
class Merge extends plugin_1.ManifestPlugin {
    constructor(github, targetBranch, repositoryConfig, options = {}) {
        var _a, _b;
        super(github, targetBranch, repositoryConfig);
        this.pullRequestTitlePattern =
            (_a = options.pullRequestTitlePattern) !== null && _a !== void 0 ? _a : manifest_1.MANIFEST_PULL_REQUEST_TITLE_PATTERN;
        this.pullRequestHeader = options.pullRequestHeader;
        this.headBranchName = options.headBranchName;
        this.forceMerge = (_b = options.forceMerge) !== null && _b !== void 0 ? _b : false;
    }
    async run(candidates) {
        var _a;
        if (candidates.length < 1) {
            return candidates;
        }
        this.logger.info(`Merging ${candidates.length} pull requests`);
        const [inScopeCandidates, outOfScopeCandidates] = candidates.reduce((collection, candidate) => {
            if (candidate.config.separatePullRequests && !this.forceMerge) {
                collection[1].push(candidate);
            }
            else {
                collection[0].push(candidate);
            }
            return collection;
        }, [[], []]);
        const releaseData = [];
        const labels = new Set();
        let rawUpdates = [];
        let rootRelease = null;
        for (const candidate of inScopeCandidates) {
            const pullRequest = candidate.pullRequest;
            rawUpdates = rawUpdates.concat(...pullRequest.updates);
            for (const label of pullRequest.labels) {
                labels.add(label);
            }
            releaseData.push(...pullRequest.body.releaseData);
            if (candidate.path === '.') {
                rootRelease = candidate;
            }
        }
        const updates = (0, composite_1.mergeUpdates)(rawUpdates);
        const pullRequest = {
            title: pull_request_title_1.PullRequestTitle.ofComponentTargetBranchVersion(rootRelease === null || rootRelease === void 0 ? void 0 : rootRelease.pullRequest.title.component, this.targetBranch, rootRelease === null || rootRelease === void 0 ? void 0 : rootRelease.pullRequest.title.version, this.pullRequestTitlePattern),
            body: new pull_request_body_1.PullRequestBody(releaseData, {
                useComponents: true,
                header: this.pullRequestHeader,
            }),
            updates,
            labels: Array.from(labels),
            headRefName: (_a = this.headBranchName) !== null && _a !== void 0 ? _a : branch_name_1.BranchName.ofTargetBranch(this.targetBranch).toString(),
            draft: !candidates.some(candidate => !candidate.pullRequest.draft),
        };
        const releaseTypes = new Set(candidates.map(candidate => candidate.config.releaseType));
        const releaseType = releaseTypes.size === 1 ? releaseTypes.values().next().value : 'simple';
        return [
            {
                path: manifest_1.ROOT_PROJECT_PATH,
                pullRequest,
                config: {
                    releaseType,
                },
            },
            ...outOfScopeCandidates,
        ];
    }
}
exports.Merge = Merge;
//# sourceMappingURL=merge.js.map