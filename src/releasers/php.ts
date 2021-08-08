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

import {ReleasePR, ReleaseCandidate, PackageName} from '../release-pr';
import {Update, VersionsMap} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';
// PHP Specific.
import {RootComposerUpdatePackage} from '../updaters/root-composer-update-package';
import {ReleasePRConstructorOptions} from '..';

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

export class PHP extends ReleasePR {
  constructor(options: ReleasePRConstructorOptions) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    super(options);
    this.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
  }

  protected async buildUpdates(
    changelogEntry: string,
    candidate: ReleaseCandidate,
    packageName: PackageName
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const versions: VersionsMap = new Map<string, string>();
    versions.set('version', candidate.version);
    // update composer.json
    updates.push(
      new RootComposerUpdatePackage({
        path: 'composer.json',
        changelogEntry,
        version: candidate.version,
        versions: versions,
        packageName: packageName.name,
      })
    );

    // update Changelog
    updates.push(
      new Changelog({
        path: this.changelogPath,
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    return updates;
  }
}
