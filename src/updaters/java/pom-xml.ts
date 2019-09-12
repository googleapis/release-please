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

import { Update, UpdateOptions, VersionsMap } from '../update';
import { GitHubFileContents } from '../../github';

export class PomXML implements Update {
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
    this.versions = new Map<string,string>();
    if (options.versions) {
      this.versions = options.versions;
    } else if (options.version) {
      this.versions.set(options.packageName, options.version);
    }
    this.version = 'unused';
    this.packageName = 'unused';
  }
  updateContent(content: string): string {
    let newContent = content;
    this.versions!.forEach((version, packageName) => {
      newContent = this.updateSingleVersion(content, packageName, version);
    });
    return newContent;
  }
  updateSingleVersion(content: string, packageName: string, version: string): string {
    console.log('replacing', packageName, version);
    return content.replace(
      new RegExp(`<version>.*</version>(.*x-version-update:${packageName}:.*)`, 'g'),
      `<version>${version}</version>$1`
    );
  }
}
