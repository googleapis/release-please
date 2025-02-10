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

import {indentCommit} from '../util/indent-commit';

// Generic
import {Changelog} from '../updaters/changelog';

// Ruby
import {VersionRB} from '../updaters/ruby/version-rb';
import {GemfileLock} from '../updaters/ruby/gemfile-lock';
import {BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions} from './base';
import {ConventionalCommit} from '../commit';
import {Update} from '../update';

export class Ruby extends BaseStrategy {
  readonly versionFile: string;
  constructor(options: BaseStrategyOptions) {
    super(options);
    this.versionFile = options.versionFile ?? '';
    this.tagSeparator = '/';
  }

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

    const versionFile: string = this.versionFile
      ? this.versionFile
      : `lib/${(this.component || '').replace(/-/g, '/')}/version.rb`;

    updates.push({
      path: this.addPath(versionFile),
      createIfMissing: false,
      updater: new VersionRB({
        version,
      }),
    });

    updates.push({
      path: `rbi/${versionFile}i`,
      createIfMissing: false,
      updater: new VersionRB({
        version,
      }),
    });

    updates.push({
      path: `sig/${versionFile}s`,
      createIfMissing: false,
      updater: new VersionRB({
        version,
      }),
    });

    updates.push({
      path: this.addPath('Gemfile.lock'),
      createIfMissing: false,
      updater: new GemfileLock({
        version,
        gemName:
          this.component ||
          // grab the gem name from the version file path if it's not provided via the component
          this.versionFile.match(/lib\/(.*)\/version.rb/)?.[1] ||
          '',
      }),
    });

    return updates;
  }

  protected async postProcessCommits(
    commits: ConventionalCommit[]
  ): Promise<ConventionalCommit[]> {
    commits.forEach(commit => {
      commit.message = indentCommit(commit);
    });
    return commits;
  }
}
