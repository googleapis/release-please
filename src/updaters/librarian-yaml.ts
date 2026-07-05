// Copyright 2026 Google LLC
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

import {DefaultUpdater, UpdateOptions} from './default';
import * as yaml from 'yaml';
import {logger as defaultLogger, Logger} from '../util/logger';
import {Version} from '../version';

export interface JavaModule {
  artifact_id: string;
  [key: string]: any;
}

export interface PreviewModule {
  version: string;
  [key: string]: any;
}

export interface LibrarianLibrary {
  name: string;
  version: string;
  output?: string;
  java?: JavaModule;
  preview?: PreviewModule;
  [key: string]: any;
}

export interface LibrarianYamlSchema {
  libraries: LibrarianLibrary[];
  [key: string]: any;
}

export interface LibrarianUpdateOptions extends UpdateOptions {
  packagePath?: string;
  component?: string;
}

/**
 * Updates a librarian.yaml file.
 */
export class LibrarianYamlUpdater extends DefaultUpdater {
  private readonly packagePath?: string;
  private readonly component?: string;

  private readonly specialArtifacts: ReadonlyMap<string, string> = new Map([
    ['google-cloud-java', 'google-cloud-java'],
  ]);

  constructor(options: LibrarianUpdateOptions) {
    super(options);
    this.packagePath = options.packagePath;
    this.component = options.component;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, _logger: Logger = defaultLogger): string {
    const doc = yaml.parseDocument(content);
    if (!doc || doc.errors.length > 0) {
      throw new Error(
        `Invalid yaml, cannot be parsed: ${doc.errors
          .map(e => e.message)
          .join(', ')}`
      );
    }

    const libraries = doc.get('libraries');
    if (!libraries || !yaml.isSeq(libraries)) {
      return content;
    }

    let modified = false;
    for (const library of libraries.items) {
      if (!yaml.isMap(library)) continue;

      const libraryJSON = library.toJSON() as LibrarianLibrary;
      let newVersion: Version | undefined = undefined;

      let isPreview = false;
      if (this.versionsMap) {
        // Multi-version (Java style)
        const artifactID = this.findArtifactID(libraryJSON);
        if (this.versionsMap.has(artifactID)) {
          newVersion = this.versionsMap.get(artifactID);
        }
      } else {
        // Single version (Go, Python, Node style)
        const isGoPreviewMatch =
          this.packagePath &&
          this.packagePath === `preview/internal/${libraryJSON.name}`;

        const isPythonPreviewMatch =
          this.packagePath &&
          this.packagePath === `preview-packages/${libraryJSON.name}`;

        if (isGoPreviewMatch || isPythonPreviewMatch) {
          isPreview = true;
          newVersion = this.version;
        } else {
          const isGoMatch =
            (this.packagePath && libraryJSON.name === this.packagePath) ||
            ((!this.packagePath || this.packagePath === '.') &&
              this.component &&
              libraryJSON.name === this.component);

          const isPythonNodeMatch =
            this.packagePath &&
            this.deriveOutputDirectory(libraryJSON) === this.packagePath;

          if (isGoMatch || isPythonNodeMatch) {
            newVersion = this.version;
          }
        }
      }

      if (newVersion) {
        const newVersionStr = newVersion.toString();
        if (isPreview) {
          const previewNode = this.getOrCreateSubsection(
            library,
            'preview',
            doc
          );
          if (this.updateValue(previewNode, 'version', newVersionStr)) {
            modified = true;
          }
        } else {
          if (this.updateValue(library, 'version', newVersionStr)) {
            modified = true;
          }
          if (this.versionsMap) {
            // Multi-version (Java style): updates released_version for non-SNAPSHOTs
            const isSnapshot = !!newVersion.preRelease?.includes('SNAPSHOT');
            if (!isSnapshot) {
              const javaNode = this.getOrCreateSubsection(library, 'java', doc);
              if (
                this.updateValue(javaNode, 'released_version', newVersionStr)
              ) {
                modified = true;
              }
            }
          }
        }
      }
    }

    if (modified) {
      return doc.toString({lineWidth: 0});
    }
    return content;
  }

  private deriveOutputDirectory(library: LibrarianLibrary): string {
    if (library.output) {
      return library.output;
    }
    return `packages/${library.name}`;
  }

  private findArtifactID(library: LibrarianLibrary): string {
    const artifact = this.specialArtifacts.get(library.name);
    if (artifact) {
      return artifact;
    }
    if (library.java && library.java.artifact_id) {
      return library.java.artifact_id;
    }
    return `google-cloud-${library.name}`;
  }

  private getOrCreateSubsection(
    parent: yaml.YAMLMap,
    key: string,
    doc: yaml.Document
  ): yaml.YAMLMap {
    let section = parent.get(key);
    if (!yaml.isMap(section)) {
      section = doc.createNode({});
      parent.set(key, section);
    }
    return section as yaml.YAMLMap;
  }

  private updateValue(node: yaml.YAMLMap, key: string, value: string): boolean {
    if (node.get(key) !== value) {
      node.set(key, value);
      return true;
    }
    return false;
  }
}
