// Copyright 2019 Google LLC
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

import {JavaUpdate} from './java-update';
import {VersionsMap, Version} from '../../version';
import {logger as defaultLogger, Logger} from '../../util/logger';

/**
 * Updates a versions.txt file which contains current versions of
 * components within a Java repo.
 * @see https://github.com/googleapis/java-asset/blob/main/versions.txt
 */
export class VersionsManifest extends JavaUpdate {
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
    let newContent = content;
    this.versionsMap.forEach((version, packageName) => {
      newContent = this.updateSingleVersion(
        newContent,
        packageName,
        version.toString()
      );
    });
    return newContent;
  }
  protected updateSingleVersion(
    content: string,
    packageName: string,
    version: string
  ): string {
    const newLines: string[] = [];
    content.split(/\r?\n/).forEach(line => {
      if (version.includes('SNAPSHOT')) {
        newLines.push(
          line.replace(
            new RegExp(`^${packageName}:(.*):(.*)`, 'g'),
            `${packageName}:$1:${version}`
          )
        );
      } else {
        newLines.push(
          line.replace(
            new RegExp(`^${packageName}:(.*):(.*)`, 'g'),
            `${packageName}:${version}:${version}`
          )
        );
      }
    });
    return newLines.join('\n');
  }

  static parseVersions(content: string): VersionsMap {
    const versions = new Map<string, Version>();
    content.split(/\r?\n/).forEach(line => {
      const match = line.match(/^([\w\-_]+):([^:]+):([^:]+)/);
      if (match) {
        versions.set(match[1], Version.parse(match[2]));
      }
    });
    return versions;
  }

  static needsSnapshot(content: string): boolean {
    return !content.split(/\r?\n/).some(line => {
      return !!line.match(/^[\w\-_]+:.+:.+-SNAPSHOT/);
    });
  }
}
