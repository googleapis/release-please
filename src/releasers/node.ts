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

import {
  ReleasePR,
  ReleaseCandidate,
  OpenPROptions,
  PackageName,
} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag, GitHubFileContents} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
// JavaScript
import {PackageJson} from '../updaters/package-json';
import {SamplesPackageJson} from '../updaters/samples-package-json';

export class Node extends ReleasePR {
  private pkgJsonContents?: GitHubFileContents;
  private _packageName?: string;

  protected async _getOpenPROptions(
    commits: Commit[],
    latestTag?: GitHubTag
  ): Promise<OpenPROptions | undefined> {
    const cc = new ConventionalCommits({
      commits,
      owner: this.gh.owner,
      repository: this.gh.repo,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      bumpPatchForMinorPreMajor: this.bumpPatchForMinorPreMajor,
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
      checkpoint(
        `no user facing commits found since ${
          latestTag ? latestTag.sha : 'beginning of time'
        }`,
        CheckpointType.Failure
      );
      return undefined;
    }

    const updates: Update[] = [];

    const packageName = (await this.getPackageName()).name;
    updates.push(
      new PackageJson({
        path: this.addPath('package-lock.json'),
        changelogEntry,
        version: candidate.version,
        packageName,
      })
    );

    updates.push(
      new SamplesPackageJson({
        path: this.addPath('samples/package.json'),
        changelogEntry,
        version: candidate.version,
        packageName,
      })
    );

    updates.push(
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName,
      })
    );

    updates.push(
      new PackageJson({
        path: this.addPath('package.json'),
        changelogEntry,
        version: candidate.version,
        packageName,
        contents: await this.getPkgJsonContents(),
      })
    );
    return {
      sha: commits[0].sha!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
    };
  }

  // Always prefer the package.json name
  async getPackageName(): Promise<PackageName> {
    if (this._packageName === undefined) {
      const pkgJsonContents = await this.getPkgJsonContents();
      const pkg = JSON.parse(pkgJsonContents.parsedContent);
      this.packageName = this._packageName = pkg.name ?? this.packageName;
    }
    return {
      name: this.packageName,
      getComponent: () =>
        this.packageName.match(/^@[\w-]+\//)
          ? this.packageName.split('/')[1]
          : this.packageName,
    };
  }

  protected async _run(): Promise<number | undefined> {
    const packageName = await this.getPackageName();
    const latestTag: GitHubTag | undefined = await this.latestTag(
      this.monorepoTags ? `${packageName.getComponent()}-` : undefined
    );
    const commits: Commit[] = await this.commits({
      sha: latestTag ? latestTag.sha : undefined,
      path: this.path,
    });
    const openPROptions = await this.getOpenPROptions(commits, latestTag);
    return openPROptions ? await this.openPR(openPROptions) : undefined;
  }

  private async getPkgJsonContents(): Promise<GitHubFileContents> {
    if (!this.pkgJsonContents) {
      this.pkgJsonContents = await this.gh.getFileContents(
        this.addPath('package.json')
      );
    }
    return this.pkgJsonContents;
  }
}
