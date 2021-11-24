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

// Generic
import {Changelog} from '../updaters/changelog';
// Terraform specific.
import {ReadMe} from '../updaters/terraform/readme';
import {ModuleVersion} from '../updaters/terraform/module-version';
import {Strategy, BuildUpdatesOptions} from '../strategy';
import {Update} from '../update';
import {Version} from '../version';

export class TerraformModule extends Strategy {
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

    // Update version in README to current candidate version.
    // A module may have submodules, so find all submodules.
    const readmeFiles = await this.github.findFilesByFilename(
      'readme.md',
      this.path
    );
    readmeFiles.forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new ReadMe({
          version,
        }),
      });
    });

    // Update versions.tf to current candidate version.
    // A module may have submodules, so find all versions.tfand versions.tf.tmpl to update.
    const versionFiles = await Promise.all([
      this.github.findFilesByFilename('versions.tf', this.path),
      this.github.findFilesByFilename('versions.tf.tmpl', this.path),
    ]).then(([v, vt]) => {
      return v.concat(vt);
    });
    versionFiles.forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new ModuleVersion({
          version,
        }),
      });
    });
    return updates;
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }
}
