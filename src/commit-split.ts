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

import { Commit } from './graphql-to-commits';
import { relative } from 'path';

interface CommitSplitOptions {
  root?: string;
}

export class CommitSplit {
  root: string;
  constructor(opts?: CommitSplitOptions) {
    opts = opts || {};
    this.root = opts.root || './';
  }
  split(commits: Commit[]): { [key: string]: Commit[] } {
    const splitCommits: { [key: string]: Commit[] } = {};
    commits.forEach((commit: Commit) => {
      const dedupe: Set<string> = new Set();
      for (let i = 0; i < commit.files.length; i++) {
        const file: string = commit.files[i];
        const splitPath = relative(this.root, file).split(/[/\\]/);
        // indicates that we have a top-level file and not a folder
        // in this edge-case we should not attempt to update the path.
        if (splitPath.length === 1) continue;
        const pkgName = splitPath[0];
        if (dedupe.has(pkgName)) continue;
        else dedupe.add(pkgName);
        if (!splitCommits[pkgName]) splitCommits[pkgName] = [];
        splitCommits[pkgName].push(commit);
      }
    });
    return splitCommits;
  }
}
