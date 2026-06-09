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

import {BranchDomain, RepoDomain} from '../types';
import {Octokit} from '@octokit/rest';
import {logger} from '../logger';

/**
 * Create a GitHub PR on the upstream organization's repo
 * Throws an error if the GitHub API fails
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} upstream The upstream repository
 * @param {BranchDomain} origin The remote origin information that contains the origin branch
 * @param {number} issue_number The issue number to add labels to. Can also be a PR number
 * @param {string[]} labels The list of labels to apply to the newly created PR. Default is []. the funciton will no-op.
 * @returns {Promise<string[]>} The list of resulting labels after the addition of the given labels
 */
async function addLabels(
  octokit: Octokit,
  upstream: RepoDomain,
  origin: BranchDomain,
  issue_number: number,
  labels?: string[]
): Promise<string[]> {
  if (!labels || labels.length === 0) {
    return [];
  }

  const labelsResponseData = (
    await octokit.issues.addLabels({
      owner: upstream.owner,
      repo: origin.repo,
      issue_number: issue_number,
      labels: labels,
    })
  ).data;
  logger.info(`Successfully added labels ${labels} to issue: ${issue_number}`);
  return labelsResponseData.map(l => l.name);
}

export {addLabels};
