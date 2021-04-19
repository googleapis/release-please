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

import * as semver from 'semver';
import cu = require('@lerna/collect-updates');
import {Package, PackageJson} from '@lerna/package';
import {PackageGraph} from '@lerna/package-graph';
import {runTopologically} from '@lerna/run-topologically';
import {ManifestPlugin} from './plugin';
import {ManifestPackageWithPRData, ManifestPackage} from '..';
import {VersionsMap} from '../updaters/update';
import {packageJsonStringify} from '../util/package-json-stringify';
import {CheckpointType} from '../util/checkpoint';
import {RELEASE_PLEASE} from '../constants';
import {Changes} from 'code-suggester';
import {ConventionalCommits} from '../conventional-commits';
import {Changelog} from '../updaters/changelog';

type PathPkgJson = Map<string, PackageJson>;

export default class NodeWorkspaceDependencyUpdates extends ManifestPlugin {
  // package.json contents already updated by the node releasers.
  private filterPackages(
    pkgsWithPRData: ManifestPackageWithPRData[]
  ): PathPkgJson {
    const pathPkgs = new Map();
    for (const pkg of pkgsWithPRData) {
      if (pkg.config.releaseType === 'node' && pkg.config.path !== '.') {
        for (const [path, fileData] of pkg.prData.changes) {
          if (path === `${pkg.config.path}/package.json`) {
            this.log(`found ${path} in changes`, CheckpointType.Success);
            pathPkgs.set(path, JSON.parse(fileData.content!) as PackageJson);
          }
        }
      }
    }
    return pathPkgs;
  }

  // all packages' package.json content - both updated by this run as well as
  // those that did not update (no user facing commits).
  private async getAllWorkspacePackages(
    rpUpdatedPkgs: PathPkgJson
  ): Promise<Map<string, Package>> {
    const nodePkgs = new Map();
    for (const pkg of this.config.parsedPackages) {
      if (pkg.releaseType !== 'node' || pkg.path === '.') {
        continue;
      }
      const path = `${pkg.path}/package.json`;
      let contents: PackageJson;
      const alreadyUpdated = rpUpdatedPkgs.get(path);
      if (alreadyUpdated) {
        contents = alreadyUpdated;
      } else {
        const fileContents = await this.gh.getFileContents(path);
        contents = JSON.parse(fileContents.parsedContent);
      }
      this.log(
        `loaded ${path} from ${alreadyUpdated ? 'existing changes' : 'github'}`,
        CheckpointType.Success
      );
      nodePkgs.set(path, new Package(contents, path));
    }
    return nodePkgs;
  }

  private async runLernaVersion(
    rpUpdatedPkgs: PathPkgJson,
    allPkgs: Map<string, Package>
  ): Promise<Map<string, Package>> {
    // Build the graph of all the packages: similar to https://git.io/Jqf1v
    const packageGraph = new PackageGraph(
      // use pkg.toJSON() which does a shallow copy of the internal data storage
      // so we can preserve the original allPkgs for version diffing later.
      [...allPkgs].map(([path, pkg]) => new Package(pkg.toJSON(), path)),
      'allDependencies'
    );

    // release-please already did the work of @lerna/collectUpdates (identifying
    // which packages need version bumps based on conventional commits). We use
    // that as our `isCandidate` callback in @lerna/collectUpdates.collectPackages.
    // similar to https://git.io/JqUOB
    // `collectPackages` includes "localDependents" of our release-please updated
    // packages as they need to be patch bumped.
    const updatesWithDependents = cu.collectPackages(packageGraph, {
      isCandidate: node => rpUpdatedPkgs.has(node.location),
    });

    // our implementation of producing a Map<pkgName, newVersion> similar to
    // `this.updatesVersions` which is used to set updated package
    // (https://git.io/JqfD7) and dependency (https://git.io/JqU3q) versions
    //
    // `lerna version` accomplishes this with:
    // `getVersionsForUpdates` (https://git.io/JqfyI)
    //   -> `getVersion` + `reduceVersions` (https://git.io/JqfDI)
    const updatesVersions = new Map();
    const invalidVersions = new Set();
    for (const node of updatesWithDependents) {
      let version: string;
      let source: string;
      if (rpUpdatedPkgs.has(node.location)) {
        version = node.version;
        source = RELEASE_PLEASE;
      } else {
        // must be a dependent, assume a "patch" bump.
        const patch = semver.inc(node.version, 'patch');
        if (patch === null) {
          this.log(
            `Don't know how to patch ${node.name}'s version(${node.version})`,
            CheckpointType.Failure
          );
          invalidVersions.add(node.name);
          version = node.version;
          source = 'failed to patch bump';
        } else {
          version = patch;
          source = 'dependency bump';
        }
      }
      this.log(
        `setting ${node.location} to ${version} from ${source}`,
        CheckpointType.Success
      );
      updatesVersions.set(node.name, version);
    }

    // our implementation of a subset of `updatePackageVersions` to produce a
    // callback for updating versions and dependencies (https://git.io/Jqfyu)
    const runner = async (pkg: Package): Promise<Package> => {
      pkg.set('version', updatesVersions.get(pkg.name));
      const graphPkg = packageGraph.get(pkg.name);
      for (const [depName, resolved] of graphPkg.localDependencies) {
        const depVersion = updatesVersions.get(depName);
        if (depVersion && resolved.type !== 'directory') {
          pkg.updateLocalDependency(resolved, depVersion, '^');
          this.log(
            `${pkg.name}.${depName} updated to ^${depVersion}`,
            CheckpointType.Success
          );
        }
      }
      return pkg;
    };

    // https://git.io/Jqfyp
    const allUpdated = await runTopologically(
      updatesWithDependents.map(node => node.pkg),
      runner,
      {
        graphType: 'allDependencies',
        concurrency: 1,
        rejectCycles: false,
      }
    );
    return new Map(allUpdated.map(p => [p.location, p]));
  }

