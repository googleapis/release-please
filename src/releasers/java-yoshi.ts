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

import {ReleaseCandidate, PackageName} from '../release-pr';

import {Update, VersionsMap} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';
// Java
import {GoogleUtils} from '../updaters/java/google-utils';
import {PomXML} from '../updaters/java/pom-xml';
import {VersionsManifest} from '../updaters/java/versions-manifest';
import {Readme} from '../updaters/java/readme';
import {JavaUpdate} from '../updaters/java/java_update';
import {BranchName} from '../util/branch-name';
import {PullRequestTitle} from '../util/pull-request-title';
import {JavaBase} from './java-base';

export class JavaYoshi extends JavaBase {
  protected async buildUpdates(
    changelogEntry: string,
    candidateVersions: VersionsMap,
    candidate: ReleaseCandidate,
    packageName: PackageName
  ): Promise<Update[]> {
    const updates: Update[] = [];
    if (!this.snapshot) {
      updates.push(
        new Changelog({
          path: this.changelogPath,
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: packageName.name,
        })
      );

      updates.push(
        new Readme({
          path: 'README.md',
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: packageName.name,
        })
      );

      updates.push(
        new GoogleUtils({
          // TODO(@chingor): should this use search like pom.xml?
          path:
            'google-api-client/src/main/java/com/google/api/client/googleapis/GoogleUtils.java',
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    }

    updates.push(
      new VersionsManifest({
        path: 'versions.txt',
        changelogEntry,
        versions: candidateVersions,
        version: candidate.version,
        packageName: packageName.name,
        contents: await this.getVersionManifestContent(),
      })
    );

    const pomFilesSearch = this.gh.findFilesByFilename('pom.xml');
    const buildFilesSearch = this.gh.findFilesByFilename('build.gradle');
    const dependenciesSearch = this.gh.findFilesByFilename(
      'dependencies.properties'
    );

    const pomFiles = await pomFilesSearch;
    pomFiles.forEach(path => {
      updates.push(
        new PomXML({
          path,
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });

    const buildFiles = await buildFilesSearch;
    buildFiles.forEach(path => {
      updates.push(
        new JavaUpdate({
          path,
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });

    const dependenciesFiles = await dependenciesSearch;
    dependenciesFiles.forEach(path => {
      updates.push(
        new JavaUpdate({
          path,
          changelogEntry,
          versions: candidateVersions,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });
    return updates;
  }

  // Begin release configuration

  // Override this method to use static branch names
  // If you modify this, you must ensure that the releaser can parse the tag version
  // from the pull request.
  protected async buildBranchName(
    _version: string,
    includePackageName: boolean
  ): Promise<BranchName> {
    const defaultBranch = await this.gh.getDefaultBranch();
    const packageName = await this.getPackageName();
    if (includePackageName && packageName.getComponent()) {
      return BranchName.ofComponentTargetBranch(
        packageName.getComponent(),
        defaultBranch
      );
    }
    return BranchName.ofTargetBranch(defaultBranch);
  }

  // Override this method to modify the pull request title
  protected async buildPullRequestTitle(
    version: string,
    includePackageName: boolean
  ): Promise<string> {
    const defaultBranch = await this.gh.getDefaultBranch();
    const repoDefaultBranch = await this.gh.getRepositoryDefaultBranch();

    // If we are proposing a release to a non-default branch, add the target
    // branch in the pull request title.
    // TODO: consider pushing this change up to the default pull request title
    if (repoDefaultBranch === defaultBranch) {
      return super.buildPullRequestTitle(version, includePackageName);
    }
    const packageName = await this.getPackageName();
    const pullRequestTitle = includePackageName
      ? PullRequestTitle.ofComponentTargetBranchVersion(
          packageName.name,
          defaultBranch,
          version
        )
      : PullRequestTitle.ofTargetBranchVersion(defaultBranch, version);
    return pullRequestTitle.toString();
  }
}
