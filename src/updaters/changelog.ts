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

import {DefaultUpdater, UpdateOptions} from './default';

interface ChangelogOptions extends UpdateOptions {
  changelogEntry: string;
}

export class Changelog extends DefaultUpdater {
  changelogEntry: string;

  constructor(options: ChangelogOptions) {
    super(options);
    this.changelogEntry = options.changelogEntry;
  }

  updateContent(content: string | undefined): string {
    content = content || '';
    // Handle both H2 (features/BREAKING CHANGES) and H3 (fixes).
    const lastEntryIndex = content.search(/\n###? v?[0-9[]/s);
    if (lastEntryIndex === -1) {
      return `${this.header()}\n${this.changelogEntry}\n`;
    } else {
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
