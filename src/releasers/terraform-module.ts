// Copyright 2020 Google LLC
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

import {ReleaseCandidate, PackageName, ReleasePR} from '../release-pr';
import {Update} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';
// Terraform specific.
import {ReadMe} from '../updaters/terraform/readme';
import {ModuleVersion} from '../updaters/terraform/module-version';

export class TerraformModule extends ReleasePR {
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

    // Update version in README to current candidate version.
    // A module may have submodules, so find all submodules.
    const readmeFiles = await this.gh.findFilesByFilename('readme.md');
    readmeFiles.forEach(path => {
      updates.push(
        new ReadMe({
          path: this.addPath(path),
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });

    // Update versions.tf to current candidate version.
    // A module may have submodules, so find all versions.tfand versions.tf.tmpl to update.
    const versionFiles = await Promise.all([
      this.gh.findFilesByFilename('versions.tf'),
      this.gh.findFilesByFilename('versions.tf.tmpl'),
    ]).then(([v, vt]) => {
      return v.concat(vt);
    });
    versionFiles.forEach(path => {
      updates.push(
        new ModuleVersion({
          path: this.addPath(path),
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });
    return updates;
  }

  defaultInitialVersion(): string {
    return '0.1.0';
  }
}
