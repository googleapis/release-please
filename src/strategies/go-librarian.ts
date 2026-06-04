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

import {BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions} from './base';
import {Update} from '../update';
import {Changelog} from '../updaters/changelog';
import {LibrarianYamlUpdater} from '../updaters/librarian-yaml';
import {Version} from '../version';
import {VersionGo} from '../updaters/go/version-go';

export class GoLibrarian extends BaseStrategy {
  readonly versionFile: string;
  constructor(options: BaseStrategyOptions) {
    options.changelogPath = options.changelogPath ?? 'CHANGES.md';
    super(options);
    this.versionFile = options.versionFile ?? 'internal/version.go';
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    if (!this.skipChangelog) {
      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version,
          changelogEntry: options.changelogEntry,
        }),
      });
    }

    if (this.versionFile) {
      updates.push({
        path: this.addPath(this.versionFile),
        createIfMissing: false,
        updater: new VersionGo({
          version,
        }),
      });
    }

    updates.push({
      path: 'librarian.yaml',
      createIfMissing: false,
      updater: new LibrarianYamlUpdater({
        version,
        packagePath: this.path,
        component: this.component,
      }),
    });

    return updates;
  }

  protected initialReleaseVersion(): Version {
    if (this.initialVersion) {
      return Version.parse(this.initialVersion);
    }
    return Version.parse('1.0.0');
  }
}
