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

import {Version} from '../../version';
import {BaseXml} from '../base-xml';
import * as xpath from 'xpath';

const XPATH_PROJECT_VERSION =
  '/*[local-name()="project"]/*[local-name()="version"]';
const XPATH_PROJECT_PARENT_VERSION =
  '/*[local-name()="project"]/*[local-name()="parent"]/*[local-name()="version"]';

/**
 * Updates version pom.xml files.
 *
 * If present it updates project.version element.
 * If project.version is not present, it updates project.parent.version.
 */
export class PomXml extends BaseXml {
  private readonly version: Version;

  constructor(version: Version) {
    super();
    this.version = version;
  }

  protected updateDocument(document: Document): boolean {
    const version = this.version.toString();

    // NOTE this intentionally ignores namespaces - let the maven decide, what's valid and what's not

    // Update project.version
    const projectVersionNodes: Node[] = xpath.select(
      XPATH_PROJECT_VERSION,
      document
    ) as Node[];
    if (projectVersionNodes.length) {
      // If found update, detect actual change
      return PomXml.updateNodes(projectVersionNodes, version);
    }

    // Try updating project.parent.version
    const parentVersionNodes: Node[] = xpath.select(
      XPATH_PROJECT_PARENT_VERSION,
      document
    ) as Node[];
    return PomXml.updateNodes(parentVersionNodes, version);
  }

  private static updateNodes(nodes: Node[], value: string): boolean {
    const toUpdate = nodes.filter(node => node.textContent !== value);
    toUpdate.forEach(node => (node.textContent = value));
    return toUpdate.length > 0;
  }
}
