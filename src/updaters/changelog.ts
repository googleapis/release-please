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

import { checkpoint, CheckpointType } from '../util/checkpoint';
import { Update, UpdateOptions, VersionsMap } from './update';
import { GitHubFileContents } from '../github';

export class Changelog implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  versions?: VersionsMap;
  packageName: string;
  create: boolean;
  contents?: GitHubFileContents;

  constructor(options: UpdateOptions) {
    this.create = true;
    this.path = options.path;
    this.changelogEntry = options.changelogEntry;
    this.version = options.version;
    this.packageName = options.packageName;
  }

  updateContent(content: string | undefined): string {
    content = content || '';
    // Handle both H2 (features/BREAKING CHANGES) and H3 (fixes).
    const lastEntryIndex = content.search(/\n###? v?[0-9[]/s);
    if (lastEntryIndex === -1) {
      checkpoint(`${this.path} not found`, CheckpointType.Failure);
      checkpoint(`creating ${this.path}`, CheckpointType.Success);
      return `${this.header()}\n${this.changelogEntry}\n`;
    } else {
      checkpoint(`updating ${this.path}`, CheckpointType.Success);
      const before = content.slice(0, lastEntryIndex);
      const after = content.slice(lastEntryIndex);
      return `${before}\n${this.changelogEntry}\n${after}`.trim() + '\n';
    }
  }
  private header() {
    return `\
# Changelog
`;
  }
}
