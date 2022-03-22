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
import {PomXml} from '../updaters/java/pom-xml';

export class Maven extends Java {
  protected buildFileUpdates(
    updates: Update[],
    path: string,
    options: JavaBuildUpdatesOption,
    extraFile?: boolean
  ) {
    // Don't add updater if pom.xml is in extraFiles
    if (!extraFile && path.match(/(^|\/|\\)pom.xml$/)) {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new PomXml(options.newVersion),
      });
    }

    super.buildFileUpdates(updates, path, options, extraFile);
  }
}
