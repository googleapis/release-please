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

import {ReleasePR, ReleaseCandidate, PackageName} from '../release-pr';
import {GitHubFileContents} from '../github';
import {Update} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';
import * as yaml from 'js-yaml';

// pubspec
import {PubspecYaml} from '../updaters/pubspec-yaml';

export class Dart extends ReleasePR {
  private pubspecYmlContents?: GitHubFileContents;
  private _packageName?: string;

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

    updates.push(
      new PubspecYaml({
        path: this.addPath('pubspec.yaml'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    return updates;
  }

  async getPackageName(): Promise<PackageName> {
    if (this._packageName === undefined) {
      const pubspecYmlContents = await this.getPubspecYmlContents();
      const pubspec = yaml.load(pubspecYmlContents.parsedContent, {json: true});
      if (typeof pubspec === 'object') {
        this.packageName = this._packageName =
          (pubspec as {name: string}).name ?? this.packageName;
      } else {
        this._packageName = this.packageName;
      }
    }
    return {
      name: this.packageName,
      getComponent: () => this.packageName,
    };
  }

  private async getPubspecYmlContents(): Promise<GitHubFileContents> {
    if (!this.pubspecYmlContents) {
      this.pubspecYmlContents = await this.gh.getFileContents(
        this.addPath('pubspec.yaml')
      );
    }
    return this.pubspecYmlContents;
  }
}
