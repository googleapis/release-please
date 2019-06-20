/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PullsListResponseItem } from '@octokit/rest';
import * as semver from 'semver';

import { checkpoint, CheckpointType } from './util/checkpoint';
import { ConventionalCommits } from './conventional-commits';
import {
  GitHub,
  GitHubReleasePR,
  GitHubTag,
  GitHubFileContents,
} from './github';
import { Commit, graphqlToCommits } from './graphql-to-commits';
import { CommitSplit } from './commit-split';
import { Changelog } from './updaters/changelog';
import { PackageJson } from './updaters/package-json';
import { PHPClientVersion } from './updaters/php-client-version';
import { PHPManifest } from './updaters/php-manifest';
import { RootComposer } from './updaters/root-composer';
import { SamplesPackageJson } from './updaters/samples-package-json';
import { Version } from './updaters/version';
import { Update } from './updaters/update';

const parseGithubRepoUrl = require('parse-github-repo-url');

export enum ReleaseType {
  Node = 'node',
  PHPYoshi = 'php-yoshi',
}

export interface ReleasePROptions {
  bumpMinorPreMajor?: boolean;
  label: string;
  token?: string;
  repoUrl: string;
  packageName: string;
  releaseAs?: string;
  releaseType: ReleaseType;
  apiUrl: string;
  proxyKey?: string;
}

export interface ReleaseCandidate {
  version: string;
  previousTag?: string;
}

export class ReleasePR {
  apiUrl: string;
  labels: string[];
  gh: GitHub;
  bumpMinorPreMajor?: boolean;
  repoUrl: string;
  token: string | undefined;
  packageName: string;
  releaseAs?: string;
  releaseType: ReleaseType;
  proxyKey?: string;

  constructor(options: ReleasePROptions) {
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.labels = options.label.split(',');
    this.repoUrl = options.repoUrl;
    this.token = options.token;
    this.packageName = options.packageName;
    this.releaseAs = options.releaseAs;
    this.releaseType = options.releaseType;
    this.apiUrl = options.apiUrl;
    this.proxyKey = options.proxyKey;

    this.gh = this.gitHubInstance();
  }

  async run() {
    const pr: GitHubReleasePR | undefined = await this.gh.findMergedReleasePR(
      this.labels
    );
    if (pr) {
      // a PR already exists in the autorelease: pending state.
      checkpoint(
        `pull #${pr.number} ${pr.sha} has not yet been released`,
        CheckpointType.Failure
      );
    } else {
      switch (this.releaseType) {
        case ReleaseType.Node:
          return this.nodeRelease();
        case ReleaseType.PHPYoshi:
          return this.phpYoshiRelease();
        default:
          throw Error('unknown release type');
      }
    }
  }

