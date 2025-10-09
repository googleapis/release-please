// Copyright 2025 Google LLC
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
// Copyright 2025 Google LLC
// Licensed under the Apache License, Version 2.0

import {GitHubFileContents} from '@google-automations/git-file-utils';
import {FileNotFoundError, MissingRequiredFileError} from '../errors';
import {Update} from '../update';
import {Changelog} from '../updaters/changelog';
import {ChangelogJson} from '../updaters/changelog-json';
import {filterCommits} from '../util/filter-commits';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {DenoJson} from '../updaters/deno/deno-json';

const CONFIG_FILES = ['deno.json', 'deno.jsonc', 'jsr.json'];

export class Deno extends BaseStrategy {
  private denoConfigContents?: GitHubFileContents;
  private denoConfigPath?: string;

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;
    const packageName = (await this.getDefaultPackageName()) ?? '';

    // Update config file
    if (this.denoConfigPath && this.denoConfigContents) {
      updates.push({
        path: this.addPath(this.denoConfigPath),
        createIfMissing: false,
        cachedFileContents: this.denoConfigContents,
        updater: new DenoJson({version}),
      });
    }

    // Changelog
    if (!this.skipChangelog) {
      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version,
          changelogEntry: options.changelogEntry,
        }),
      });
    }

    // If a machine readable changelog.json exists update it:
    if (options.commits && packageName && !this.skipChangelog) {
      const commits = filterCommits(options.commits, this.changelogSections);
      updates.push({
        path: 'changelog.json',
        createIfMissing: false,
        updater: new ChangelogJson({
          artifactName: packageName,
          version,
          commits,
          language: 'TYPESCRIPT',
        }),
      });
    }

    return updates;
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const configContents = await this.getDenoConfigContents();
    const config = JSON.parse(configContents.parsedContent);
    return config.name;
  }

  protected async getDenoConfigContents(): Promise<GitHubFileContents> {
    if (!this.denoConfigContents) {
      for (const file of CONFIG_FILES) {
        try {
          this.denoConfigContents = await this.github.getFileContentsOnBranch(
            this.addPath(file),
            this.targetBranch
          );
          this.denoConfigPath = file;
          break;
        } catch (e) {
          if (!(e instanceof FileNotFoundError)) {
            throw e;
          }
        }
      }

      if (!this.denoConfigContents || !this.denoConfigPath) {
        throw new MissingRequiredFileError(
          CONFIG_FILES.join(', '),
          'deno',
          `${this.repository.owner}/${this.repository.repo}`
        );
      }
    }
    return this.denoConfigContents;
  }
}
