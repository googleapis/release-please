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

import {ReleaseType} from 'semver';
import * as semver from 'semver';

// Generic
import {Changelog} from '../updaters/changelog';

// Commits containing a scope prefixed with an item in this array will be
// ignored when generating a release PR for the parent module.
const SUB_MODULES = [
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
    const scopeRe = /^\w+\((?<scope>.*)\):/;
    const latestTag = await this.gh.latestTag(
      this.monorepoTags ? `${this.packageName}-` : undefined
    );
    let gapicPR: Commit | undefined;
    const commits = (
      await this.commits({
        sha: latestTag?.sha,
        path: this.path,
      })
    ).filter(commit => {
      // Filter commits that don't have a scope as we don't know where to put
      // them.
      const scope = commit.message.match(scopeRe)?.groups?.scope;
      if (!scope) {
        return false;
      }
      // Skipping commits related to sub-modules as they are not apart of the
      // parent module.
      for (const subModule of SUB_MODULES) {
        if (scope.startsWith(subModule)) {
          // TODO(codyoss): eventually gather these commits into a map so we can
          // purpose releases for sub-modules.
          return false;
        }
      }
      // Only have a single entry of the nightly regen listed in the changelog.
      // If there are more than one of these commits, append associated PR.
      if (GAPIC_PR_REGEX.test(commit.message)) {
        if (gapicPR) {
          const issueRe = /.*(?<pr>\(.*\))$/;
          const match = commit.message.match(issueRe);
          if (match?.groups?.pr) {
            gapicPR.message = `${gapicPR.message} ${match.groups.pr}`;
          }
          return false;
        } else {
          // Throw away the sha for nightly regens, will just append PR numbers.
          commit.sha = null;
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

    let changelogEntry: string = await cc.generateChangelogEntry({
      version: candidate.version,
      currentTag: `v${candidate.version}`,
      previousTag: candidate.previousTag,
    });

    // remove commit reference from auto-generate gapics
    changelogEntry = changelogEntry.replace(/\s\(\[null\].*\n/, '\n');

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
