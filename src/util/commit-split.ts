// Copyright 2019 Google LLC
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

import {Commit} from '../commit';
import {ROOT_PROJECT_PATH} from '../manifest';
import {normalizePaths} from './commit-utils';

export interface CommitSplitOptions {
  // Include empty git commits: each empty commit is included
  // in the list of commits for each path.
  // This allows using the `git commit --allow-empty` workflow
  // of setting a package's version without changing source code.
  // For example the following empty commit would bump the minor
  // version for all packages:
  //
  // "feat: bump all the versions"
  //
  // And this commit would set all package versions to 7.7.7
  //
  // "chore: bump all the versions
  //
  // release-as: 7.7.7"
  includeEmpty?: boolean;
  // rather than split by top level folder, split by these package
  // paths (e.g. ["packages/pkg1", "python/pkg1"]). Commits that
  // only touch files under paths not specified here are ignored.
  // Paths must be unique and non-overlapping.
  //
  // NOTE: GitHub API always returns paths using the `/` separator, regardless
  // of what platform the client code is running on
  packagePaths?: string[];
}

/**
 * Helper class for splitting commits by component path. If `packagePaths`
 * is configured, then only consider the provided paths. If `includeEmpty`
 * is configured, then commits without any touched files apply to all
 * configured component paths.
 */
export class CommitSplit {
  includeEmpty: boolean;
  packagePaths?: string[];
  constructor(opts?: CommitSplitOptions) {
    opts = opts || {};
    this.includeEmpty = !!opts.includeEmpty;
    if (opts.packagePaths) {
      const paths: string[] = normalizePaths(opts.packagePaths);
      this.packagePaths = paths
        .filter(path => {
          // The special "." path, representing the root of the module, should be
          // ignored by commit-split as it is assigned all commits in manifest.ts
          return path !== ROOT_PROJECT_PATH;
        })
        .sort((a, b) => b.length - a.length); // sort by longest paths first
    }
  }

  /**
   * Split commits by component path. If the commit splitter is configured
   * with a set of tracked package paths, then only consider paths for
   * configured components. If `includeEmpty` is configured, then a commit
   * that does not touch any files will be applied to all components'
   * commits.
   * @param {Commit[]} commits The commits to split
   * @returns {Record<string, Commit[]>} Commits indexed by component path
   */
  split<T extends Commit>(commits: T[]): Record<string, T[]> {
    const splitCommits: Record<string, T[]> = {};
    commits.forEach(commit => {
      if (commit.files === undefined) {
        throw new Error(
          `Commit ${commit.sha} is missing files. Did you set "backfillFiles" to "true"?`
        );
      }
      const dedupe: Set<string> = new Set();
      for (let i = 0; i < commit.files.length; i++) {
        const file: string = commit.files[i];
        // NOTE: GitHub API always returns paths using the `/` separator,
        // regardless of what platform the client code is running on
        const splitPath = file.split('/');
        // indicates that we have a top-level file and not a folder
        // in this edge-case we should not attempt to update the path.
        if (splitPath.length === 1) continue;

        let pkgName;
        if (this.packagePaths) {
          // only track paths under this.packagePaths
          pkgName = this.packagePaths.find(p => file.indexOf(`${p}/`) === 0);
        } else {
          // track paths by top level folder
          pkgName = splitPath[0];
        }
        if (!pkgName || dedupe.has(pkgName)) continue;
        else dedupe.add(pkgName);
        if (!splitCommits[pkgName]) splitCommits[pkgName] = [];
        splitCommits[pkgName].push(commit);
      }
      if (commit.files.length === 0 && this.includeEmpty) {
        if (this.packagePaths) {
          for (const pkgName of this.packagePaths) {
            splitCommits[pkgName] = splitCommits[pkgName] || [];
            splitCommits[pkgName].push(commit);
          }
        } else {
          for (const pkgName in splitCommits) {
            splitCommits[pkgName].push(commit);
          }
        }
      }
    });
    return splitCommits;
  }
}
