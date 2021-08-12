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

import {Update, UpdateOptions, VersionsMap} from '../update';
import {GitHubFileContents} from '../../github';
import {logger} from '../../util/logger';

export class KRMBlueprintVersion implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  versions?: VersionsMap;
  packageName: string;
  create: boolean;
  contents?: GitHubFileContents;

  constructor(options: UpdateOptions) {
    this.create = false;
    this.path = options.path;
    this.changelogEntry = options.changelogEntry;
    this.version = options.version;
    this.packageName = options.packageName;
    this.versions = options.versions;
  }
  updateContent(content: string): string {
    // js-yaml(and kpt TS SDK) does not preserve comments hence regex match
    // match starting cnrm/ ending with semver to prevent wrong updates like pinned config.kubernetes.io/function
    let matchRegex = '(cnrm/.*/)(v[0-9]+.[0-9]+.[0-9]+)+(-w+)?';
    // if explicit previous version, match only that version
    if (this.versions?.has('previousVersion')) {
      matchRegex = `(cnrm/.*/)(${this.versions.get('previousVersion')})+(-w+)?`;
    }
    const oldVersion = content.match(new RegExp(matchRegex));

    if (oldVersion) {
      logger.info(
        `updating ${this.path} from ${oldVersion[2]} to v${this.version}`
      );
    }
    const newVersion = content.replace(
      new RegExp(matchRegex, 'g'),
      `$1v${this.version}`
    );
    return newVersion;
  }
}
