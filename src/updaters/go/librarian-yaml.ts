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

import {DefaultUpdater, UpdateOptions} from '../default';
import * as yaml from 'yaml';
import {logger as defaultLogger, Logger} from '../../util/logger';

export interface LibrarianLibrary {
  name: string;
  version: string;
  [key: string]: any;
}

export interface LibrarianUpdateOptions extends UpdateOptions {
  packagePath: string;
  component?: string;
}

/**
 * Updates a librarian.yaml file for Go.
 */
export class LibrarianYamlUpdater extends DefaultUpdater {
  private readonly packagePath: string;
  private readonly component?: string;

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
    // Use yaml package to make sure librarian.yaml is not reformatted because
    // we use different tool to format librarian.yaml.
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
      if (
        libraryJSON.name === this.packagePath ||
        (this.component && libraryJSON.name === this.component)
      ) {
        const newVersion = this.version.toString();
        if (library.get('version') !== newVersion) {
          library.set('version', newVersion);
          modified = true;
        }
      }
    }

    if (modified) {
      return doc.toString({lineWidth: 0});
    }
    return content;
  }
}
