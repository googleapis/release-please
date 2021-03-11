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
import {ConventionalChangelogCommit} from '@conventional-commits/parser';

import {ConventionalCommits} from '../conventional-commits';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

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
  'pubsublite',
  'spanner',
  'storage',
];
const REGEN_PR_REGEX = /.*auto-regenerate.*/;

export class GoYoshi extends ReleasePR {
  changelogPath = 'CHANGES.md';

  protected async _run(): Promise<number | undefined> {
    const packageName = await this.getPackageName();
    const latestTag = await this.latestTag(
      this.monorepoTags ? `${packageName.getComponent()}-` : undefined,
      false
    );
    let regenPR: Commit | undefined;
    let sha: null | string = null;
    const commits = (
      await this.commits({
        sha: latestTag?.sha,
        path: this.path,
      })
    ).filter(commit => {
      // Store the very first SHA returned, this represents the HEAD of the
      // release being created:
      if (!sha) {
        sha = commit.sha;
      }

      if (
        this.gh.repo === 'google-api-go-client' &&
        REGEN_PR_REGEX.test(commit.message)
      ) {
        // Only have a single entry of the nightly regen listed in the changelog.
        // If there are more than one of these commits, append associated PR.
        const issueRe = /(?<prefix>.*)\((?<pr>.*)\)(\n|$)/;
        if (regenPR) {
          const match = commit.message.match(issueRe);
          if (match?.groups?.pr) {
            regenPR.message += `\nRefs ${match.groups.pr}`;
          }
          return false;
        } else {
          // Throw away the sha for nightly regens, will just append PR numbers.
          commit.sha = null;
          regenPR = commit;

          const match = commit.message.match(issueRe);
          if (match?.groups?.pr) {
            regenPR.message = `${match.groups.prefix}\n\nRefs ${match.groups.pr}`;
          }
        }
      }
      return true;
    });
    const cc = new ConventionalCommits({
      commits: commits,
      owner: this.gh.owner,
      repository: this.gh.repo,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      commitFilter: this.filterSubModuleCommits(this.gh.repo, packageName.name),
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      cc,
      latestTag
    );
    // "closes" is a little presumptuous, let's just indicate that the
    // PR references these other commits:
    const changelogEntry: string = (
      await cc.generateChangelogEntry({
        version: candidate.version,
        currentTag: await this.normalizeTagName(candidate.version),
        previousTag: candidate.previousTag
          ? await this.normalizeTagName(candidate.previousTag)
          : undefined,
      })
    ).replace(/, closes /g, ', refs ');

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
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );
    if (!sha) {
      throw Error('no sha found for pull request');
    }
    return await this.openPR({
      sha: sha!,
      changelogEntry,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    });
  }

  private isGapicRepo(repo: string): boolean {
    return repo === 'google-cloud-go';
  }

  private isMultiClientRepo(repo: string): boolean {
    return repo === 'google-cloud-go' || repo === 'google-api-go-client';
  }

  defaultInitialVersion(): string {
    return '0.1.0';
  }

  tagSeparator(): string {
    return '/';
  }

  private filterSubModuleCommits(
    repo: string,
    packageName: string
  ): (c: ConventionalChangelogCommit) => boolean {
    return (c: ConventionalChangelogCommit) => {
      if (this.isGapicRepo(repo)) {
        // Filter commits that don't have a scope as we don't know where to put
        // them.
        if (!c.scope) {
          return true;
        }
        // Skipping commits related to sub-modules as they are not apart of the
        // parent module.
        if (!this.monorepoTags) {
          for (const subModule of SUB_MODULES) {
            if (c.scope === subModule || c.scope.startsWith(subModule + '/')) {
              return true;
            }
          }
        } else {
          if (
            !(c.scope === packageName || c.scope.startsWith(packageName + '/'))
          ) {
            return true;
          }
        }
      }
      return false;
    };
  }
}