  private async updatePkgsWithPRData(
    pkgsWithPRData: ManifestPackageWithPRData[],
    newManifestVersions: VersionsMap,
    allUpdated: Map<string, Package>,
    allOrigPkgs: Map<string, Package>
  ) {
    // already had version bumped by release-please, may have also had
    // dependency version bumps as well
    for (const data of pkgsWithPRData) {
      if (data.config.releaseType !== 'node' || data.config.path === '.') {
        continue;
      }
      const filePath = `${data.config.path}/package.json`;
      const updated = allUpdated.get(filePath)!; // bug if not defined
      data.prData.changes.set(filePath, {
        content: packageJsonStringify(updated.toJSON()),
        mode: '100644',
      });
      await this.setChangelogEntry(
        data.config,
        data.prData.changes,
        updated,
        allOrigPkgs.get(filePath)! // bug if undefined.
      );
      allUpdated.delete(filePath);
    }

    // non-release-please updated packages that have updates solely because
    // dependency versions incremented.
    for (const [filePath, updated] of allUpdated) {
      const pkg = this.config.parsedPackages.find(
        p => `${p.path}/package.json` === filePath
      )!; // bug if undefined.
      pkg.packageName = updated.name;
      const content = packageJsonStringify(updated.toJSON());
      const changes: Changes = new Map([[filePath, {content, mode: '100644'}]]);
      await this.setChangelogEntry(
        pkg,
        changes,
        updated,
        allOrigPkgs.get(filePath)! // bug if undefined.
      );
      pkgsWithPRData.push({
        config: pkg,
        prData: {
          version: updated.version,
          changes,
        },
      });
      newManifestVersions.set(
        filePath.replace(/\/package.json$/, ''),
        updated.version
      );
    }
  }

