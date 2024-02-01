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
// PHP Specific.
import {RootComposerUpdatePackages} from '../updaters/php/root-composer-update-packages';
import {BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions} from './base';
import {DefaultUpdater} from '../updaters/default';
import {Update} from '../update';
import {VersionsMap} from '../version';

const CHANGELOG_SECTIONS = [
  {type: 'feat', section: 'Features'},
  {type: 'fix', section: 'Bug Fixes'},
  {type: 'perf', section: 'Performance Improvements'},
  {type: 'revert', section: 'Reverts'},
  {type: 'chore', section: 'Miscellaneous Chores'},
  {type: 'docs', section: 'Documentation', hidden: true},
  {type: 'style', section: 'Styles', hidden: true},
  {type: 'refactor', section: 'Code Refactoring', hidden: true},
  {type: 'test', section: 'Tests', hidden: true},
  {type: 'build', section: 'Build System', hidden: true},
  {type: 'ci', section: 'Continuous Integration', hidden: true},
];

export class PHP extends BaseStrategy {
  constructor(options: BaseStrategyOptions) {
    options.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
    super(options);
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;
    const versionsMap: VersionsMap = new Map();

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    // update composer.json
    updates.push({
      path: this.addPath('composer.json'),
      createIfMissing: false,
      updater: new RootComposerUpdatePackages({
        version,
        versionsMap,
      }),
    });

    // update VERSION file
    updates.push({
      path: this.addPath('VERSION'),
      createIfMissing: false,
      updater: new DefaultUpdater({
        version,
      }),
    });

    return updates;
  }
}
