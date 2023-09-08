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

import {GitHubFileContents} from '@google-automations/git-file-utils';

// Generic
import {Changelog} from '../updaters/changelog';
// Cargo.toml support
import {CargoToml} from '../updaters/rust/cargo-toml';
import {CargoLock} from '../updaters/rust/cargo-lock';
import {CargoManifest, parseCargoManifest} from '../updaters/rust/common';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {VersionsMap} from '../version';
import {Update} from '../update';

export class Rust extends BaseStrategy {
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

    const workspaceManifest = await this.getPackageManifest();
    const versionsMap: VersionsMap = new Map();

    if (workspaceManifest?.workspace?.members) {
      const members = workspaceManifest.workspace.members;
      if (workspaceManifest.package?.name) {
        versionsMap.set(workspaceManifest.package.name, version);
      } else {
        this.logger.warn('No workspace manifest package name found');
      }

      this.logger.info(
        `found workspace with ${members.length} members, upgrading all`
      );

      // Collect submodule names to update
      const manifestsByPath: Map<string, GitHubFileContents> = new Map();
      for (const member of members) {
        const manifestPath = `${member}/Cargo.toml`;
        const manifestContent = await this.getContent(manifestPath);
        if (!manifestContent) {
          this.logger.warn(
            `member ${member} declared but did not find Cargo.toml`
          );
          continue;
        }
        const manifest = parseCargoManifest(manifestContent.parsedContent);
        manifestsByPath.set(manifestPath, manifestContent);
        if (!manifest.package?.name) {
          this.logger.warn(`member ${member} has no package name`);
          continue;
        }
        versionsMap.set(manifest.package.name, version);
      }
      this.logger.info(`updating ${manifestsByPath.size} submodules`);
      this.logger.debug('versions map:', versionsMap);

      for (const [manifestPath, manifestContent] of manifestsByPath) {
        updates.push({
          path: this.addPath(manifestPath),
          createIfMissing: false,
          cachedFileContents: manifestContent,
          updater: new CargoToml({
            version,
            versionsMap,
          }),
        });
      }
      // Update root Cargo.toml
      updates.push({
        path: this.addPath('Cargo.toml'),
        createIfMissing: false,
        updater: new CargoToml({
          version,
          versionsMap,
        }),
      });
    } else {
      this.logger.info('single crate found, updating Cargo.toml');

      const packageName = await this.getDefaultPackageName();
      if (packageName) {
        versionsMap.set(packageName, version);
      } else {
        this.logger.warn('No crate package name found');
      }

      updates.push({
        path: this.addPath('Cargo.toml'),
        createIfMissing: false,
        updater: new CargoToml({
          version,
          versionsMap,
        }),
      });
    }

    updates.push({
      path: this.addPath('Cargo.lock'),
      createIfMissing: false,
      updater: new CargoLock(versionsMap),
    });

    return updates;
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
      this.packageManifest = await this.getManifest('Cargo.toml');
    }
    return this.packageManifest;
  }

  private async getContent(path: string): Promise<GitHubFileContents | null> {
    try {
      return await this.github.getFileContentsOnBranch(
        this.addPath(path),
        this.changesBranch
      );
    } catch (e) {
      return null;
    }
  }

  protected async getManifest(path: string): Promise<CargoManifest | null> {
    const content = await this.getContent(path);
    return content ? parseCargoManifest(content.parsedContent) : null;
  }
}
