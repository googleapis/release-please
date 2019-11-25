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

import { Update, VersionsMap, UpdateOptions } from '../update';
import { GitHubFileContents } from '../../github';

const INLINE_UPDATE_REGEX = /{x-version-update:([\w\-_]+):(current|released)}/;
const BLOCK_START_REGEX = /{x-version-update-start:([\w\-_]+):(current|released)}/;
const BLOCK_END_REGEX = /{x-version-update-end}/;
const VERSION_REGEX = /\d+\.\d+\.\d+(-\w+)?(-SNAPSHOT)?/;

export class JavaUpdate implements Update {
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
    this.versions = new Map<string, string>();
    this.version = 'unused';
    this.packageName = 'unused';
    if (options.versions) {
      this.versions = options.versions;
    } else if (options.version) {
      this.versions.set(options.packageName, options.version);
      this.version = options.version;
      this.packageName = options.packageName;
    }
  }
  updateContent(content: string): string {
    const newLines: string[] = [];
    let blockPackageName: string | null = null;
    content.split(/\r?\n/).forEach(line => {
      let match = line.match(INLINE_UPDATE_REGEX);
      if (match) {
        const newVersion = this.versions!.get(match[1]);
        if (newVersion) {
          newLines.push(line.replace(VERSION_REGEX, newVersion));
        } else {
          newLines.push(line);
        }
      } else if (blockPackageName) {
        const newVersion = this.versions!.get(blockPackageName);
        if (newVersion) {
          newLines.push(line.replace(VERSION_REGEX, newVersion));
        } else {
          newLines.push(line);
        }
        if (line.match(BLOCK_END_REGEX)) {
          blockPackageName = null;
        }
      } else {
        match = line.match(BLOCK_START_REGEX);
        if (match) {
          blockPackageName = match[1];
        }
        newLines.push(line);
      }
    });
    return newLines.join('\n');
  }
}
