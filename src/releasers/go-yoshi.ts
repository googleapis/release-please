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
import {Octokit} from '@octokit/rest';
import {PromiseValue} from 'type-fest';
type PullsListResponseItems = PromiseValue<
  ReturnType<InstanceType<typeof Octokit>['pulls']['list']>
>['data'];

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

import {ReleaseType} from 'semver';
import * as semver from 'semver';

// Generic
import {Changelog} from '../updaters/changelog';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');

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
const SCOPE_REGEX = /^\w+\((?<scope>.*)\):/;

export class GoYoshi extends ReleasePR {
  static releaserName = 'go-yoshi';
  protected async _run(): Promise<number | undefined> {
    const latestTag = await this.gh.latestTag(
      this.monorepoTags ? `${this.packageName}-` : undefined,
      false
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_owner, repo] = parseGithubRepoUrl(this.repoUrl);
    let regenPR: Commit | undefined;
    let sha: null | string = null;
    const commits = (
      await this.commits({
        sha: latestTag?.sha,
        path: this.path,
      })
    ).filter(commit => {
      if (this.isGapicRepo(repo)) {
        const scope = commit.message.match(SCOPE_REGEX)?.groups?.scope;
        // Filter commits that don't have a scope as we don't know where to put
        // them.
        if (!scope) {
          return false;
        }
        // Skipping commits related to sub-modules as they are not apart of the
        // parent module.
        if (!this.monorepoTags) {
          for (const subModule of SUB_MODULES) {
            if (scope === subModule || scope.startsWith(subModule + '/')) {
              return false;
            }
          }
        } else {
          if (
            !(
              scope === this.packageName ||
              scope.startsWith(this.packageName + '/')
            )
          ) {
            return false;
          }
        }
      }

      // Store the very first SHA returned, this represents the HEAD of the
      // release being created:
      if (!sha) {
        sha = commit.sha;
      }

      if (this.isMultiClientRepo(repo) && REGEN_PR_REGEX.test(commit.message)) {
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
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
    });
    const candidate: ReleaseCandidate =
      this.monorepoTags ||
      !(this.isMultiClientRepo(repo) || this.isGapicRepo(repo))
        ? // Submodules use conventional commits to bump major/minor/patch:
          await super.coerceReleaseCandidate(cc, latestTag)
        : // Root module always bumps minor:
          await this.coerceReleaseCandidate(cc, latestTag);

    // "closes" is a little presumptuous, let's just indicate that the
    // PR references these other commits:
    const changelogEntry: string = (
      await cc.generateChangelogEntry({
        version: candidate.version,
        currentTag: `v${candidate.version}`,
        previousTag: candidate.previousTag,
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
        path: this.addPath('CHANGES.md'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
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

  static tagSeparator(): string {
    return '/';
  }
}