  private getChangelogDepsNotes(
    pkg: Package,
    origPkgJson: PackageJson
  ): string {
    let depUpdateNotes = '';
    type DT =
      | 'dependencies'
      | 'devDependencies'
      | 'peerDependencies'
      | 'optionalDependencies';
    const depTypes: DT[] = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ];
    const updates: Map<DT, string[]> = new Map();
    for (const depType of depTypes) {
      const depUpdates = [];
      const pkgDepTypes = pkg[depType];
      if (pkgDepTypes === undefined) {
        continue;
      }
      for (const [depName, currentDepVer] of Object.entries(pkgDepTypes)) {
        const origDepVer = origPkgJson[depType]?.[depName];
        if (currentDepVer !== origDepVer) {
          depUpdates.push(
            `\n    * ${depName} bumped from ${origDepVer} to ${currentDepVer}`
          );
        }
      }
      if (depUpdates.length > 0) {
        updates.set(depType, depUpdates);
      }
    }
    for (const [dt, notes] of updates) {
      depUpdateNotes += `\n  * ${dt}`;
      for (const note of notes) {
        depUpdateNotes += note;
      }
    }
    return depUpdateNotes;
  }

  private updateChangelogEntry(
    exChangelog: string,
    changelogEntry: string,
    pkg: Package
  ): string {
    changelogEntry = changelogEntry.replace(
      new RegExp(`^###? \\[${pkg.version}\\].*### Dependencies`, 's'),
      '### Dependencies'
    );
    const match = exChangelog.match(
      new RegExp(
        `(?<before>^.*?###? \\[${pkg.version}\\].*?\n)(?<after>###? [0-9[].*)`,
        's'
      )
    );
    if (!match) {
      this.log(
        `Appending update notes to end of changelog for ${pkg.name}`,
        CheckpointType.Failure
      );
      changelogEntry = `${exChangelog}\n\n\n${changelogEntry}`;
    } else {
      const {before, after} = match.groups!;
      changelogEntry = `${before.trim()}\n\n\n${changelogEntry}\n\n${after.trim()}`;
    }
    return changelogEntry;
  }

  private async newChangelogEntry(
    changelogEntry: string,
    changelogPath: string,
    pkg: Package
  ): Promise<string> {
    let changelog;
    try {
      changelog = (await this.gh.getFileContents(changelogPath)).parsedContent;
    } catch (e) {
      if (e.status !== 404) {
        this.log(
          `Failed to retrieve ${changelogPath}: ${e}`,
          CheckpointType.Failure
        );
        return '';
      } else {
        this.log(
          `Creating a new changelog at ${changelogPath}`,
          CheckpointType.Success
        );
      }
    }
    const changelogUpdater = new Changelog({
      path: changelogPath,
      changelogEntry,
      version: pkg.version,
      packageName: pkg.name,
    });
    return changelogUpdater.updateContent(changelog);
  }

  private async setChangelogEntry(
    config: ManifestPackage,
    changes: Changes,
    pkg: Package,
    origPkgJson: PackageJson
  ) {
    const depUpdateNotes = this.getChangelogDepsNotes(pkg, origPkgJson);
    if (!depUpdateNotes) {
      return;
    }

    const cc = new ConventionalCommits({
      changelogSections: [{type: 'deps', section: 'Dependencies'}],
      commits: [
        {
          sha: '',
          message: 'deps: The following workspace dependencies were updated',
          files: [],
        },
      ],
      owner: this.gh.owner,
      repository: this.gh.repo,
      bumpMinorPreMajor: config.bumpMinorPreMajor,
    });
    let tagPrefix = config.packageName?.match(/^@[\w-]+\//)
      ? config.packageName.split('/')[1]
      : config.packageName;
    tagPrefix += '-v';
    let changelogEntry = await cc.generateChangelogEntry({
      version: pkg.version,
      currentTag: tagPrefix + pkg.version,
      previousTag: tagPrefix + origPkgJson.version,
    });
    changelogEntry += depUpdateNotes;

    let updatedChangelog;
    let changelogPath = config.changelogPath ?? 'CHANGELOG.md';
    if (config.path !== '.') {
      changelogPath = `${config.path}/${changelogPath}`;
    }
    const exChangelog = changes.get(changelogPath)?.content;
    if (exChangelog) {
      updatedChangelog = this.updateChangelogEntry(
        exChangelog,
        changelogEntry,
        pkg
      );
    } else {
      updatedChangelog = await this.newChangelogEntry(
        changelogEntry,
        changelogPath,
        pkg
      );
    }
    if (updatedChangelog) {
      changes.set(changelogPath, {
        content: updatedChangelog,
        mode: '100644',
      });
    }
  }

  /**
   * Update node monorepo workspace package dependencies.
   * Inspired by and using a subset of the logic from `lerna version`
   */
  async run(
    newManifestVersions: VersionsMap,
    pkgsWithPRData: ManifestPackageWithPRData[]
  ): Promise<[VersionsMap, ManifestPackageWithPRData[]]> {
    const rpUpdatedPkgs = this.filterPackages(pkgsWithPRData);
    const allPkgs = await this.getAllWorkspacePackages(rpUpdatedPkgs);
    const allUpdated = await this.runLernaVersion(rpUpdatedPkgs, allPkgs);
    await this.updatePkgsWithPRData(
      pkgsWithPRData,
      newManifestVersions,
      allUpdated,
      allPkgs
    );

    return [newManifestVersions, pkgsWithPRData];
  }
}
