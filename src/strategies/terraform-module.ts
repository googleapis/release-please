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
import {MetadataVersion} from '../updaters/terraform/metadata-version';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';
import {Version} from '../version';

export class TerraformModule extends BaseStrategy {
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
    const readmeFiles = await Promise.all([
      this.github.findFilesByFilenameAndRef(
        'readme.md',
        this.changesBranch,
        this.path
      ),
      this.github.findFilesByFilenameAndRef(
        'README.md',
        this.changesBranch,
        this.path
      ),
    ]).then(([v, vt]) => {
      return v.concat(vt);
    });
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
      this.github.findFilesByFilenameAndRef(
        'versions.tf',
        this.changesBranch,
        this.path
      ),
      this.github.findFilesByFilenameAndRef(
        'versions.tf.tmpl',
        this.changesBranch,
        this.path
      ),
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

    // Update metadata.yaml to current candidate version.
    const metadataFiles = await this.github.findFilesByFilenameAndRef(
      'metadata.yaml',
      this.targetBranch,
      this.path
    );

    metadataFiles.forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new MetadataVersion({
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
