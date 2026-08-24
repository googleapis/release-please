// Copyright 2026 Google LLC
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
import {RequestError} from '@octokit/request-error';
import * as path from 'path';
/* eslint-disable-next-line node/no-extraneous-import */
import {Minimatch} from 'minimatch';
import {Repository} from '../repository';
import {FileNotFoundError} from '../errors';
import {Logger} from './code-suggester/types';
import {
  GitHubFileContents,
  DEFAULT_FILE_MODE,
} from '@google-automations/git-file-utils';
import {ROOT_PROJECT_PATH} from '../manifest';

type OctokitType = InstanceType<typeof Octokit>;

export interface TreeEntry {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}

export interface TreeResponse {
  tree: TreeEntry[];
  truncated?: boolean;
}

export interface CachedTree {
  tree: TreeEntry[];
  recursive: boolean;
}

/**
 * RepositoryFileCache is a read-through cache for GitHub file contents
 * and directory trees across branches.
 */
export class RepositoryFileCache {
  readonly octokit: OctokitType;
  readonly repository: Repository;
  private cache: Map<string, BranchFileCache>;
  private logger?: Logger;

  constructor(octokit: OctokitType, repository: Repository, logger?: Logger) {
    this.octokit = octokit;
    this.repository = repository;
    this.cache = new Map();
    this.logger = logger;
  }

  async getFileContents(
    path: string,
    branch: string
  ): Promise<GitHubFileContents> {
    const fileCache = this.getBranchFileCache(branch);
    return await fileCache.getFileContents(path);
  }

  async findFilesByFilename(
    filename: string,
    branch: string,
    pathPrefix?: string
  ): Promise<string[]> {
    const fileCache = this.getBranchFileCache(branch);
    return await fileCache.findFilesByFilename(filename, pathPrefix);
  }

  async findFilesByExtension(
    extension: string,
    branch: string,
    pathPrefix?: string
  ): Promise<string[]> {
    const fileCache = this.getBranchFileCache(branch);
    return await fileCache.findFilesByExtension(extension, pathPrefix);
  }

  async findFilesByGlob(
    glob: string,
    branch: string,
    pathPrefix?: string
  ): Promise<string[]> {
    const fileCache = this.getBranchFileCache(branch);
    return await fileCache.findFilesByGlob(glob, pathPrefix);
  }

  getBranchFileCache(branch: string): BranchFileCache {
    let fileCache = this.cache.get(branch);
    if (!fileCache) {
      fileCache = new BranchFileCache(
        this.octokit,
        this.repository,
        branch,
        this.logger
      );
      this.cache.set(branch, fileCache);
    }
    return fileCache;
  }
}

/**
 * BranchFileCache manages file and tree cache for a specific git branch or ref.
 */
export class BranchFileCache {
  readonly octokit: OctokitType;
  readonly repository: Repository;
  readonly branch: string;
  private cache: Map<string, GitHubFileContents>;
  private treeCache: Map<string, CachedTree>;
  private logger?: Logger;

  constructor(
    octokit: OctokitType,
    repository: Repository,
    branch: string,
    logger?: Logger
  ) {
    this.octokit = octokit;
    this.repository = repository;
    this.branch = branch;
    this.cache = new Map();
    this.treeCache = new Map();
    this.logger = logger;
  }

  async getFileContents(filePath: string): Promise<GitHubFileContents> {
    const cached = this.cache.get(filePath);
    if (cached) {
      return cached;
    }
    const fetched = await this.fetchFileContents(filePath);
    this.cache.set(filePath, fetched);
    return fetched;
  }

  async findFilesByFilename(
    filename: string,
    pathPrefix?: string
  ): Promise<string[]> {
    const files: string[] = [];
    const normalizedPrefix = pathPrefix
      ? normalizePrefix(pathPrefix)
      : undefined;
    for await (const treeEntry of this.treeEntryIterator(
      this.branch,
      normalizedPrefix
    )) {
      if (path.posix.basename(treeEntry.path) === filename) {
        files.push(treeEntry.path);
      }
    }
    return stripPrefix(files, normalizedPrefix);
  }

  async findFilesByExtension(
    extension: string,
    pathPrefix?: string
  ): Promise<string[]> {
    const files: string[] = [];
    const normalizedPrefix = pathPrefix
      ? normalizePrefix(pathPrefix)
      : undefined;
    for await (const treeEntry of this.treeEntryIterator(
      this.branch,
      normalizedPrefix
    )) {
      if (path.posix.extname(treeEntry.path) === `.${extension}`) {
        files.push(treeEntry.path);
      }
    }
    return stripPrefix(files, normalizedPrefix);
  }

  async findFilesByGlob(glob: string, pathPrefix?: string): Promise<string[]> {
    const files: string[] = [];
    const normalizedPrefix = pathPrefix
      ? normalizePrefix(pathPrefix)
      : undefined;
    const mm = new Minimatch(glob);
    for await (const treeEntry of this.treeEntryIterator(
      this.branch,
      normalizedPrefix
    )) {
      if (mm.match(treeEntry.path)) {
        files.push(treeEntry.path);
      }
    }
    return stripPrefix(files, normalizedPrefix);
  }

