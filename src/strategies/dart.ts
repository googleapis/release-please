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

// Generic
import {Changelog} from '../updaters/changelog';
import * as yaml from 'js-yaml';

// pubspec
import {PubspecYaml} from '../updaters/dart/pubspec-yaml';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {GitHubFileContents} from '@google-automations/git-file-utils';
import {Update} from '../update';
import {FileNotFoundError, MissingRequiredFileError} from '../errors';

export class Dart extends BaseStrategy {
  private pubspecYmlContents?: GitHubFileContents;

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
      path: this.addPath('pubspec.yaml'),
      createIfMissing: false,
      cachedFileContents: this.pubspecYmlContents,
      updater: new PubspecYaml({
        version,
      }),
    });

    return updates;
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const pubspecYmlContents = await this.getPubspecYmlContents();
    const pubspec = yaml.load(pubspecYmlContents.parsedContent, {json: true});
    if (typeof pubspec === 'object') {
      return (pubspec as {name: string}).name;
    } else {
      return undefined;
    }
  }

  private async getPubspecYmlContents(): Promise<GitHubFileContents> {
    if (!this.pubspecYmlContents) {
      try {
        this.pubspecYmlContents = await this.github.getFileContentsOnBranch(
          this.addPath('pubspec.yaml'),
          this.targetBranch
        );
      } catch (e) {
        if (e instanceof FileNotFoundError) {
          throw new MissingRequiredFileError(
            this.addPath('pubspec.yaml'),
            Dart.name,
            `${this.repository.owner}/${this.repository.repo}`
          );
        }
        throw e;
      }
    }
    return this.pubspecYmlContents;
  }
}
