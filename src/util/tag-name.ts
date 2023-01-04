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
  /^((?<component>.*)(?<separator>[^a-zA-Z0-9]))?(?<v>v)?(?<version>\d+\.\d+\.\d+.*)$/;
const DEFAULT_SEPARATOR = '-';

export class TagName {
  component?: string;
  version: Version;
  separator: string;
  includeV: boolean;

  constructor(
    version: Version,
    component?: string,
    separator: string = DEFAULT_SEPARATOR,
    includeV = true
  ) {
    this.version = version;
    this.component = component;
    this.separator = separator;
    this.includeV = includeV;
  }

  static parse(tagName: string): TagName | undefined {
    const match = tagName.match(TAG_PATTERN);
    if (match?.groups) {
      return new TagName(
        Version.parse(match.groups.version),
        match.groups.component,
        match.groups.separator,
        !!match.groups.v
      );
    }
    return;
  }

  toString(): string {
    if (this.component) {
      return `${this.component}${this.separator}${
        this.includeV ? 'v' : ''
      }${this.version.toString()}`;
    }
    return `${this.includeV ? 'v' : ''}${this.version.toString()}`;
  }
}
