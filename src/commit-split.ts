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

import {Commit} from './graphql-to-commits';
import {relative} from 'path';

export interface CommitSplitOptions {
  // Defaults to './'
  root?: string;
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
  packagePaths?: string[];
}

export class CommitSplit {
  root: string;
  includeEmpty: boolean;
  packagePaths?: string[];
  constructor(opts?: CommitSplitOptions) {
    opts = opts || {};
    this.root = opts.root || './';
    this.includeEmpty = !!opts.includeEmpty;
    if (opts.packagePaths) {
      const paths: string[] = [];
      for (let newPath of opts.packagePaths) {
        newPath = newPath.replace(/[/\\]$/, '');
        for (const exPath of paths) {
          if (newPath.indexOf(exPath) >= 0 || exPath.indexOf(newPath) >= 0) {
            throw new Error(
              `Path prefixes must be unique: ${newPath}, ${exPath}`
            );
          }
        }
        paths.push(newPath);
      }
      this.packagePaths = paths;
    }
  }

  split(commits: Commit[]): {[key: string]: Commit[]} {
    const splitCommits: {[key: string]: Commit[]} = {};
    commits.forEach((commit: Commit) => {
      const dedupe: Set<string> = new Set();
      for (let i = 0; i < commit.files.length; i++) {
        const file: string = commit.files[i];
        const path = relative(this.root, file);
        const splitPath = path.split(/[/\\]/);
        // indicates that we have a top-level file and not a folder
        // in this edge-case we should not attempt to update the path.
        if (splitPath.length === 1) continue;

        let pkgName;
        if (this.packagePaths) {
          // only track paths under this.packagePaths
          pkgName = this.packagePaths.find(p => path.indexOf(p) >= 0);
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
        for (const pkgName in splitCommits) {
          splitCommits[pkgName].push(commit);
        }
      }
    });
    return splitCommits;
  }
}
