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
import {Update} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';
import {ReleasePRConstructorOptions} from '..';

const DEFAULT_CHANGELOG_PATH = 'CHANGES.md';

export class Go extends ReleasePR {
  constructor(options: ReleasePRConstructorOptions) {
    super(options);
    this.changelogPath = options.changelogPath ?? DEFAULT_CHANGELOG_PATH;
  }

  protected async buildUpdates(
    changelogEntry: string,
    candidate: ReleaseCandidate,
    packageName: PackageName
  ): Promise<Update[]> {
    const updates: Update[] = [];

    updates.push(
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    return updates;
  }
}
