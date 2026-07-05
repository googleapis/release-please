// Copyright 2025 Google LLC
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

import {DefaultUpdater, UpdateOptions} from '../default';

interface ChangelogOptions extends UpdateOptions {
  changelogEntry: string;
  versionHeaderRegex?: string;
}

const DEFAULT_VERSION_HEADER_REGEX = '\n### v?[0-9[]';

export class News extends DefaultUpdater {
  changelogEntry: string;
  readonly versionHeaderRegex: RegExp;

  constructor(options: ChangelogOptions) {
    super(options);
    this.changelogEntry = options.changelogEntry;
    this.versionHeaderRegex = new RegExp(
      options.versionHeaderRegex ?? DEFAULT_VERSION_HEADER_REGEX,
      's'
    );
  }

  updateContent(content: string | undefined): string {
    content = content || '';
    const lastEntryIndex = content.search(this.versionHeaderRegex);
    if (lastEntryIndex === -1) {
      if (content) {
        return `${this.changelogEntry}\n\n${adjustHeaders(content).trim()}\n`;
      } else {
        return `${this.changelogEntry}\n`;
      }
    } else {
      const before = content.slice(0, lastEntryIndex);
      const after = content.slice(lastEntryIndex);
      return `${before}\n${this.changelogEntry}\n${after}`.trim() + '\n';
    }
  }
}

// Helper to increase markdown H1 headers to H2
function adjustHeaders(content: string): string {
  return content.replace(/^#(\s)/gm, '##$1');
}
