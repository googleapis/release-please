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

import {GitHubFileContents} from '@google-automations/git-file-utils';

// Generic
import {Changelog} from '../updaters/changelog';
// KRM specific.
import {KRMBlueprintVersion} from '../updaters/krm/krm-blueprint-version';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';
import {VersionsMap} from '../version';

const KRMBlueprintAttribAnnotation = 'cnrm.cloud.google.com/blueprint';
const hasKRMBlueprintAttrib = (content: string) =>
  content.includes(KRMBlueprintAttribAnnotation);

export class KRMBlueprint extends BaseStrategy {
  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    const versionsMap: VersionsMap = new Map();
    if (options.latestVersion) {
      versionsMap.set('previousVersion', options.latestVersion);
    }

    // Update version in all yaml files with attribution annotation
    const yamlPaths = await this.github.findFilesByExtensionAndRef(
      'yaml',
      this.changesBranch,
      this.path
    );
    for (const yamlPath of yamlPaths) {
      const contents: GitHubFileContents =
        await this.github.getFileContentsOnBranch(
          this.addPath(yamlPath),
          this.changesBranch
        );
      if (hasKRMBlueprintAttrib(contents.parsedContent)) {
        updates.push({
          path: this.addPath(yamlPath),
          createIfMissing: false,
          cachedFileContents: contents,
          updater: new KRMBlueprintVersion({
            version,
            versionsMap,
          }),
        });
      }
    }
    return updates;
  }
}
