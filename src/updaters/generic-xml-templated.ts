// Copyright 2024 Google LLC
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

import {Updater} from '../update';
import {DOMParser, XMLSerializer} from '@xmldom/xmldom';
import xpath from 'xpath';
import {logger as defaultLogger, Logger} from '../util/logger';

/**
 * Updates an XML file with a templated string value.
 * Unlike GenericXml, this replaces the entire value with the templated string.
 */
export class GenericXmlTemplated implements Updater {
  readonly xpath: string;
  readonly value: string;

  constructor(xpath: string, value: string) {
    this.xpath = xpath;
    this.value = value;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const document = new DOMParser().parseFromString(content, 'text/xml');
    const nodes = xpath.select(this.xpath, document);
    let modified = false;

    if (Array.isArray(nodes)) {
      for (const node of nodes) {
        if (node && 'textContent' in node) {
          (node as any).textContent = this.value;
          modified = true;
        }
      }
    }

    if (!modified) {
      logger.warn(`No entries modified in ${this.xpath}`);
      return content;
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(document);
  }
}
