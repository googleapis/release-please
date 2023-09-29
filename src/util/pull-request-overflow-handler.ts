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

import {PullRequestBody} from './pull-request-body';
import {GitHub} from '../github';
import {PullRequest} from '../pull-request';
import {Logger, logger as defaultLogger} from './logger';
import {URL} from 'url';
import {ReleasePullRequest} from '../release-pull-request';
import {FileNotFoundError} from '../errors';

const MAX_ISSUE_BODY_SIZE = 65536;
const OVERFLOW_MESSAGE =
  'This release is too large to preview in the pull request body. View the full release notes here:';
const OVERFLOW_MESSAGE_REGEX = new RegExp(`${OVERFLOW_MESSAGE} (?<url>.*)`);
const RELEASE_NOTES_FILENAME = 'release-notes.md';
const FILE_PATH_REGEX = new RegExp(
  `blob/(?<branchName>.*)/${RELEASE_NOTES_FILENAME}`
);

/**
 * Interface for managing the pull request body contents when the content
 * is too large to fit into a pull request.
 */
export interface PullRequestOverflowHandler {
  /**
   * If a pull request's body is too big, store it somewhere and return
   * a new pull request body with information about the new location.
   * @param {ReleasePullRequest} pullRequest The candidate release pull request
   * @param {string} baseBranch The branch to use as the base branch to fork from
   * @returns {string} The new pull request body which may contain a link to
   *   the full content.
   */
  handleOverflow(
    pullRequest: ReleasePullRequest,
    baseBranch: string,
    maxSize?: number
  ): Promise<string>;

  /**
   * Given a pull request, parse the pull request body from the pull request
   * or storage if the body was too big to store in the pull request body.
   * @param {PullRequest} pullRequest The pull request from GitHub
   * @return {PullRequestBody} The parsed pull request body
   */
  parseOverflow(pullRequest: PullRequest): Promise<PullRequestBody | undefined>;
}

/**
 * This implementation of PullRequestOverflowHandler stores the full release
 * notes on a new git branch. The branch name is derived from the head branch
 * name of the release pull request.
 */
export class FilePullRequestOverflowHandler
  implements PullRequestOverflowHandler
{
  private github: GitHub;
  private logger: Logger;
  constructor(github: GitHub, logger: Logger = defaultLogger) {
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
  async handleOverflow(
    pullRequest: ReleasePullRequest,
    baseBranch: string,
    maxSize: number = MAX_ISSUE_BODY_SIZE
  ): Promise<string> {
    const notes = pullRequest.body.toString();
    if (notes.length > maxSize) {
      const notesBranchName = `${pullRequest.headRefName}--release-notes`;
      const url = await this.github.createFileOnNewBranch(
        RELEASE_NOTES_FILENAME,
        notes,
        notesBranchName,
        baseBranch
      );
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
  async parseOverflow(
    pullRequest: PullRequest
  ): Promise<PullRequestBody | undefined> {
    const match = pullRequest.body.match(OVERFLOW_MESSAGE_REGEX);
    if (match?.groups?.url) {
      this.logger.info(
        `Pull request body overflows, parsing full body from: ${match.groups.url}`
      );
      const url = new URL(match.groups.url);
      const pathMatch = url.pathname.match(FILE_PATH_REGEX);
      if (pathMatch?.groups?.branchName) {
        try {
          const fileContents = await this.github.getFileContentsOnBranch(
            RELEASE_NOTES_FILENAME,
            pathMatch.groups.branchName
          );
          return PullRequestBody.parse(fileContents.parsedContent);
        } catch (err) {
          if (err instanceof FileNotFoundError) {
            // the branch or file have been deleted, do nothing
          } else {
            throw err;
          }
        }
      }
      this.logger.warn(`Could not parse branch from ${match.groups.url}`);
      return PullRequestBody.parse(pullRequest.body, this.logger);
    }
    return PullRequestBody.parse(pullRequest.body, this.logger);
  }
}
