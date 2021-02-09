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

import {checkpoint, CheckpointType} from '../../util/checkpoint';
import {Update, UpdateOptions, VersionsMap} from '../update';
import {GitHubFileContents} from '../../github';
import * as yaml from 'js-yaml';

export class ChartYaml implements Update {
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
    const data = yaml.load(content, {json: true});
    if (data === null || data === undefined) {
      return '';
    }
    const parsed = JSON.parse(JSON.stringify(data));
    checkpoint(
      `updating ${this.path} from ${parsed.version} to ${this.version}`,
      CheckpointType.Success
    );
    parsed.version = this.version;
    return yaml.dump(parsed);
  }
}
