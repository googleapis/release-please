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

import {Java, JavaBuildUpdatesOption} from './java';
import {Update} from '../update';
import {JavaReleased} from '../updaters/java/java-released';
import {Generic} from '../updaters/generic';
import {PomXml} from '../updaters/java/pom-xml';

/**
 * Strategy for Maven projects. It generates SNAPSHOT version after each release, and updates all found
 * pom.xml files automatically.
 */
export class Maven extends Java {
  protected async buildUpdates(
    options: JavaBuildUpdatesOption
  ): Promise<Update[]> {
    const version = options.newVersion;
    const versionsMap = options.versionsMap;

    // Use generic Java updates
    const updates: Update[] = await super.buildUpdates(options);

    // Update pom.xml files
    const pomFiles = await this.github.findFilesByFilenameAndRef(
      'pom.xml',
      this.targetBranch,
      this.path
    );

    pomFiles.forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new PomXml(version),
      });

      if (!options.isSnapshot) {
        updates.push({
          path: this.addPath(path),
          createIfMissing: false,
          updater: new JavaReleased({version, versionsMap}),
        });
      }

      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new Generic({version, versionsMap}),
      });
    });

    return updates;
  }
}