  async fetchFileContents(filePath: string): Promise<GitHubFileContents> {
    // Try to use the entire git tree if it's already available and recursive
    const treeEntries = await this.getFullTree();
    if (treeEntries) {
      const found = treeEntries.find(entry => entry.path === filePath);
      if (found?.sha) {
        if (found.mode === '160000' || found.type === 'commit') {
          this.logger?.warn?.(
            `Encountered git submodule/gitlink at ${filePath}, treating as not found`
          );
          throw new FileNotFoundError(filePath);
        }
        return await this.fetchContents(found.sha, found);
      }
      throw new FileNotFoundError(filePath);
    }

    // Full tree was not recursive (e.g. 422 submodule or truncated), traverse down path parts
    const parts = filePath.split('/');
    let treeSha = this.branch;
    let found: TreeEntry | undefined;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const {tree} = await this.getTree(treeSha);
      found = tree.find(item => item.path === part);
      if (!found?.sha) {
        throw new FileNotFoundError(filePath);
      }
      if (found.mode === '160000' || found.type === 'commit') {
        this.logger?.warn?.(
          `Encountered git submodule/gitlink at ${filePath}, treating as not found`
        );
        throw new FileNotFoundError(filePath);
      }
      if (!isLast && found.type !== 'tree') {
        throw new FileNotFoundError(filePath);
      }
      treeSha = found.sha;
    }
    if (!found?.sha || found.mode === '160000' || found.type === 'commit') {
      throw new FileNotFoundError(filePath);
    }
    return await this.fetchContents(found.sha, found);
  }

  async getFullTree(): Promise<TreeEntry[] | null> {
    const cachedTree = await this.getTree(this.branch);
    if (cachedTree.recursive) {
      return cachedTree.tree;
    }
    return null;
  }

  async getTree(sha: string): Promise<CachedTree> {
    const cached = this.treeCache.get(sha);
    if (cached) {
      return cached;
    }
    let fetched: TreeResponse;
    let isRecursive = false;
    try {
      fetched = await this.fetchTree(sha, true);
      if (!fetched.truncated) {
        isRecursive = true;
      } else {
        fetched = await this.fetchTree(sha, false);
        if (fetched.truncated) {
          this.logger?.warn?.(
            `non-recursive file list for tree ${sha} is truncated, this folder has too many files!`
          );
        }
      }
    } catch (err) {
      if (err instanceof RequestError && err.status === 422) {
        this.logger?.debug?.(
          `Recursive tree fetch failed with 422 for ${sha}, falling back to non-recursive tree traversal`
        );
        fetched = await this.fetchTree(sha, false);
        if (fetched.truncated) {
          this.logger?.warn?.(
            `non-recursive file list for tree ${sha} is truncated, this folder has too many files!`
          );
        }
      } else {
        throw err;
      }
    }

    const cachedTree: CachedTree = {
      tree: fetched.tree,
      recursive: isRecursive,
    };
    this.treeCache.set(sha, cachedTree);
    return cachedTree;
  }

  async fetchTree(sha: string, recursive: boolean): Promise<TreeResponse> {
    try {
      const {
        data: {tree, truncated},
      } = await this.octokit.git.getTree({
        owner: this.repository.owner,
        repo: this.repository.repo,
        tree_sha: sha,
        recursive: recursive ? 'true' : undefined,
      });
      return {
        tree: tree as TreeEntry[],
        truncated,
      };
    } catch (e) {
      if (e instanceof RequestError && e.status === 409) {
        return {
          tree: [],
          truncated: false,
        };
      }
      throw e;
    }
  }

  async *treeEntryIterator(
    ref: string,
    pathPrefix?: string
  ): AsyncGenerator<TreeEntry & {path: string}> {
    const treeShas: Array<{ref: string; path?: string}> = [{ref}];
    let treeReference: {ref: string; path?: string} | undefined;
    while ((treeReference = treeShas.shift())) {
      const cachedTree = await this.getTree(treeReference.ref);
      for (const treeEntry of cachedTree.tree) {
        if (!treeEntry.path) continue;
        const fullPath = treeReference.path
          ? `${treeReference.path}/${treeEntry.path}`
          : treeEntry.path;

        // Skip submodule gitlink: mode 160000 or type commit
        if (treeEntry.mode === '160000' || treeEntry.type === 'commit') {
          continue;
        }

        if (!cachedTree.recursive && treeEntry.type === 'tree') {
          if (
            !pathPrefix ||
            pathPrefix.startsWith(fullPath) ||
            fullPath.startsWith(pathPrefix)
          ) {
            if (treeEntry.sha) {
              treeShas.push({ref: treeEntry.sha, path: fullPath});
            }
          }
          continue;
        }

        if (pathPrefix && !fullPath.startsWith(pathPrefix)) {
          continue;
        }

        yield {
          ...treeEntry,
          path: fullPath,
        };
      }
    }
  }

  async fetchContents(
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

export function normalizePrefix(prefix: string): string {
  const normalized = prefix.replace(/^[/\\]+/, '').replace(/[/\\]+$/, '');
  if (normalized === ROOT_PROJECT_PATH || normalized === '.') {
    return '';
  }
  return normalized;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripPrefix(files: string[], prefix?: string): string[] {
  if (!prefix) {
    return files;
  }
  const normalized = normalizePrefix(prefix);
  if (!normalized) {
    return files;
  }
  const prefixRegex = new RegExp(`^${escapeRegex(normalized)}[/\\\\]`);
  return files
    .filter(file => file.startsWith(`${normalized}/`))
    .map(file => file.replace(prefixRegex, ''));
}
