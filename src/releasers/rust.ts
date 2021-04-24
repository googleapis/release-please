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

import {ReleasePR, ReleaseCandidate} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubFileContents, GitHubTag} from '../github';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
// Cargo.toml support
import {CargoToml} from '../updaters/rust/cargo-toml';
import {CargoLock} from '../updaters/rust/cargo-lock';
import {CargoManifest, parseCargoManifest} from '../updaters/rust/common';
import {logger} from '../util/logger';

export class Rust extends ReleasePR {
  protected async _run(): Promise<number | undefined> {
    const prefix = this.monorepoTags ? `${this.packageName}-` : undefined;

    const latestTag: GitHubTag | undefined = await this.latestTag(prefix);
    const commits: Commit[] = await this.commits({
      sha: latestTag ? latestTag.sha : undefined,
      path: this.path,
    });

    const cc = new ConventionalCommits({
      commits,
      owner: this.gh.owner,
      repository: this.gh.repo,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      changelogSections: this.changelogSections,
    });
    const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
      cc,
      latestTag
    );

    const changelogEntry: string = await cc.generateChangelogEntry({
      version: candidate.version,
      currentTag: await this.normalizeTagName(candidate.version),
      previousTag: candidate.previousTag
        ? await this.normalizeTagName(candidate.previousTag)
        : undefined,
    });

    // don't create a release candidate until user facing changes
    // (fix, feat, BREAKING CHANGE) have been made; a CHANGELOG that's
    // one line is a good indicator that there were no interesting commits.
    if (this.changelogEmpty(changelogEntry)) {
      logger.error(
        `no user facing commits found since ${
          latestTag ? latestTag.sha : 'beginning of time'
        }`
      );
      return undefined;
    }

    const workspaceManifest = await this.getWorkspaceManifest();

    const updates: Update[] = [];

    updates.push(
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    const manifestPaths: string[] = [];
    let lockPath: string;

    if (
      workspaceManifest &&
      workspaceManifest.workspace &&
      workspaceManifest.workspace.members
    ) {
      const members = workspaceManifest.workspace.members;
      logger.info(
        `found workspace with ${members.length} members, upgrading all`
      );
      for (const member of members) {
        manifestPaths.push(`${member}/Cargo.toml`);
      }
      lockPath = 'Cargo.lock';
    } else {
      const manifestPath = this.addPath('Cargo.toml');
      logger.info(`single crate found, updating ${manifestPath}`);
      manifestPaths.push(this.addPath('Cargo.toml'));
      lockPath = this.addPath('Cargo.lock');
    }

    const versions = new Map();
    versions.set(this.packageName, candidate.version);

    for (const path of manifestPaths) {
      updates.push(
        new CargoToml({
          path,
          changelogEntry,
          version: 'unused',
          versions,
          packageName: this.packageName,
        })
      );
    }

    if (await this.exists(lockPath)) {
      updates.push(
        new CargoLock({
          path: lockPath,
          changelogEntry,
          version: 'unused',
          versions,
          packageName: this.packageName,
        })
      );
    }

    return await this.openPR({
      sha: commits[0].sha!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    });
  }

  protected async commits(opts: GetCommitsOptions): Promise<Commit[]> {
    const sha = opts.sha;
    const perPage = opts.perPage || 100;
    const labels = opts.labels || false;
    const path = opts.path || undefined;

    if (!path) {
      return await this.gh.commitsSinceSha(sha, perPage, labels, null);
    }

    // ReleasePR.commits() does not work well with monorepos. If a release tag
    // points to a sha1 that isn't in the history for the given `path`, it wil
    // generate a changelog *from the last 100 commits*, ignoring the `sha`
    // completely.

    // To avoid that, we first fetch commits without a path:
    const relevantCommits = new Set();
    for (const commit of await this.gh.commitsSinceSha(
      sha,
      perPage,
      labels,
      null
    )) {
      relevantCommits.add(commit.sha);
    }

    // Then fetch commits for the path (this will include commits for
    // previous versions)
    const allPathCommits = await this.gh.commitsSinceSha(
      sha,
      perPage,
      labels,
      path
    );

    // Then keep only the "path commits" that are relevant for this release
    const commits = allPathCommits.filter(commit =>
      relevantCommits.has(commit.sha)
    );

    if (commits.length) {
      logger.info(
        `found ${commits.length} commits for ${path} since ${
          sha ? sha : 'beginning of time'
        }`
      );
    } else {
      logger.error(`no commits found since ${sha}`);
    }

    return commits;
  }

  defaultInitialVersion(): string {
    return '0.1.0';
  }

  protected async getWorkspaceManifest(): Promise<CargoManifest | null> {
    let content: GitHubFileContents;
    try {
      content = await this.gh.getFileContents('Cargo.toml');
    } catch (e) {
      return null;
    }
    return parseCargoManifest(content.parsedContent);
  }

  protected async exists(path: string): Promise<boolean> {
    try {
      await this.gh.getFileContents(path);
      return true;
    } catch (_e) {
      return false;
    }
  }
}

interface GetCommitsOptions {
  sha?: string;
  perPage?: number;
  labels?: boolean;
  path?: string;
}
