"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDependencyNode = exports.PomXml = void 0;
const base_xml_1 = require("../base-xml");
const xpath = require("xpath");
const XPATH_PROJECT_VERSION = '/*[local-name()="project"]/*[local-name()="version"]';
const XPATH_PROJECT_PARENT_VERSION = '/*[local-name()="project"]/*[local-name()="parent"]/*[local-name()="version"]';
const XPATH_PROJECT_DEPENDENCIES = '/*[local-name()="project"]/*[local-name()="dependencies"]/*[local-name()="dependency"]';
const XPATH_PROJECT_DEPENDENCY_MANAGEMENT_DEPENDENCIES = '/*[local-name()="project"]/*[local-name()="dependencyManagement"]/*[local-name()="dependencies"]/*[local-name()="dependency"]';
/**
 * Updates version pom.xml files.
 *
 * If present it updates project.version element.
 * If project.version is not present, it updates project.parent.version.
 */
class PomXml extends base_xml_1.BaseXml {
    constructor(version, dependencyVersions) {
        super();
        this.version = version;
        this.dependencyVersions = dependencyVersions;
    }
    updateDocument(document) {
        // NOTE this intentionally ignores namespaces - let the maven decide, what's valid and what's not
        const updates = [];
        // Update project.version
        const projectVersionNodes = xpath.select(XPATH_PROJECT_VERSION, document);
        if (projectVersionNodes.length) {
            // If found update, detect actual change
            updates.push({
                nodes: projectVersionNodes,
                version: this.version,
            });
        }
        else {
            // Try updating project.parent.version
            const parentVersionNodes = xpath.select(XPATH_PROJECT_PARENT_VERSION, document);
            updates.push({
                nodes: parentVersionNodes,
                version: this.version,
            });
        }
        if (this.dependencyVersions) {
            updates.push(...this.dependencyUpdates(document, this.dependencyVersions));
        }
        let updated = false;
        for (const { nodes, version } of updates) {
            updated = PomXml.updateNodes(nodes, version.toString()) || updated;
        }
        return updated;
    }
    dependencyUpdates(document, updatedVersions) {
        const updates = [];
        const dependencyNodes = xpath.select(XPATH_PROJECT_DEPENDENCIES, document);
        const dependencyManagementNodes = xpath.select(XPATH_PROJECT_DEPENDENCY_MANAGEMENT_DEPENDENCIES, document);
        // try to update dependency versions
        for (const [name, version] of updatedVersions.entries()) {
            // look under:
            // - project/dependencies
            // - project/dependencyManagement/dependencies
            const [groupId, artifactId] = name.split(':');
            for (const nodeGroup of [dependencyNodes, dependencyManagementNodes]) {
                const nodes = nodeGroup.reduce((collection, node) => {
                    const dependencyNode = parseDependencyNode(node);
                    if (dependencyNode.groupId === groupId &&
                        dependencyNode.artifactId === artifactId &&
                        dependencyNode.version !== version.toString() &&
                        dependencyNode.versionNode) {
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
    static updateNodes(nodes, value) {
        const toUpdate = nodes.filter(node => node.textContent !== value);
        toUpdate.forEach(node => (node.textContent = value));
        return toUpdate.length > 0;
    }
}
exports.PomXml = PomXml;
function parseDependencyNode(node) {
    var _a, _b, _c, _d;
    let groupId = '';
    let artifactId = '';
    let scope;
    let version;
    let versionNode;
    for (let i = 0; i < node.childNodes.length; i++) {
        const childNode = node.childNodes.item(i);
        if (childNode.nodeName === 'groupId') {
            groupId = ((_a = childNode.firstChild) === null || _a === void 0 ? void 0 : _a.textContent) || '';
        }
        else if (childNode.nodeName === 'artifactId') {
            artifactId = ((_b = childNode.firstChild) === null || _b === void 0 ? void 0 : _b.textContent) || '';
        }
        else if (childNode.nodeName === 'scope') {
            scope = ((_c = childNode.firstChild) === null || _c === void 0 ? void 0 : _c.textContent) || '';
        }
        else if (childNode.nodeName === 'version') {
            version = ((_d = childNode.firstChild) === null || _d === void 0 ? void 0 : _d.textContent) || '';
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
exports.parseDependencyNode = parseDependencyNode;
//# sourceMappingURL=pom-xml.js.map