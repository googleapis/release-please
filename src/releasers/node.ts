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

import {ReleasePR, ReleaseCandidate} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHub, GitHubTag, GitHubFileContents} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {packageBranchPrefix} from '../util/package-branch-prefix';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
// JavaScript
import {PackageJson} from '../updaters/package-json';
import {SamplesPackageJson} from '../updaters/samples-package-json';

export class Node extends ReleasePR {
  static releaserName = 'node';
  protected async _run(): Promise<number | undefined> {
    // Make an effort to populate packageName from the contents of
    // the package.json, rather than forcing this to be set:
    const contents: GitHubFileContents = await this.gh.getFileContents(
      this.addPath('package.json')
    );
    const pkg = JSON.parse(contents.parsedContent);
    if (pkg.name) this.packageName = pkg.name;

    const latestTag: GitHubTag | undefined = await this.gh.latestTag(
      this.monorepoTags
        ? `${packageBranchPrefix(this.packageName, 'node')}-`
        : undefined
    );
    const commits: Commit[] = await this.commits({
      sha: latestTag ? latestTag.sha : undefined,
      path: this.path,
    });

    const cc = new ConventionalCommits({
      commits,
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      changelogSections: this.changelogSections,
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      cc,
      latestTag
    );
    const changelogEntry: string = await cc.generateChangelogEntry({
      version: candidate.version,
      currentTag: `v${candidate.version}`,
      previousTag: candidate.previousTag,
    });

    // don't create a release candidate until user facing changes
    // (fix, feat, BREAKING CHANGE) have been made; a CHANGELOG that's
    // one line is a good indicator that there were no interesting commits.
    if (this.changelogEmpty(changelogEntry)) {
      checkpoint(
        `no user facing commits found since ${
          latestTag ? latestTag.sha : 'beginning of time'
        }`,
        CheckpointType.Failure
      );
      return undefined;
    }

    const updates: Update[] = [];

    updates.push(
      new PackageJson({
        path: this.addPath('package-lock.json'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    updates.push(
      new SamplesPackageJson({
        path: this.addPath('samples/package.json'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    updates.push(
      new Changelog({
        path: this.addPath('CHANGELOG.md'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    updates.push(
      new PackageJson({
        path: this.addPath('package.json'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
        contents,
      })
    );

    return await this.openPR({
      sha: commits[0].sha!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    });
  }

  // A releaser can implement this method to automatically detect
  // the release name when creating a GitHub release, for instance by returning
  // name in package.json, or setup.py.
  static async lookupPackageName(
    gh: GitHub,
    path?: string
  ): Promise<string | undefined> {
    // Make an effort to populate packageName from the contents of
    // the package.json, rather than forcing this to be set:
    const contents: GitHubFileContents = await gh.getFileContents(
      this.addPathStatic('package.json', path)
    );
    const pkg = JSON.parse(contents.parsedContent);
    if (pkg.name) return pkg.name;
    else return undefined;
  }
}
