// Copyright 2023 Google LLC
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

import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';
import {Changelog} from '../updaters/changelog';
import {GitHubFileContents} from '@google-automations/git-file-utils';
import {FileNotFoundError, MissingRequiredFileError} from '../errors';
import {SfdxProjectJson} from '../updaters/sfdx/sfdx-project-json';

const sfdxProjectJsonFileName = 'sfdx-project.json';

export class Sfdx extends BaseStrategy {
  private sfdxProjectJsonContents?: GitHubFileContents;

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

    updates.push({
      path: this.addPath(sfdxProjectJsonFileName),
      createIfMissing: false,
      cachedFileContents: this.sfdxProjectJsonContents,
      updater: new SfdxProjectJson({
        version,
      }),
    });

    return updates;
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const pkgJsonContents = await this.getSfdxProjectJsonContents();
    const pkg = JSON.parse(pkgJsonContents.parsedContent);
    return pkg.name;
  }

  protected async getSfdxProjectJsonContents(): Promise<GitHubFileContents> {
    if (!this.sfdxProjectJsonContents) {
      try {
        this.sfdxProjectJsonContents =
          await this.github.getFileContentsOnBranch(
            this.addPath(sfdxProjectJsonFileName),
            this.targetBranch
          );
      } catch (e) {
        if (e instanceof FileNotFoundError) {
          throw new MissingRequiredFileError(
            this.addPath(sfdxProjectJsonFileName),
            'sfdx',
            `${this.repository.owner}/${this.repository.repo}`
          );
        }
        throw e;
      }
    }
    return this.sfdxProjectJsonContents;
  }
}
