/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Update, UpdateOptions} from './update';

export class Changelog implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  packageName: string|undefined;
  create: boolean;

  constructor(options: UpdateOptions) { 
    this.create = true
    this.path = options.path;
    this.changelogEntry = options.changelogEntry;
    this.version = options.version;
    this.packageName = options.packageName;
  }
  updateContent(content: string): string {
    // the last entry looks something like ## v3.0.0.
    const lastEntryIndex = content.indexOf('\n## ');
    if (lastEntryIndex === -1) {
      return this.changelogEntry;
    } else {
      const before = content.slice(0, lastEntryIndex);
      const after = content.slice(lastEntryIndex);
      return `${before}\n${this.changelogEntry}\n${after}`;
    }
  }
  private header () {
    return `\
# Changelog
    
[npm history][1]

[1]: https://www.npmjs.com/package/${this.packageName}?activeTab=versions`;
  }
}
