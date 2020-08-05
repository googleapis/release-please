// * we need a deny list of modules that are mono repos, which we keep track of
// ideally with minimal human intervention:
//   * these should not show up in CHANGELOG for an "all" release.
// * We need to also be able to manage the release of our snowflake, hand-written
// libraries. Which get released.
// * top level changes relate to all.

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
import {GitHubTag} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

import {ReleaseType} from 'semver';
import * as semver from 'semver';

// Generic
import {Changelog} from '../updaters/changelog';

// These repos should be ignored when generating a release for the
// top level mono-repo:
const IGNORED_PATHS = [
  'bigtable',
  'bigquery',
  'datastore',
  'firestore',
  'logging',
  'pubsub',
  'spanner',
  'storage',
];
const GAPIC_PR_REGEX = /.*auto-regenerate gapics.*/;

export class GoYoshi extends ReleasePR {
  static releaserName = 'go-yoshi';
  protected async _run() {
    const latestTag: GitHubTag | undefined = await this.gh.latestTag(
      this.monorepoTags ? `${this.packageName}-` : undefined
    );
    let gapicPR: Commit;
    const commits: Commit[] = (
      await this.commits({
        sha: latestTag ? latestTag.sha : undefined,
        path: this.path,
      })
    ).filter(commit => {
      for (const ignoredPath of IGNORED_PATHS) {
        const re = new RegExp(`^\\w+\\(${ignoredPath}.*\\)`);
        if (re.test(commit.message)) {
          return false;
        }
      }
      if (GAPIC_PR_REGEX.test(commit.message)) {
        if (gapicPR) {
          const issueRe = /.*(?<pr>\(.*\))$/;
          const match = commit.message.match(issueRe);
          if (match && match?.groups?.pr) {
            gapicPR.message = `${gapicPR.message} ${match.groups.pr}`;
          }
          return false;
        } else {
          gapicPR = commit;
        }
      }
      return true;
    });

    const cc = new ConventionalCommits({
      commits: commits,
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
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

    console.info(changelogEntry);

    updates.push(
      new Changelog({
        path: this.addPath('CHANGES.md'),
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

  protected async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined
  ): Promise<ReleaseCandidate> {
    const version = latestTag
      ? latestTag.version
      : this.defaultInitialVersion();
    const previousTag = latestTag ? latestTag.name : undefined;
    const bump: ReleaseType = 'minor';
    const candidate: string | null = semver.inc(version, bump);
    return {version: candidate as string, previousTag};
  }

  protected defaultInitialVersion(): string {
    return '0.1.0';
  }
}
