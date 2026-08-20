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
  Changes,
  FileData,
  TreeObject,
  RepoDomain,
  BranchDomain,
} from '../types';
import {Octokit} from '@octokit/rest';
import {logger} from '../logger';
import {createCommit, CreateCommitOptions} from './create-commit';
import {CommitError} from '../errors';

const DEFAULT_FILES_PER_COMMIT = 100;

/**
 * Generate and return a GitHub tree object structure
 * containing the target change data
 * See https://developer.github.com/v3/git/trees/#tree-object
 * @param {Changes} changes the set of repository changes
 * @returns {TreeObject[]} The new GitHub changes
 */
export function generateTreeObjects(changes: Changes): TreeObject[] {
  const tree: TreeObject[] = [];
  changes.forEach((fileData: FileData, path: string) => {
    if (fileData.content === null) {
      // if no file content then file is deleted
      tree.push({
        path,
        mode: fileData.mode,
        type: 'blob',
        sha: null,
      });
    } else {
      // update file with its content
      tree.push({
        path,
        mode: fileData.mode,
        type: 'blob',
        content: fileData.content,
      });
    }
  });
  return tree;
}

function* inGroupsOf<T>(
  all: T[],
  groupSize: number
): Generator<T[], void, void> {
  for (let i = 0; i < all.length; i += groupSize) {
    yield all.slice(i, i + groupSize);
  }
}

/**
 * Upload and create a remote GitHub tree
 * and resolves with the new tree SHA.
 * Rejects if GitHub V3 API fails with the GitHub error response
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {RepoDomain} origin the the remote repository to push changes to
 * @param {string} refHead the base of the new commit(s)
 * @param {TreeObject[]} tree the set of GitHub changes to upload
 * @returns {Promise<string>} the GitHub tree SHA
 * @throws {CommitError}
 */
export async function createTree(
  octokit: Octokit,
  origin: RepoDomain,
  refHead: string,
  tree: TreeObject[]
): Promise<string> {
  const oldTreeSha = (
    await octokit.git.getCommit({
      owner: origin.owner,
      repo: origin.repo,
      commit_sha: refHead,
    })
  ).data.tree.sha;
  logger.info('Got the latest commit tree');
  try {
    const treeSha = (
      await octokit.git.createTree({
        owner: origin.owner,
        repo: origin.repo,
        tree,
        base_tree: oldTreeSha,
      })
    ).data.sha;
    logger.info(
      `Successfully created a tree with the desired changes with SHA ${treeSha}`
    );
    return treeSha;
  } catch (e) {
    const cause = e instanceof Error ? e : new Error(String(e));
    throw new CommitError(`Error adding to tree: ${refHead}`, cause);
  }
}

/**
 * Update a reference to a SHA
 * Rejects if GitHub V3 API fails with the GitHub error response
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {BranchDomain} origin the the remote branch to push changes to
 * @param {string} newSha the ref to update the commit HEAD to
 * @param {boolean} force to force the commit changes given refHead
 * @returns {Promise<void>}
 */
export async function updateRef(
  octokit: Octokit,
  origin: BranchDomain,
  newSha: string,
  force: boolean
): Promise<void> {
  logger.info(`Updating reference heads/${origin.branch} to ${newSha}`);
  try {
    await octokit.git.updateRef({
      owner: origin.owner,
      repo: origin.repo,
      ref: `heads/${origin.branch}`,
      sha: newSha,
      force,
    });
    logger.info(`Successfully updated reference ${origin.branch} to ${newSha}`);
  } catch (e) {
    const cause = e instanceof Error ? e : new Error(String(e));
    throw new CommitError(
      `Error updating ref heads/${origin.branch} to ${newSha}`,
      cause
    );
  }
}

export interface CommitAndPushOptions extends CreateCommitOptions {
  filesPerCommit?: number;
}

/**
 * Given a set of changes, apply the commit(s) on top of the given branch's head and upload it to GitHub
 * Rejects if GitHub V3 API fails with the GitHub error response
 * @param {Octokit} octokit The authenticated octokit instance
 * @param {string} refHead the base of the new commit(s)
 * @param {Changes} changes the set of repository changes
 * @param {BranchDomain} originBranch the remote branch that will contain the new changes
 * @param {string} commitMessage the message of the new commit
 * @param {boolean} force to force the commit changes given refHead
 * @param {CommitAndPushOptions} [options] commit and push options
 * @returns {Promise<void>}
 * @throws {CommitError}
 */
export async function commitAndPush(
  octokit: Octokit,
  refHead: string,
  changes: Changes,
  originBranch: BranchDomain,
  commitMessage: string,
  force: boolean,
  options?: CommitAndPushOptions
): Promise<void> {
  if (changes.size === 0) {
    logger.info('No changes to commit. Skipping.');
    return;
  }

  const filesPerCommit = options?.filesPerCommit ?? DEFAULT_FILES_PER_COMMIT;
  const tree = generateTreeObjects(changes);
  let finalTreeSha = '';
  for (const treeGroup of inGroupsOf(tree, filesPerCommit)) {
    finalTreeSha = await createTree(octokit, originBranch, refHead, treeGroup);
    refHead = await createCommit(
      octokit,
      originBranch,
      refHead,
      finalTreeSha,
      commitMessage,
      options
    );
  }

  try {
    const existingRef = await octokit.git.getRef({
      owner: originBranch.owner,
      repo: originBranch.repo,
      ref: `heads/${originBranch.branch}`,
    });
    if (existingRef?.data?.object?.sha) {
      const existingCommit = await octokit.git.getCommit({
        owner: originBranch.owner,
        repo: originBranch.repo,
        commit_sha: existingRef.data.object.sha,
      });
      if (existingCommit?.data?.tree?.sha === finalTreeSha) {
        logger.info(
          `Branch ${originBranch.branch} tree is already identical to ${finalTreeSha}. Skipping ref update.`
        );
        return;
      }
    }
  } catch (err: unknown) {
    const status = (err as {status?: number})?.status;
    if (status === 404) {
      logger.debug(`Branch heads/${originBranch.branch} does not exist yet.`);
    } else {
      logger.debug(`Could not check existing branch tree: ${err}`);
    }
  }

  await updateRef(octokit, originBranch, refHead, force);
}
