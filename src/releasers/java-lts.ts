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

import {ReleaseCandidate} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag} from '../github';
import {VersionsMap} from '../updaters/update';

// Java
import {Version} from './java/version';
import {JavaBase} from './java-base';
import {BranchName} from '../util/branch-name';
import {PullRequestTitle} from '../util/pull-request-title';

export class JavaLTS extends JavaBase {
  protected async coerceVersions(
    _cc: ConventionalCommits,
    _candidate: ReleaseCandidate,
    _latestTag: GitHubTag | undefined,
    currentVersions: VersionsMap
  ): Promise<VersionsMap> {
    const bumpType = this.snapshot ? 'snapshot' : 'lts';
    const newVersions: VersionsMap = new Map<string, string>();
    for (const [k, version] of currentVersions) {
      newVersions.set(k, Version.parse(version).bump(bumpType).toString());
    }
    return newVersions;
  }

  protected async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined,
    _preRelease = false
  ): Promise<ReleaseCandidate> {
    const bumpType = this.snapshot ? 'snapshot' : 'lts';

    const version = Version.parse(
      latestTag?.version ?? this.defaultInitialVersion()
    )
      .bump(bumpType)
      .toString();

    return {
      previousTag: latestTag?.version,
      version,
    };
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
