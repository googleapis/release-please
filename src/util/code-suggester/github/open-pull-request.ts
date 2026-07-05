// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {BranchDomain, Description, RepoDomain} from '../types';
import {Octokit} from '@octokit/rest';
import {logger} from '../logger';

const DEFAULT_PRIMARY = 'main';

/**
 * Create a GitHub PR on the upstream organization's repo
 * Throws an error if the GitHub API fails
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} upstream The upstream repository
 * @param {BranchDomain} origin The remote origin information that contains the origin branch
 * @param {Description} description The pull request title and detailed description
 * @param {boolean} maintainersCanModify Whether or not maintainers can modify the pull request. Default is true
 * @param {string} upstreamPrimary The upstream repository's primary branch. Default is main.
 * @param draft Open a DRAFT pull request.  Defaults to false.
 * @returns {Promise<void>}
 */
async function openPullRequest(
  octokit: Octokit,
  upstream: RepoDomain,
  origin: BranchDomain,
  description: Description,
  maintainersCanModify = true,
  upstreamPrimary: string = DEFAULT_PRIMARY,
  draft = false
): Promise<number> {
  const head = `${origin.owner}:${origin.branch}`;
  const existingPullRequest = (
    await octokit.pulls.list({
      owner: upstream.owner,
      repo: origin.repo,
      head,
    })
  ).data.find(pr => pr.head.label === head);
  if (existingPullRequest) {
    logger.info(
      `Found existing pull request for reference ${origin.owner}:${origin.branch}. Skipping creating a new pull request.`
    );
    return existingPullRequest.number;
  }
  const pullResponseData = (
    await octokit.pulls.create({
      owner: upstream.owner,
      repo: origin.repo,
      title: description.title,
      head: `${origin.owner}:${origin.branch}`,
      base: upstreamPrimary,
      body: description.body,
      maintainer_can_modify: maintainersCanModify,
      draft: draft,
    })
  ).data;
  logger.info(
    `Successfully opened pull request available at url: ${pullResponseData.url}.`
  );
  return pullResponseData.number;
}

export {openPullRequest};
