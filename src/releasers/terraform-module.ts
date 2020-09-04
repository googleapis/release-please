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
import {GitHubTag} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
// Terraform specific.
import {ReadMe} from '../updaters/terraform/readme';

export class TerraformModule extends ReleasePR {
  static releaserName = 'terraform-module';
  protected async _run() {
    const latestTag: GitHubTag | undefined = await this.gh.latestTag(
      this.monorepoTags ? `${this.packageName}-` : undefined
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
      return;
    }

    const updates: Update[] = [];

    updates.push(
      new Changelog({
        path: this.addPath('CHANGELOG.md'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    updates.push(
      new ReadMe({
        path: this.addPath('README.md'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    await this.openPR({
      sha: commits[0].sha!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    });
  }

  protected defaultInitialVersion(): string {
    return '0.1.0';
  }
}
