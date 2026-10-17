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

import {PHPYoshi} from './php-yoshi';
import {BuildUpdatesOptions} from './base';
import {ConventionalCommit} from '../commit';
import {Update} from '../update';
import {LibrarianYamlUpdater} from '../updaters/librarian-yaml';

export class PHPLibrarian extends PHPYoshi {
  protected splitCommits(
    commits: ConventionalCommit[]
  ): Record<string, ConventionalCommit[]> {
    const splitCommits = super.splitCommits(commits);
    const shaToDirectories = new Map<string, Map<string, string>>();
    for (const [directory, dirCommits] of Object.entries(splitCommits)) {
      for (const commit of dirCommits) {
        let lowerToDir = shaToDirectories.get(commit.sha);
        if (!lowerToDir) {
          lowerToDir = new Map<string, string>();
          shaToDirectories.set(commit.sha, lowerToDir);
        }
        lowerToDir.set(directory.toLowerCase(), directory);
      }
    }

    for (const [directory, dirCommits] of Object.entries(splitCommits)) {
      const commitsBySha = new Map<string, ConventionalCommit[]>();
      for (const commit of dirCommits) {
        let group = commitsBySha.get(commit.sha);
        if (!group) {
          group = [];
          commitsBySha.set(commit.sha, group);
        }
        group.push(commit);
      }

      const result: ConventionalCommit[] = [];
      for (const [sha, group] of commitsBySha.entries()) {
        const lowerToDir = shaToDirectories.get(sha)!;
        const filtered = group.filter(commit => {
          if (!commit.scope) {
            return true;
          }
          const matchedDir = lowerToDir.get(commit.scope.toLowerCase());
          return !matchedDir || matchedDir === directory;
        });
        result.push(...(filtered.length > 0 ? filtered : group));
      }
      splitCommits[directory] = result;
    }
    return splitCommits;
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates = await super.buildUpdates(options);

    // Update librarian.yaml if this package exists within it.
    updates.push({
      path: 'librarian.yaml',
      createIfMissing: false,
      updater: new LibrarianYamlUpdater({
        version: options.newVersion,
        packagePath: this.path,
      }),
    });

    return updates;
  }
}
