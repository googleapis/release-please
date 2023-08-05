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

import {GitHubFileContents} from '@google-automations/git-file-utils';
import {Changelog} from '../updaters/changelog';
import * as yaml from 'js-yaml';
import {ShardYml} from '../updaters/crystal/shard-yml';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';
import {FileNotFoundError, MissingRequiredFileError} from '../errors';

export class Crystal extends BaseStrategy {
  private shardYmlContents?: GitHubFileContents;
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
      path: this.addPath('shard.yml'),
      createIfMissing: false,
      cachedFileContents: this.shardYmlContents,
      updater: new ShardYml({
        version,
      }),
    });

    return updates;
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const shardYmlContents = await this.getShardYmlContents();
    const chart = yaml.load(shardYmlContents.parsedContent, {json: true});
    if (typeof chart === 'object') {
      return (chart as {name: string}).name;
    } else {
      return undefined;
    }
  }

  private async getShardYmlContents(): Promise<GitHubFileContents> {
    if (!this.shardYmlContents) {
      try {
        this.shardYmlContents = await this.github.getFileContents(
          this.addPath('shard.yml')
        );
      } catch (e) {
        if (e instanceof FileNotFoundError) {
          throw new MissingRequiredFileError(
            this.addPath('shard.yml'),
            Crystal.name,
            `${this.repository.owner}/${this.repository.repo}`
          );
        }
        throw e;
      }
    }
    return this.shardYmlContents;
  }
}
