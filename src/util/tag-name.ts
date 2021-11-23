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

import {Version} from '../version';

const TAG_PATTERN =
  /^((?<component>.*)(?<separator>[^a-zA-Z]))?v(?<version>\d+\.\d+\.\d+.*)$/;
const DEFAULT_SEPARATOR = '-';

export class TagName {
  component?: string;
  version: Version;
  separator: string;

  constructor(
    version: Version,
    component?: string,
    separator: string = DEFAULT_SEPARATOR
  ) {
    this.version = version;
    this.component = component;
    this.separator = separator;
  }

  static parse(tagName: string): TagName | undefined {
    const match = tagName.match(TAG_PATTERN);
    if (match?.groups) {
      return new TagName(
        Version.parse(match.groups.version),
        match.groups.component,
        match.groups.separator
      );
    }
    return;
  }

  toString(): string {
    if (this.component) {
      return `${this.component}${this.separator}v${this.version.toString()}`;
    }
    return `v${this.version.toString()}`;
  }
}
