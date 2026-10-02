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
    const directories = new Set(Object.keys(splitCommits));
    const lowerToDirectory = new Map<string, string>();
    for (const dir of directories) {
      lowerToDirectory.set(dir.toLowerCase(), dir);
    }
    for (const directory of directories) {
      const filtered = splitCommits[directory].filter(commit => {
        if (!commit.scope) {
          return true;
        }
        const matchedDir = lowerToDirectory.get(commit.scope.toLowerCase());
        return !matchedDir || matchedDir === directory;
      });
      if (filtered.length > 0) {
        splitCommits[directory] = filtered;
      } else if (splitCommits[directory].length > 0) {
        const baseCommit = splitCommits[directory][0];
        splitCommits[directory] = [
          {
            ...baseCommit,
            message: `feat(${directory}): update API sources and regenerate`,
            type: 'feat',
            scope: directory,
            bareMessage: 'update API sources and regenerate',
            notes: [],
            references: [],
            breaking: false,
          },
        ];
      }
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
