// Copyright 2021 Google LLC
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

import {ReleaseCandidate, PackageName, ReleasePR} from '../release-pr';
import {Update} from '../updaters/update';
import {GitHubFileContents} from '../github';

// Generic
import {Changelog} from '../updaters/changelog';
// KRM specific.
import {KRMBlueprintVersion} from '../updaters/krm/krm-blueprint-version';

const KRMBlueprintAttribAnnotation = 'cnrm.cloud.google.com/blueprint';
const hasKRMBlueprintAttrib = (content: string) =>
  content.includes(KRMBlueprintAttribAnnotation);

export class KRMBlueprint extends ReleasePR {
  protected async buildUpdates(
    changelogEntry: string,
    candidate: ReleaseCandidate,
    packageName: PackageName
  ): Promise<Update[]> {
    const updates: Update[] = [];
    updates.push(
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );
    const versionsMap: Map<string, string> = new Map();
    if (candidate.previousTag) {
      versionsMap.set('previous', candidate.previousTag);
    }

    // Update version in all yaml files with attribution annotation
    const yamlPaths = await this.gh.findFilesByExtension('yaml');
    for (const yamlPath of yamlPaths) {
      const contents: GitHubFileContents = await this.gh.getFileContents(
        this.addPath(yamlPath)
      );
      if (hasKRMBlueprintAttrib(contents.parsedContent)) {
        updates.push(
          new KRMBlueprintVersion({
            path: this.addPath(yamlPath),
            changelogEntry,
            version: candidate.version,
            packageName: packageName.name,
            versions: versionsMap,
          })
        );
      }
    }
    return updates;
  }

  defaultInitialVersion(): string {
    return '0.1.0';
  }
}
