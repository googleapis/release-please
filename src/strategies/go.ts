// Copyright 2021 Google LLC
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

// Generic
import {Changelog} from '../updaters/changelog';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';
import {GithubImportsGo} from '../updaters/go/github-imports-go';
import {GoModUpdater} from '../updaters/go/go-mod';

export class Go extends BaseStrategy {
  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    updates.push({
      path: this.addPath('go.mod'),
      createIfMissing: false,
      updater: new GoModUpdater({
        version,
      }),
    });

    const goFiles = await this.github.findFilesByGlobAndRef(
      '**/*.go',
      this.changesBranch
    );

    // handle code snippets in markdown files as well
    const mdFiles = await this.github.findFilesByGlobAndRef(
      '**/*.md',
      this.changesBranch
    );

    for (const file of [...goFiles, ...mdFiles]) {
      updates.push({
        path: this.addPath(file),
        createIfMissing: true,
        updater: new GithubImportsGo({
          version,
          repository: this.repository,
        }),
      });
    }

    return updates;
  }
}
