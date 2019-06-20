/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { checkpoint, CheckpointType } from '../util/checkpoint';
import { Update, UpdateOptions } from './update';
import { GitHubFileContents } from '../github';

interface ManifestModule {
  name: string;
  versions: string[];
}

export class PHPManifest implements Update {
  path: string;
  changelogEntry: string;
  version: string;
  versions?: { [key: string]: string };
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
    if (!this.versions || Object.keys(this.versions).length === 0) {
      checkpoint(
        `no updates necessary for ${this.path}`,
        CheckpointType.Failure
      );
      return content;
    }
    const parsed = JSON.parse(content);
    Object.keys(this.versions).forEach((key: string) => {
      if (this.versions) {
        const version: string = this.versions[key]
          ? this.versions[key]
          : '1.0.0';
        parsed.modules.forEach((module: ManifestModule) => {
          if (module.name === key) {
            checkpoint(
              `adding ${key}@${version} to manifest`,
              CheckpointType.Success
            );
            module.versions.unshift(version);
          }
        });
      }
    });

    return JSON.stringify(parsed, null, 4) + '\n';
  }
}
