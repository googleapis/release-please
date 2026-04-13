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

import {DefaultUpdater} from '../default';
import * as yaml from 'yaml';
import {logger as defaultLogger, Logger} from '../../util/logger';

export interface JavaModule {
  distribution_name_override: string;
  [key: string]: any;
}

export interface LibrarianLibrary {
  name: string;
  version: string;
  java: JavaModule;
  [key: string]: any;
}

export interface LibrarianYamlSchema {
  libraries: LibrarianLibrary[];
  [key: string]: any;
}

/**
 * Updates a librarian.yaml file.
 */
export class LibrarianYamlUpdater extends DefaultUpdater {
  specialArtifacts: ReadonlyMap<string, string> = new Map([
    ['google-cloud-java', 'google-cloud-java'],
  ]);
  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    if (!this.versionsMap) {
      logger.warn('missing versions map');
      return content;
    }

    // Use yaml package to make sure librarian.yaml is not reformatted because
    // we use different tool to format librarian.yaml.
    const doc = yaml.parseDocument(content);
    if (!doc || doc.errors.length > 0) {
      logger.warn('Invalid yaml, cannot be parsed');
      return content;
    }

    const libraries = doc.get('libraries');
    if (!libraries || !yaml.isSeq(libraries)) {
      return content;
    }

    let modified = false;
    for (const library of libraries.items) {
      if (!yaml.isMap(library)) continue;

      const artifactID = this.findArtifactID(
        library.toJSON() as LibrarianLibrary
      );
      if (this.versionsMap.has(artifactID)) {
        const newVersion = this.versionsMap.get(artifactID);
        if (newVersion && library.get('version') !== newVersion.toString()) {
          library.set('version', newVersion.toString());
          modified = true;
        }
      }
    }

    if (modified) {
      return doc.toString({lineWidth: 0});
    }
    return content;
  }

  findArtifactID(library: LibrarianLibrary): string {
    const artifact = this.specialArtifacts.get(library.name);
    if (artifact) {
      return artifact;
    }
    if (library.java && library.java.distribution_name_override) {
      return library.java.distribution_name_override.split(':')[1];
    }
    return `google-cloud-${library.name}`;
  }
}
