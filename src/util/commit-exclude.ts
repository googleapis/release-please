// Copyright 2023 Google LLC
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
import {ReleaserConfig, ROOT_PROJECT_PATH} from '../manifest';
import {normalizePaths} from './commit-utils';

export type CommitExcludeConfig = Pick<ReleaserConfig, 'excludePaths'>;

export class CommitExclude {
  private excludePaths: Record<string, string[]> = {};

  constructor(config: Record<string, CommitExcludeConfig>) {
    Object.entries(config).forEach(([path, releaseConfig]) => {
      if (releaseConfig.excludePaths) {
        this.excludePaths[path] = normalizePaths(releaseConfig.excludePaths);
      }
    });
  }

  excludeCommits<T extends Commit>(
    commitsPerPath: Record<string, T[]>
  ): Record<string, T[]> {
    const filteredCommitsPerPath: Record<string, T[]> = {};
    Object.entries(commitsPerPath).forEach(([path, commits]) => {
      if (this.excludePaths[path]) {
        commits = commits.filter(commit =>
          this.shouldInclude(commit, this.excludePaths[path], path)
        );
      }
      filteredCommitsPerPath[path] = commits;
    });
    return filteredCommitsPerPath;
  }

  private shouldInclude(
    commit: Commit,
    excludePaths: string[],
    packagePath: string
  ): boolean {
    return (
      !commit.files ||
      !commit.files
        .filter(file => this.isRelevant(file, packagePath))
        .every(file => excludePaths.some(path => this.isRelevant(file, path)))
    );
  }

  private isRelevant(file: string, path: string) {
    return path === ROOT_PROJECT_PATH || file.indexOf(`${path}/`) === 0;
  }
}
