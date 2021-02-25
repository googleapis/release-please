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

import {Update, UpdateOptions, VersionsMap} from './update';
import {GitHubFileContents} from '../github';

export class ReleasePleaseManifest implements Update {
  path: string;
  changelogEntry = '';
  version = '';
  versions?: VersionsMap;
  packageName = '';
  create = false;
  contents?: GitHubFileContents;

  constructor(options: UpdateOptions) {
    this.path = options.path;
    this.versions = options.versions;
    this.contents = options.contents;
  }

  updateContent(content: string): string {
    const parsed: Record<string, string> = JSON.parse(content);
    for (const [path, version] of this.versions!) {
      parsed[path] = version;
    }
    return JSON.stringify(parsed, Object.keys(parsed).sort(), 2) + '\n';
  }
}
