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

import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';
import {PackageLockJson} from '../updaters/node/package-lock-json';
import {SamplesPackageJson} from '../updaters/node/samples-package-json';
import {Changelog} from '../updaters/changelog';
import {PackageJson} from '../updaters/node/package-json';
import {GitHubFileContents} from '@google-automations/git-file-utils';

export class Node extends BaseStrategy {
  private pkgJsonContents?: GitHubFileContents;

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;
    const packageName = (await this.getPackageName()) ?? '';
    const lockFiles = ['package-lock.json', 'npm-shrinkwrap.json'];
    lockFiles.forEach(lockFile => {
      updates.push({
        path: this.addPath(lockFile),
        createIfMissing: false,
        updater: new PackageLockJson({
          version,
        }),
      });
    });

    updates.push({
      path: this.addPath('samples/package.json'),
      createIfMissing: false,
      updater: new SamplesPackageJson({
        version,
        packageName,
      }),
    });

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    updates.push({
      path: this.addPath('package.json'),
      createIfMissing: false,
      cachedFileContents: this.pkgJsonContents,
      updater: new PackageJson({
        version,
      }),
    });

    return updates;
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const pkgJsonContents = await this.getPkgJsonContents();
    const pkg = JSON.parse(pkgJsonContents.parsedContent);
    return pkg.name;
  }

  protected normalizeComponent(component: string | undefined): string {
    if (!component) {
      return '';
    }
    return component.match(/^@[\w-]+\//) ? component.split('/')[1] : component;
  }

  protected async getPkgJsonContents(): Promise<GitHubFileContents> {
    if (!this.pkgJsonContents) {
      this.pkgJsonContents = await this.github.getFileContentsOnBranch(
        this.addPath('package.json'),
        this.targetBranch
      );
    }
    return this.pkgJsonContents;
  }
}
