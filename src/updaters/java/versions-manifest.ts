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

import { VersionsMap } from '../update';
import { JavaUpdate } from './java_update';

export class VersionsManifest extends JavaUpdate {
  updateContent(content: string): string {
    let newContent = content;
    this.versions!.forEach((version, packageName) => {
      newContent = this.updateSingleVersion(newContent, packageName, version);
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
            new RegExp(
              `${packageName}:(.*):[0-9]+\\.[0-9]+\\.[0-9]+(-\\w+)?(-SNAPSHOT)?`,
              'g'
            ),
            `${packageName}:$1:${version}`
          )
        );
      } else {
        newLines.push(
          line.replace(
            new RegExp(
              `${packageName}:[0-9]+\\.[0-9]+\\.[0-9]+(-\\w+)?(-SNAPSHOT)?:[0-9]+\\.[0-9]+\\.[0-9]+(-\\w+)?(-SNAPSHOT)?`,
              'g'
            ),
            `${packageName}:${version}:${version}`
          )
        );
      }
    });
    return newLines.join('\n');
  }

  static parseVersions(content: string): VersionsMap {
    const versions = new Map<string, string>();
    content.split(/\r?\n/).forEach(line => {
      const match = line.match(/^([\w\-_]+):(.+):(.+)/);
      if (match) {
        versions.set(match[1], match[2]);
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
