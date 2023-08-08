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
exports.FilePullRequestOverflowHandler = void 0;
const pull_request_body_1 = require("./pull-request-body");
const logger_1 = require("./logger");
const url_1 = require("url");
const MAX_ISSUE_BODY_SIZE = 65536;
const OVERFLOW_MESSAGE = 'This release is too large to preview in the pull request body. View the full release notes here:';
const OVERFLOW_MESSAGE_REGEX = new RegExp(`${OVERFLOW_MESSAGE} (?<url>.*)`);
const RELEASE_NOTES_FILENAME = 'release-notes.md';
const FILE_PATH_REGEX = new RegExp(`blob/(?<branchName>.*)/${RELEASE_NOTES_FILENAME}`);
/**
 * This implementation of PullRequestOverflowHandler stores the full release
 * notes on a new git branch. The branch name is derived from the head branch
 * name of the release pull request.
 */
class FilePullRequestOverflowHandler {
    constructor(github, logger = logger_1.logger) {
        this.github = github;
        this.logger = logger;
    }
    /**
     * Optionally store the full release notes into `release-notes.md` file
     * on a new branch if they do not fit into the body of a pull request.
     *
     * The new release notes will have a link to the GitHub UI for that file
     * which should render the release notes nicely.
     * @param {ReleasePullRequest} pullRequest The candidate release pull request
     * @returns {string} The new pull request body which contains a link to
     *   the full content.
     */
    async handleOverflow(pullRequest, maxSize = MAX_ISSUE_BODY_SIZE) {
        const notes = pullRequest.body.toString();
        if (notes.length > maxSize) {
            const notesBranchName = `${pullRequest.headRefName}--release-notes`;
            const url = await this.github.createFileOnNewBranch(RELEASE_NOTES_FILENAME, notes, notesBranchName, this.github.repository.defaultBranch);
            return `${OVERFLOW_MESSAGE} ${url}`;
        }
        return notes;
    }
    /**
     * Given a pull request, retrieve the full release notes from the stored
     * file if the body was too big to store in the pull request body.
     * @param {PullRequest} pullRequest The pull request from GitHub
     * @return {PullRequestBody} The parsed pull request body
     */
    async parseOverflow(pullRequest) {
        var _a, _b;
        const match = pullRequest.body.match(OVERFLOW_MESSAGE_REGEX);
        if ((_a = match === null || match === void 0 ? void 0 : match.groups) === null || _a === void 0 ? void 0 : _a.url) {
            this.logger.info(`Pull request body overflows, parsing full body from: ${match.groups.url}`);
            const url = new url_1.URL(match.groups.url);
            const pathMatch = url.pathname.match(FILE_PATH_REGEX);
            if ((_b = pathMatch === null || pathMatch === void 0 ? void 0 : pathMatch.groups) === null || _b === void 0 ? void 0 : _b.branchName) {
                const fileContents = await this.github.getFileContentsOnBranch(RELEASE_NOTES_FILENAME, pathMatch.groups.branchName);
                return pull_request_body_1.PullRequestBody.parse(fileContents.parsedContent);
            }
            this.logger.warn(`Could not parse branch from ${match.groups.url}`);
            return pull_request_body_1.PullRequestBody.parse(pullRequest.body, this.logger);
        }
        return pull_request_body_1.PullRequestBody.parse(pullRequest.body, this.logger);
    }
}
exports.FilePullRequestOverflowHandler = FilePullRequestOverflowHandler;
//# sourceMappingURL=pull-request-overflow-handler.js.map