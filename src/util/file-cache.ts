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

import {Octokit} from '@octokit/rest';
import {Repository} from '../repository';
import {logger} from './logger';
import {FileNotFoundError} from '../errors';

export const DEFAULT_FILE_MODE = '100644';

export interface GitHubFileContents {
  sha: string;
  content: string;
  parsedContent: string;
  mode: string;
}

/**
 * This class is a read-through cache aimed at minimizing the
 * number of API requests needed to fetch file data/contents.
 * It lazy-caches data as it reads and will return cached data
 * for resources already fetched.
 */
export class RepositoryFileCache {
  private octokit: Octokit;
  private repository: Repository;
  private cache: Map<string, BranchFileCache>;

  /**
   * Instantiate a new loading cache instance
   *
   * @param {Octokit} octokit An authenticated octokit instance
   * @param {Repository} repository The repository we are fetching data for
   */
  constructor(octokit: Octokit, repository: Repository) {
    this.octokit = octokit;
    this.repository = repository;
    this.cache = new Map();
  }

  /**
   * Fetch file contents for given path on a given branch. If the
   * data has already been fetched, return a cached copy.
   *
   * @param {string} path Path to the file
   * @param {string} branch Branch to fetch the file from
   * @returns {GitHubFileContents} The file contents
   */
  async getFileContents(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    let fileCache = this.cache.get(branch);
    if (!fileCache) {
      fileCache = new BranchFileCache(this.octokit, this.repository, branch);
      this.cache.set(branch, fileCache);
    }

    return await fileCache.getFileContents(path);
  }
}

interface TreeEntry {
  mode?: string;
  path?: string;
  sha?: string;
  size?: number;
}

/**
 * This class is a read-through cache for a single branch aimed
 * at minimizing the number of API requests needed to fetch file
 * data/contents. It lazy-caches data as it reads and will return
 * cached data for resources already fetched.
 */
export class BranchFileCache {
  private octokit: Octokit;
  private repository: Repository;
  private branch: string;
  private cache: Map<string, GitHubFileContents>;
  private treeCache: Map<string, TreeEntry[]>;
  private treeEntries?: TreeEntry[] | null;

  /**
   * Instantiate a new loading cache instance
   *
   * @param {Octokit} octokit An authenticated octokit instance
   * @param {Repository} repository The repository we are fetching data for
   * @param {string} branch The branch we are fetching data from
   */
  constructor(octokit: Octokit, repository: Repository, branch: string) {
    this.octokit = octokit;
    this.repository = repository;
    this.branch = branch;
    this.cache = new Map();
    this.treeCache = new Map();
  }

  /**
   * Fetch file contents for given path. If the data has already been
   * fetched, return the cached copy.
   *
   * @param {string} path Path to the file
   * @param {string} branch Branch to fetch the file from
   * @returns {GitHubFileContents} The file contents
   */
  async getFileContents(path: string): Promise<GitHubFileContents> {
    const cached = this.cache.get(path);
    if (cached) {
      return cached;
    }
    const fetched = await this.fetchFileContents(path);
    this.cache.set(path, fetched);
    return fetched;
  }

  /**
   * Actually fetch the file contents. Uses the tree API to fetch file
   * data.
   *
   * @param {string} path Path to the file
   */
  private async fetchFileContents(path: string): Promise<GitHubFileContents> {
    // try to use the entire git tree if it's not too big
    const treeEntries = await this.getFullTree();
    if (treeEntries) {
      logger.debug(`Using full tree to find ${path}`);
      const found = treeEntries.find(entry => entry.path === path);
      if (found?.sha) {
        return await this.fetchContents(found.sha, found);
      }
      throw new FileNotFoundError(path);
    }

    // full tree is too big, use data API to fetch
    const parts = path.split('/');
    let treeSha = this.branch;
    let found: TreeEntry | undefined;
    for (const part of parts) {
      const tree = await this.getTree(treeSha);
      found = tree.find(item => item.path === part);
      if (!found?.sha) {
        throw new FileNotFoundError(path);
      }
      treeSha = found.sha;
    }

    if (found?.sha) {
      return await this.fetchContents(found.sha, found);
    }
    throw new FileNotFoundError(path);
  }

  /**
   * Return the full recursive git tree. If already fetched, return
   * the cached version. If the tree is too big, return null.
   *
   * @returns {TreeEntry[]} The tree entries
   */
  private async getFullTree(): Promise<TreeEntry[] | null> {
    if (this.treeEntries === undefined) {
      // fetch all tree entries recursively
      const {
        data: {tree, truncated},
      } = await this.octokit.git.getTree({
        owner: this.repository.owner,
        repo: this.repository.repo,
        tree_sha: this.branch,
        recursive: 'true',
      });
      if (truncated) {
        // the full tree is too big to use, mark it as unusable
        this.treeEntries = null;
      } else {
        this.treeEntries = tree;
      }
    }
    return this.treeEntries;
  }

  /**
   * Returns the git tree for a given SHA. If already fetched, return
   * the cached version.
   *
   * @param {string} sha The tree SHA
   * @returns {TreeEntry[]} The tree entries
   */
  private async getTree(sha: string): Promise<TreeEntry[]> {
    const cached = this.treeCache.get(sha);
    if (cached) {
      return cached;
    }
    const fetched = await this.fetchTree(sha);
    this.treeCache.set(sha, fetched);
    return fetched;
  }

  /**
   * Fetch the git tree via the GitHub API
   *
   * @param {string} sha The tree SHA
   * @returns {TreeEntry[]} The tree entries
   */
  private async fetchTree(sha: string): Promise<TreeEntry[]> {
    const {
      data: {tree},
    } = await this.octokit.git.getTree({
      owner: this.repository.owner,
      repo: this.repository.repo,
      tree_sha: sha,
      recursive: 'false',
    });
    return tree;
  }

  /**
   * Fetch the git blob from the GitHub API and convert into a
   * GitHubFileContents object.
   *
   * @param {string} blobSha The git blob SHA
   * @param {TreeEntry} treeEntry The associated tree object
   */
  private async fetchContents(
    blobSha: string,
    treeEntry: TreeEntry
  ): Promise<GitHubFileContents> {
    const {
      data: {content},
    } = await this.octokit.git.getBlob({
      owner: this.repository.owner,
      repo: this.repository.repo,
      file_sha: blobSha,
    });
    return {
      sha: blobSha,
      mode: treeEntry.mode || DEFAULT_FILE_MODE,
      content,
      parsedContent: Buffer.from(content, 'base64').toString('utf8'),
    };
  }
}
