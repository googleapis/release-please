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

import {ReleasePR, ReleaseCandidate, PackageName} from '../release-pr';

import {GitHubFileContents} from '../github';
import {Update} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';
// JavaScript
import {PackageJson} from '../updaters/package-json';
import {PackageLockJson} from '../updaters/package-lock-json';
import {SamplesPackageJson} from '../updaters/samples-package-json';

export class Node extends ReleasePR {
  private pkgJsonContents?: GitHubFileContents;
  private _packageName?: string;

  protected async buildUpdates(
    changelogEntry: string,
    candidate: ReleaseCandidate,
    packageName: PackageName
  ): Promise<Update[]> {
    const updates: Update[] = [];

    const lockFiles = ['package-lock.json', 'npm-shrinkwrap.json'];
    lockFiles.forEach(lockFile => {
      updates.push(
        new PackageLockJson({
          path: this.addPath(lockFile),
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });

    updates.push(
      new SamplesPackageJson({
        path: this.addPath('samples/package.json'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    updates.push(
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    updates.push(
      new PackageJson({
        path: this.addPath('package.json'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
        contents: await this.getPkgJsonContents(),
      })
    );
    return updates;
  }

  // Always prefer the package.json name
  async getPackageName(): Promise<PackageName> {
    if (this._packageName === undefined) {
      const pkgJsonContents = await this.getPkgJsonContents();
      const pkg = JSON.parse(pkgJsonContents.parsedContent);
      this.packageName = this._packageName = pkg.name ?? this.packageName;
    }
    return {
      name: this.packageName,
      getComponent: () =>
        this.packageName.match(/^@[\w-]+\//)
          ? this.packageName.split('/')[1]
          : this.packageName,
    };
  }

  private async getPkgJsonContents(): Promise<GitHubFileContents> {
    if (!this.pkgJsonContents) {
      this.pkgJsonContents = await this.gh.getFileContents(
        this.addPath('package.json')
      );
    }
    return this.pkgJsonContents;
  }
}
