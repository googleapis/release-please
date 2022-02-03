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

export const DEFAULT_FILE_MODE = '100644';

export interface GitHubFileContents {
  sha: string;
  content: string;
  parsedContent: string;
  mode: string;
}

export class RepositoryFileCache {
  private octokit: Octokit;
  private repository: Repository;
  private cache: Map<string, BranchFileCache>;

  constructor(octokit: Octokit, repository: Repository) {
    this.octokit = octokit;
    this.repository = repository;
    this.cache = new Map();
  }
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

export class BranchFileCache {
  private octokit: Octokit;
  private repository: Repository;
  private branch: string;
  private cache: Map<string, GitHubFileContents>;
  private treeCache: Map<string, TreeEntry[]>;
  private treeEntries?: TreeEntry[] | null;

  constructor(octokit: Octokit, repository: Repository, branch: string) {
    this.octokit = octokit;
    this.repository = repository;
    this.branch = branch;
    this.cache = new Map();
    this.treeCache = new Map();
  }

  async getFileContents(path: string): Promise<GitHubFileContents> {
    const cached = this.cache.get(path);
    if (cached) {
      return cached;
    }
    const fetched = await this.fetchFileContents(path);
    this.cache.set(path, fetched);
    return fetched;
  }

  private async fetchFileContents(path: string): Promise<GitHubFileContents> {
    // try to use the entire git tree if it's not too big
    const treeEntries = await this.getFullTree();
    if (treeEntries) {
      logger.debug(`Using full tree to find ${path}`);
      const found = treeEntries.find(entry => entry.path === path);
      if (found?.sha) {
        return await this.fetchContents(found.sha, found);
      }
    }

    // full tree is too big, use data API to fetch
    const parts = path.split('/');
    let treeSha = this.branch;
    let found: TreeEntry | undefined;
    for (const part of parts) {
      const tree = await this.getTree(treeSha);
      found = tree.find(item => item.path === part);
      if (!found?.sha) {
        throw new Error(`Could not find requested path: ${path}`);
      }
      treeSha = found.sha;
    }

    if (found?.sha) {
      return await this.fetchContents(found.sha, found);
    }
    throw Error('not implement');
  }

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

  private async getTree(sha: string): Promise<TreeEntry[]> {
    const cached = this.treeCache.get(sha);
    if (cached) {
      return cached;
    }
    const fetched = await this.fetchTree(sha);
    this.treeCache.set(sha, fetched);
    return fetched;
  }

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
