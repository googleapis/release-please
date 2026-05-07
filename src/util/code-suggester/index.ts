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

// @ts-nocheck

import {
  Changes,
  Description,
  CreatePullRequestUserOptions,
  RepoDomain,
  BranchDomain,
} from './types';
import {Octokit} from '@octokit/rest';
import {logger, setupLogger} from './logger';
import {addPullRequestDefaults} from './default-options-handler';
import * as retry from 'async-retry';
import {branch} from './github/branch';
import {fork} from './github/fork';
import {commitAndPush} from './github/commit-and-push';
import {openPullRequest} from './github/open-pull-request';
import {addLabels} from './github/labels';

/**
 * Make a new GitHub Pull Request with a set of changes applied on top of primary branch HEAD.
 * The changes are committed into a new branch based on the upstream repository options using the authenticated Octokit account.
 * Then a Pull Request is made from that branch.
 *
 * Also throws error if git data from the fork is not ready in 5 minutes.
 *
 * From the docs
 * https://developer.github.com/v3/repos/forks/#create-a-fork
 * """
 * Forking a Repository happens asynchronously.
 * You may have to wait a short period of time before you can access the git objects.
 * If this takes longer than 5 minutes, be sure to contact GitHub Support or GitHub Premium Support.
 * """
 *
 * If changes are empty then the workflow will not run.
 * Rethrows an HttpError if Octokit GitHub API returns an error. HttpError Octokit access_token and client_secret headers redact all sensitive information.
 * @param {Octokit} octokit The authenticated octokit instance, instantiated with an access token having permissiong to create a fork on the target repository
 * @param {Changes | null | undefined} changes A set of changes. The changes may be empty
 * @param {CreatePullRequestUserOptions} options The configuration for interacting with GitHub provided by the user.
 * @returns {Promise<number>} the pull request number. Returns 0 if unsuccessful.
 * @throws {CommitError} on failure during commit process
 */
async function createPullRequest(
  octokit: Octokit,
  changes: Changes | null | undefined,
  options: CreatePullRequestUserOptions
): Promise<number> {
  setupLogger(options.logger);
  // if null undefined, or the empty map then no changes have been provided.
  // Do not execute GitHub workflow
  if (changes === null || changes === undefined || changes.size === 0) {
    logger.info(
      'Empty change set provided. No changes need to be made. Cancelling workflow.'
    );
    return 0;
  }
  const gitHubConfigs = addPullRequestDefaults(options);
  logger.info('Starting GitHub PR workflow...');
  const upstream: RepoDomain = {
    owner: gitHubConfigs.upstreamOwner,
    repo: gitHubConfigs.upstreamRepo,
  };
  const origin: RepoDomain =
    options.fork === false ? upstream : await fork(octokit, upstream);
  if (options.fork) {
    // try to sync the fork
    await retry(
      async () =>
        await octokit.repos.mergeUpstream({
          owner: origin.owner,
          repo: origin.repo,
          branch: gitHubConfigs.primary,
        }),
      {
        retries: options.retry,
        factor: 2.8411, // https://www.wolframalpha.com/input/?i=Sum%5B3000*x%5Ek%2C+%7Bk%2C+0%2C+4%7D%5D+%3D+5+*+60+*+1000
        minTimeout: 3000,
        randomize: false,
        onRetry: (e: Error, attempt) => {
          e.message = `Error creating syncing upstream: ${e.message}`;
          logger.error(e);
          logger.info(`Retry attempt #${attempt}...`);
        },
      }
    );
  }
  const originBranch: BranchDomain = {
    ...origin,
    branch: gitHubConfigs.branch,
  };

  // The `retry` flag defaults to `5` to maintain compatibility
  options.retry = options.retry === undefined ? 5 : options.retry;

  const refHeadSha: string = await retry(
    async () =>
      await branch(
        octokit,
        origin,
        upstream,
        originBranch.branch,
        gitHubConfigs.primary
      ),
    {
      retries: options.retry,
      factor: 2.8411, // https://www.wolframalpha.com/input/?i=Sum%5B3000*x%5Ek%2C+%7Bk%2C+0%2C+4%7D%5D+%3D+5+*+60+*+1000
      minTimeout: 3000,
      randomize: false,
      onRetry: (e: Error, attempt) => {
        e.message = `Error creating Pull Request: ${e.message}`;
        logger.error(e);
        logger.info(`Retry attempt #${attempt}...`);
      },
    }
  );

  await commitAndPush(
    octokit,
    refHeadSha,
    changes,
    originBranch,
    gitHubConfigs.message,
    gitHubConfigs.force,
    options
  );

  const description: Description = {
    body: gitHubConfigs.description,
    title: gitHubConfigs.title,
  };
  const prNumber = await openPullRequest(
    octokit,
    upstream,
    originBranch,
    description,
    gitHubConfigs.maintainersCanModify,
    gitHubConfigs.primary,
    options.draft
  );
  logger.info(`Successfully opened pull request: ${prNumber}.`);

  // addLabels will no-op if options.labels is undefined or empty.
  await addLabels(octokit, upstream, originBranch, prNumber, options.labels);

  return prNumber;
}

export {Changes, CommitData, CommitSigner} from './types';
export {createPullRequest};
