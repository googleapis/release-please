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

import {jsonStringify} from '../util/json-stringify';
import {Updater} from '../update';
import {ReleaserConfig, ManifestConfig} from '../manifest';

export class ReleasePleaseConfig implements Updater {
  path: string;
  config: ReleaserConfig;
  constructor(path: string, config: ReleaserConfig) {
    this.path = path;
    this.config = config;
  }
  updateContent(content: string): string {
    let parsed: ManifestConfig;
    if (content) {
      parsed = JSON.parse(content);
    } else {
      parsed = {packages: {}};
    }
    parsed.packages[this.path] = this.config;
    if (content) {
      return jsonStringify(parsed, content);
    } else {
      return JSON.stringify(parsed, null, 2);
    }
  }
}
