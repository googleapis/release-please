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

export class SamplesPackageJson implements Update {
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
  }
  updateContent(content: string): string {
    const parsed = JSON.parse(content);
    if (!parsed.dependencies || !parsed.dependencies[this.packageName]) {
      return content;
    }
    checkpoint(
      `updating ${this.packageName} dependency in ${this.path} from ${
        parsed.dependencies[this.packageName]
      } to ^${this.version}`,
      CheckpointType.Success
    );
    parsed.dependencies[this.packageName] = `^${this.version}`;
    return JSON.stringify(parsed, null, 2) + '\n';
  }
}
