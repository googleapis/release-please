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

import {FileData, FileMode} from 'code-suggester/build/src/types';
import * as semver from 'semver';
import {ManifestPackageWithPRData} from '..';
import {GitHubFileContents} from '../github';
import {CargoLock} from '../updaters/rust/cargo-lock';
import {CargoToml} from '../updaters/rust/cargo-toml';
import {
  CargoManifest,
  parseCargoLockfile,
  parseCargoManifest,
} from '../updaters/rust/common';
import {Update, VersionsMap} from '../updaters/update';
import {CheckpointType} from '../util/checkpoint';
import {ManifestPlugin} from './plugin';

export default class CargoWorkspaceDependencyUpdates extends ManifestPlugin {
  private async getWorkspaceManifest(): Promise<CargoManifest> {
    let content: GitHubFileContents = await this.gh.getFileContents(
      'Cargo.toml'
    );
    return parseCargoManifest(content.parsedContent);
  }

  async run(
    newManifestVersions: VersionsMap,
    pkgsWithPRData: ManifestPackageWithPRData[]
  ): Promise<[VersionsMap, ManifestPackageWithPRData[]]> {
    let workspaceManifest = await this.getWorkspaceManifest();

    if (!workspaceManifest.workspace) {
      throw new Error(
        "cargo-workspace plugin used, but top-level Cargo.toml isn't a cargo workspace"
      );
    }

    if (!workspaceManifest.workspace.members) {
      throw new Error(
        'cargo-workspace plugin used, but top-level Cargo.toml has no members'
      );
    }

    const versions = new Map();
    for (const data of pkgsWithPRData) {
      if (data.config.releaseType !== 'rust' || data.config.path === '.') {
        continue;
      }
      versions.set(data.config.packageName!, data.prData.version);
    }

    // Try to upgrade /all/ packages, even those release-please did not bump
    for (const pkgPath of workspaceManifest.workspace.members) {
      let manifestPath = `${pkgPath}/Cargo.toml`;
      let targetPkg = pkgsWithPRData.find(pkg => pkg.config.path === pkgPath);

      // original contents of the manifest for the target package
      let content =
        targetPkg?.prData.changes.get(manifestPath)?.content ??
        (await this.gh.getFileContents(manifestPath)).parsedContent;
      let manifest = await parseCargoManifest(content);
      let pkgName = manifest.package?.name;
      if (!pkgName) {
        throw new Error(
          `package at ${pkgPath} does not have a name in its Cargo manifest`
        );
      }

      // This should update all the dependencies that have been bumped by release-please
      let dependencyUpdates = new CargoToml({
        path: manifestPath,
        changelogEntry: 'updating dependencies',
        version: 'unused',
        versions,
        packageName: 'unused',
      });
      let newContent = dependencyUpdates.updateContent(content);
      if (newContent === content) {
        // guess that package didn't depend on any of the bumped packages
        continue;
      }

      let updatedManifest: FileData = {
        content: newContent,
        mode: '100644',
      };

      if (targetPkg) {
        // package was already bumped by release-please, just update the change
        // to also include dependency updates.
        targetPkg?.prData.changes.set(manifestPath, updatedManifest);
      } else {
        // package was not bumped by release-please, but let's bump it ourselves,
        // because one of its dependencies was upgraded.
        let pkgVersion = manifest.package?.version;
        if (!pkgVersion) {
          throw new Error(
            `cannot bump ${pkgPath}, it has no version in its Cargo manifest`
          );
        }

        let version: string;
        const patch = semver.inc(pkgVersion, 'patch');
        if (patch === null) {
          this.log(
            `Don't know how to patch ${pkgPath}'s version(${pkgVersion})`,
            CheckpointType.Failure
          );
          version = pkgVersion;
        } else {
          version = patch;
        }

        let changes = new Map();
        changes.set(manifestPath, updatedManifest);

        pkgsWithPRData.push({
          config: {
            path: pkgPath,
            releaseType: 'rust',
          },
          prData: {
            changes,
            version,
          },
        });
      }
    }

    // Upgrade package.lock
    {
      let lockfilePath = 'Cargo.lock';
      let dependencyUpdates = new CargoLock({
        path: lockfilePath,
        changelogEntry: 'updating cargo lockfile',
        version: 'unused',
        versions,
        packageName: 'unused',
      });

      let oldContent = (await this.gh.getFileContents(lockfilePath))
        .parsedContent;
      let newContent = dependencyUpdates.updateContent(oldContent);
      if (newContent !== oldContent) {
        let changes = new Map();
        let updatedLockfile: FileData = {
          content: newContent,
          mode: '100644',
        };
        changes.set(lockfilePath, updatedLockfile);

        pkgsWithPRData.push({
          config: {
            path: '.',
            packageName: 'cargo workspace',
            releaseType: 'rust',
          },
          prData: {
            changes,
            version: 'lockfile maintenance',
          },
        });
      }
    }

    return [newManifestVersions, pkgsWithPRData];
  }
}
