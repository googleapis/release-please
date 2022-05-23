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

import {Version, VersionsMap} from '../../version';
import {BaseXml} from '../base-xml';
import * as xpath from 'xpath';

const XPATH_PROJECT_VERSION =
  '/*[local-name()="project"]/*[local-name()="version"]';
const XPATH_PROJECT_PARENT_VERSION =
  '/*[local-name()="project"]/*[local-name()="parent"]/*[local-name()="version"]';
const XPATH_PROJECT_DEPENDENCIES =
  '/*[local-name()="project"]/*[local-name()="dependencies"]/*[local-name()="dependency"]';
const XPATH_PROJECT_DEPENDENCY_MANAGEMENT_DEPENDENCIES =
  '/*[local-name()="project"]/*[local-name()="dependencyManagement"]/*[local-name()="dependencies"]/*[local-name()="dependency"]';

/**
 * Updates version pom.xml files.
 *
 * If present it updates project.version element.
 * If project.version is not present, it updates project.parent.version.
 */
export class PomXml extends BaseXml {
  private readonly version: Version;
  private readonly dependencyVersions?: VersionsMap;

  constructor(version: Version, dependencyVersions?: VersionsMap) {
    super();
    this.version = version;
    this.dependencyVersions = dependencyVersions;
  }

  protected updateDocument(document: Document): boolean {
    // NOTE this intentionally ignores namespaces - let the maven decide, what's valid and what's not

    const updates: {nodes: Node[]; version: Version}[] = [];

    // Update project.version
    const projectVersionNodes: Node[] = xpath.select(
      XPATH_PROJECT_VERSION,
      document
    ) as Node[];
    if (projectVersionNodes.length) {
      // If found update, detect actual change
      updates.push({
        nodes: projectVersionNodes,
        version: this.version,
      });
    } else {
      // Try updating project.parent.version
      const parentVersionNodes: Node[] = xpath.select(
        XPATH_PROJECT_PARENT_VERSION,
        document
      ) as Node[];
      updates.push({
        nodes: parentVersionNodes,
        version: this.version,
      });
    }

    if (this.dependencyVersions) {
      updates.push(
        ...this.dependencyUpdates(document, this.dependencyVersions)
      );
    }

    let updated = false;
    for (const {nodes, version} of updates) {
      updated = PomXml.updateNodes(nodes, version.toString()) || updated;
    }

    return updated;
  }

  dependencyUpdates(
    document: Document,
    updatedVersions: VersionsMap
  ): {name: string; nodes: Node[]; version: Version}[] {
    const updates: {name: string; nodes: Node[]; version: Version}[] = [];
    const dependencyNodes = xpath.select(
      XPATH_PROJECT_DEPENDENCIES,
      document
    ) as Node[];
    const dependencyManagementNodes = xpath.select(
      XPATH_PROJECT_DEPENDENCY_MANAGEMENT_DEPENDENCIES,
      document
    ) as Node[];
    // try to update dependency versions
    for (const [name, version] of updatedVersions.entries()) {
      // look under:
      // - project/dependencies
      // - project/dependencyManagement/dependencies
      const [groupId, artifactId] = name.split(':');
      for (const nodeGroup of [dependencyNodes, dependencyManagementNodes]) {
        const nodes = nodeGroup.reduce<Node[]>((collection, node) => {
          const dependencyNode = parseDependencyNode(node);
          if (
            dependencyNode.groupId === groupId &&
            dependencyNode.artifactId === artifactId &&
            dependencyNode.version !== version.toString() &&
            dependencyNode.versionNode
          ) {
            collection.push(dependencyNode.versionNode);
          }
          return collection;
        }, []);
        if (nodes.length) {
          updates.push({
            name,
            nodes,
            version,
          });
        }
      }
    }
    return updates;
  }

  private static updateNodes(nodes: Node[], value: string): boolean {
    const toUpdate = nodes.filter(node => node.textContent !== value);
    toUpdate.forEach(node => (node.textContent = value));
    return toUpdate.length > 0;
  }
}

interface DependencyNode {
  groupId: string;
  artifactId: string;
  version?: string;
  scope?: string;
  versionNode?: Node;
}

export function parseDependencyNode(node: Node): DependencyNode {
  let groupId = '';
  let artifactId = '';
  let scope: string | undefined;
  let version: string | undefined;
  let versionNode: Node | undefined;
  for (let i = 0; i < node.childNodes.length; i++) {
    const childNode = node.childNodes.item(i);
    if (childNode.nodeName === 'groupId') {
      groupId = childNode.firstChild?.textContent || '';
    } else if (childNode.nodeName === 'artifactId') {
      artifactId = childNode.firstChild?.textContent || '';
    } else if (childNode.nodeName === 'scope') {
      scope = childNode.firstChild?.textContent || '';
    } else if (childNode.nodeName === 'version') {
      version = childNode.firstChild?.textContent || '';
      versionNode = childNode;
    }
  }

  return {
    groupId,
    artifactId,
    scope,
    version,
    versionNode,
  };
}
