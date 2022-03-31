// Copyright 2022 Google LLC
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
import {BaseXml} from './base-xml';
import * as xpath from 'xpath';

export class GenericXml extends BaseXml {
  private readonly xpath: string;
  private readonly version: Version;

  constructor(xpath: string, version: Version) {
    super();
    this.xpath = xpath;
    this.version = version;
  }

  protected updateDocument(document: Document): boolean {
    const version = this.version.toString();
    let updated = false;
    for (const node of xpath.select(this.xpath, document) as Node[]) {
      if (node.textContent !== version) {
        node.textContent = version;
        updated = true;
      }
    }
    return updated;
  }
}
