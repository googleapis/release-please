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

import {GitHubFileContents} from '../github';

// Generic
import {Changelog} from '../updaters/changelog';
// Cargo.toml support
import {CargoToml} from '../updaters/rust/cargo-toml';
import {CargoLock} from '../updaters/rust/cargo-lock';
import {CargoManifest, parseCargoManifest} from '../updaters/rust/common';
import {logger} from '../util/logger';
import {Strategy, BuildUpdatesOptions} from '../strategy';
import {VersionsMap, Version} from '../version';
import {Update} from '../update';

export class Rust extends Strategy {
  private packageManifest?: CargoManifest | null;
  private workspaceManifest?: CargoManifest | null;

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

    const workspaceManifest = await this.getWorkspaceManifest();
    const manifestPaths: string[] = [];
    let lockPath: string;

    if (
      workspaceManifest &&
      workspaceManifest.workspace &&
      workspaceManifest.workspace.members
    ) {
      const members = workspaceManifest.workspace.members;
      logger.info(
        `found workspace with ${members.length} members, upgrading all`
      );
      for (const member of members) {
        manifestPaths.push(`${member}/Cargo.toml`);
      }
      lockPath = 'Cargo.lock';
    } else {
      const manifestPath = this.addPath('Cargo.toml');
      logger.info(`single crate found, updating ${manifestPath}`);
      manifestPaths.push(manifestPath);
      lockPath = this.addPath('Cargo.lock');
    }

    const versionsMap: VersionsMap = new Map();
    versionsMap.set(this.component || '', version);

    for (const path of manifestPaths) {
      updates.push({
        path,
        createIfMissing: false,
        updater: new CargoToml({
          version,
          versionsMap,
        }),
      });
    }

    updates.push({
      path: lockPath,
      createIfMissing: false,
      updater: new CargoLock({
        version,
        versionsMap,
      }),
    });

    return updates;
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const packageManifest = await this.getPackageManifest();
    if (packageManifest) {
      return packageManifest.package?.name;
    }
    return undefined;
  }

  /**
   * @returns the package's manifest, ie. `crates/foobar/Cargo.toml`
   */
  protected async getPackageManifest(): Promise<CargoManifest | null> {
    if (this.packageManifest === undefined) {
      this.packageManifest = await this.getManifest(this.addPath('Cargo.toml'));
    }
    return this.packageManifest;
  }

  /**
   * @returns the workspace's manifest, ie. `Cargo.toml` (top-level)
   */
  protected async getWorkspaceManifest(): Promise<CargoManifest | null> {
    if (this.workspaceManifest === undefined) {
      this.workspaceManifest = await this.getManifest('Cargo.toml');
    }
    return this.workspaceManifest;
  }

  protected async getManifest(path: string): Promise<CargoManifest | null> {
    let content: GitHubFileContents;
    try {
      content = await this.github.getFileContentsOnBranch(
        path,
        this.targetBranch
      );
    } catch (e) {
      return null;
    }
    return parseCargoManifest(content.parsedContent);
  }
}
