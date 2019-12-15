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

import { checkpoint, CheckpointType } from '../util/checkpoint';
import { Update, UpdateOptions, VersionsMap } from './update';
import { GitHubFileContents } from '../github';

interface ManifestModule {
  name: string;
  versions: string[];
}

export class PHPManifest implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  versions?: VersionsMap;
  packageName: string;
  create: boolean;
  contents?: GitHubFileContents;

  constructor(options: UpdateOptions) {
    this.create = false;
    this.path = options.path;
    this.changelogEntry = options.changelogEntry;
    this.version = options.version;
    this.versions = options.versions;
    this.packageName = options.packageName;
  }
  updateContent(content: string): string {
    if (!this.versions || this.versions.size === 0) {
      checkpoint(
        `no updates necessary for ${this.path}`,
        CheckpointType.Failure
      );
      return content;
    }
    const parsed = JSON.parse(content);
    parsed.modules.forEach((module: ManifestModule) => {
      if (!this.versions) return;
      for (const [key, version] of this.versions) {
        if (module.name === key) {
          checkpoint(
            `adding ${key}@${version} to manifest`,
            CheckpointType.Success
          );
          module.versions.unshift(`v${version}`);
        }
      }

      // the mono-repo's own API version should be added to the
      // google/cloud key:
      if (module.name === 'google/cloud') {
        module.versions.unshift(`v${this.version}`);
      }
    });

    return JSON.stringify(parsed, null, 4) + '\n';
  }
}
