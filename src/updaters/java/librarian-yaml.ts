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

import {DefaultUpdater} from '../default';
import * as yaml from 'js-yaml';
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

    let parsed: LibrarianYamlSchema;
    try {
      parsed = yaml.load(content) as LibrarianYamlSchema;
    } catch (e) {
      logger.warn('Invalid yaml, cannot be parsed');
      return content;
    }

    if (!parsed || !parsed.libraries || !Array.isArray(parsed.libraries)) {
      return content;
    }

    let modified = false;
    for (const library of parsed.libraries) {
      const artifactID = this.findArtifactID(library);
      if (this.versionsMap.has(artifactID)) {
        const newVersion = this.versionsMap.get(artifactID);
        if (newVersion && library.version !== newVersion.toString()) {
          library.version = newVersion.toString();
          modified = true;
        }
      }
    }

    if (modified) {
      return yaml.dump(parsed);
    }
    return content;
  }

  findArtifactID(library: LibrarianLibrary): string {
      if (library.java && library.java.distribution_name_override) {
          return library.java.distribution_name_override.split(":")[1];
      }
      return `google-cloud-${library.name}`
  }
}