  private async nodeRelease() {
    const latestTag: GitHubTag | undefined = await this.gh.latestTag();
    const commits: Commit[] = await this.commits(
      latestTag ? latestTag.sha : undefined
    );

    const cc = new ConventionalCommits({
      commits,
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
    if (changelogEmpty(changelogEntry)) {
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
        path: 'CHANGELOG.md',
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    updates.push(
      new PackageJson({
        path: 'package.json',
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    updates.push(
      new SamplesPackageJson({
        path: 'samples/package.json',
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    await this.openPR(
      commits[0].sha,
      `${changelogEntry}\n---\n`,
      updates,
      candidate.version
    );
  }

  private async phpYoshiRelease() {
    const latestTag: GitHubTag | undefined = await this.gh.latestTag();
    const commits: Commit[] = await this.commits(
      latestTag ? latestTag.sha : undefined
    );

    // we create an instance of conventional CHANGELOG for bumping the
    // top-level tag version we maintain on the mono-repo itself.
    const ccb = new ConventionalCommits({
      commits: [
        {
          sha: 'abc123',
          message: 'feat!: creating a release for PHP modules',
          files: [],
        },
      ],
      githubRepoUrl: this.repoUrl,
      bumpMinorPreMajor: true,
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      ccb,
      latestTag
    );

    // partition a set of packages in the mono-repo that need to be
    // updated since our last release -- the set of string keys
    // is sorted to ensure consistency in the CHANGELOG.
    const updates: Update[] = [];
    let changelogEntry = `## ${candidate.version}`;

    changelogEntry = await this.releaseAllPHPLibraries(
      commits,
      updates,
      changelogEntry
    );

    updates.push(
      new Changelog({
        path: 'CHANGELOG.md',
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    ['src/Version.php', 'src/ServiceBuilder.php'].forEach((path: string) => {
      updates.push(
        new PHPClientVersion({
          path,
          changelogEntry,
          version: candidate.version,
          packageName: this.packageName,
        })
      );
    });

    await this.openPR(
      commits[0].sha,
      changelogEntry,
      updates,
      candidate.version
    );
  }

  private async releaseAllPHPLibraries(
    commits: Commit[],
    updates: Update[],
    changelogEntry: string
  ): Promise<string> {
    const cs = new CommitSplit();
    const commitLookup: { [key: string]: Commit[] } = cs.split(commits);
    const pkgKeys: string[] = Object.keys(commitLookup).sort();
    // map of library names that need to be updated in the top level
    // composer.json and manifest.json.
    const versionUpdates: { [key: string]: string } = {};

    // walk each individual library updating the VERSION file, and
    // if necessary the `const VERSION` in the client library.
    for (let i = 0; i < pkgKeys.length; i++) {
      const pkgKey: string = pkgKeys[i];
      const cc = new ConventionalCommits({
        commits: commitLookup[pkgKey],
        githubRepoUrl: this.repoUrl,
        bumpMinorPreMajor: this.bumpMinorPreMajor,
      });

      // some packages in the mono-repo might have only had chores,
      // build updates, etc., applied.
      if (
        !changelogEmpty(await cc.generateChangelogEntry({ version: '0.0.0' }))
      ) {
        try {
          const contents: GitHubFileContents = await this.gh.getFileContents(
            `${pkgKey}/VERSION`
          );
          const bump = await cc.suggestBump(contents.parsedContent);
          const candidate: string | null = semver.inc(
            contents.parsedContent,
            bump.releaseType
          );
          if (!candidate) {
            checkpoint(
              `failed to update ${pkgKey} version`,
              CheckpointType.Failure
            );
            continue;
          }

          const meta = JSON.parse(
            (await this.gh.getFileContents(`${pkgKey}/composer.json`))
              .parsedContent
          );
          versionUpdates[meta.name] = candidate;

          changelogEntry = updatePHPChangelogEntry(
            `${meta.name} ${candidate}`,
            changelogEntry,
            await cc.generateChangelogEntry({ version: candidate })
          );

          updates.push(
            new Version({
              path: `${pkgKey}/VERSION`,
              changelogEntry,
              version: candidate,
              packageName: this.packageName,
              contents,
            })
          );

          // extra.component indicates an entry-point class file
          // that must have its version # updatd.
          if (
            meta.extra &&
            meta.extra.component &&
            meta.extra.component.entry
          ) {
            updates.push(
              new PHPClientVersion({
                path: `${pkgKey}/${meta.extra.component.entry}`,
                changelogEntry,
                version: candidate,
                packageName: this.packageName,
              })
            );
          }
        } catch (err) {
          if (err.status === 404) {
            // if the updated path has no VERSION, assume this isn't a
            // module that needs updating.
            continue;
          } else {
            throw err;
          }
        }
      }
    }

    // update the aggregate package information in the root
    // composer.json and manifest.json.
    updates.push(
      new RootComposer({
        path: 'composer.json',
        changelogEntry,
        version: '0.0.0',
        versions: versionUpdates,
        packageName: this.packageName,
      })
    );

    updates.push(
      new PHPManifest({
        path: 'docs/manifest.json',
        changelogEntry,
        version: '0.0.0',
        versions: versionUpdates,
        packageName: this.packageName,
      })
    );

    return changelogEntry;
  }

  private async closeStaleReleasePRs(currentPRNumber: number) {
    const prs: PullsListResponseItem[] = await this.gh.findOpenReleasePRs(
      this.labels
    );
    for (let i = 0, pr: PullsListResponseItem; i < prs.length; i++) {
      pr = prs[i];
      // don't close the most up-to-date release PR.
      if (pr.number !== currentPRNumber) {
        checkpoint(`closing pull #${pr.number}`, CheckpointType.Failure);
        await this.gh.closePR(pr.number);
      }
    }
  }

  private async coerceReleaseCandidate(
    cc: ConventionalCommits,
    latestTag: GitHubTag | undefined
  ): Promise<ReleaseCandidate> {
    const previousTag = latestTag ? latestTag.name : undefined;
    let version = latestTag ? latestTag.version : '1.0.0';

    if (latestTag && !this.releaseAs) {
      const bump = await cc.suggestBump(version);
      const candidate: string | null = semver.inc(version, bump.releaseType);
      if (!candidate) throw Error(`failed to increment ${version}`);
      version = candidate;
    } else if (this.releaseAs) {
      version = this.releaseAs;
    }

    return { version, previousTag };
  }

  private async commits(sha: string | undefined): Promise<Commit[]> {
    const commits = await this.gh.commitsSinceSha(sha);
    if (commits.length) {
      checkpoint(
        `found ${commits.length} commits since ${sha}`,
        CheckpointType.Success
      );
    } else {
      checkpoint(`no commits found since ${sha}`, CheckpointType.Failure);
    }
    return commits;
  }

  private gitHubInstance(): GitHub {
    const [owner, repo] = parseGithubRepoUrl(this.repoUrl);
    return new GitHub({
      token: this.token,
      owner,
      repo,
      apiUrl: this.apiUrl,
      proxyKey: this.proxyKey,
    });
  }

  private async openPR(
    sha: string,
    changelogEntry: string,
    updates: Update[],
    version: string
  ) {
    const title = `chore: release ${version}`;
    const body = `:robot: I have created a release \\*beep\\* \\*boop\\* \n---\n${changelogEntry}\n\nThis PR was generated with [Release Please](https://github.com/googleapis/release-please).`;
    const pr: number = await this.gh.openPR({
      branch: `release-v${version}`,
      version,
      sha,
      updates,
      title,
      body,
      labels: this.labels,
    });
    // a return of -1 indicates that PR was not updated.
    if (pr > 0) {
      await this.gh.addLabels(pr, this.labels);
      await this.closeStaleReleasePRs(pr);
    }
  }
}

function changelogEmpty(changelogEntry: string) {
  return changelogEntry.split('\n').length === 1;
}

function updatePHPChangelogEntry(
  pkgKey: string,
  changelogEntry: string,
  entryUpdate: string
) {
  {
    // Remove the first line of the entry, in favor of <summary>.
    // This also allows us to use the same regex for extracting release
    // notes (since the string "## v0.0.0" doesn't show up multiple times).
    const entryUpdateSplit: string[] = entryUpdate.split(/\r?\n/);
    entryUpdateSplit.shift();
    entryUpdate = entryUpdateSplit.join('\n');
  }
  return `${changelogEntry}

<details><summary>${pkgKey}</summary>

${entryUpdate}

</details>`;
}
