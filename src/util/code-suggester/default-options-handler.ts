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

import {
  CreatePullRequest,
  CreatePullRequestUserOptions,
} from './types';

const DEFAULT_BRANCH_NAME = 'code-suggestions';
const DEFAULT_PRIMARY_BRANCH = 'main';

/**
 * Add defaults to GitHub Pull Request options.
 * Preserves the empty string.
 * For ESCMAScript, null/undefined values are preserved for required fields.
 * Recommended with an object validation function to check empty strings and incorrect types.
 * @param {PullRequestUserOptions} options the user-provided github pull request options
 * @returns {CreatePullRequest} git hub context with defaults applied
 */
export function addPullRequestDefaults(
  options: CreatePullRequestUserOptions
): CreatePullRequest {
  const pullRequestSettings: CreatePullRequest = {
    upstreamOwner: options.upstreamOwner,
    upstreamRepo: options.upstreamRepo,
    description: options.description,
    title: options.title,
    message: options.message,
    force: options.force || false,
    branch:
      typeof options.branch === 'string' ? options.branch : DEFAULT_BRANCH_NAME,
    primary:
      typeof options.primary === 'string'
        ? options.primary
        : DEFAULT_PRIMARY_BRANCH,
    maintainersCanModify: options.maintainersCanModify === false ? false : true,
    filesPerCommit: options.filesPerCommit,
  };
  return pullRequestSettings;
}
