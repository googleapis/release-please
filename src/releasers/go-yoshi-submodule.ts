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

import {ReleasePR, ReleaseCandidate} from '../release-pr';
import {ConventionalCommits} from '../conventional-commits';
import {GitHub, GitHubTag, GitHubFileContents} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';

// Generic
import {Changelog} from '../updaters/changelog';

const SCOPE_REGEX = /^\w+\((?<scope>.*)\):/;

export class GoYoshiSubmodule extends ReleasePR {
  static releaserName = 'go-yoshi-submodule';
  protected async _run() {
    if (!this.packageName) {
      throw Error('GoYoshiSubmodule requires this.packageName');
    }
    // Get tag relative to module/v1.0.0:
    const latestTag: GitHubTag | undefined = await this.gh.latestTag(
      `${this.packageName}/`,
      false,
      `${this.packageName}-`
    );
    const commits = (
      await this.commits({
        sha: latestTag?.sha,
        path: this.path,
      })
    ).filter(commit => {
      const scope = commit.message.match(SCOPE_REGEX)?.groups?.scope;
      // Filter commits that don't have a scope as we don't know where to put
      // them.
      if (!scope) {
        return false;
      }
      // Only use commits that match our scope:
      if (
        scope === this.packageName ||
        scope.startsWith(this.packageName + '/')
      ) {
        return true;
      } else {
        return false;
      }
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
      return;
    }

    const updates: Update[] = [];

    updates.push(
      new Changelog({
        path: this.addPath('CHANGES.md'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    return this.openPR({
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
  static async lookupPackageName(gh: GitHub): Promise<string | undefined> {
    // Make an effort to populate packageName from the contents of
    // the package.json, rather than forcing this to be set:
    const contents: GitHubFileContents = await gh.getFileContents(
      'package.json'
    );
    const pkg = JSON.parse(contents.parsedContent);
    if (pkg.name) return pkg.name;
    else return undefined;
  }
}
