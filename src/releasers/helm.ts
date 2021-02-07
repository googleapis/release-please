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
import {GitHub, GitHubTag, GitHubFileContents} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
import * as yaml from 'js-yaml';
// helm
import {ChartYaml} from '../updaters/helm/chart-yaml';

export class Helm extends ReleasePR {
  static releaserName = 'helm';

  protected async _run(): Promise<number | undefined> {
    // Make an effort to populate packageName from the contents of
    // the package.json, rather than forcing this to be set:
    const contents: GitHubFileContents = await this.gh.getFileContents(
      this.addPath('Chart.yaml')
    );
    const file = yaml.load(contents.parsedContent, {json: true});
    if (file === null || file === undefined) {
      return undefined;
    }
    const pkg = JSON.parse(file.toString());
    if (pkg.name) {
      this.packageName = pkg.name;
      // we've rewritten the package name, recalculate the package prefix
      this.packagePrefix = this.coercePackagePrefix(pkg.name);
    }

    const latestTag: GitHubTag | undefined = await this.gh.latestTag(
      this.monorepoTags ? `${this.packagePrefix}-` : undefined
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
      new Changelog({
        path: this.addPath('CHANGELOG.md'),
        changelogEntry,
        version: candidate.version,
        packageName: this.packageName,
      })
    );

    updates.push(
      new ChartYaml({
        path: this.addPath('Chart.yaml'),
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
      this.addPathStatic('Chart.yaml', path)
    );
    const file = yaml.load(contents.parsedContent, {json: true});
    if (file === null || file === undefined) {
      return undefined;
    }
    const pkg = JSON.parse(file.toString());
    if (pkg.name) return pkg.name;
    else return undefined;
  }

  // Parse the package prefix for releases from the full package name
  // The package name usually looks like `@[group]/[library]`
  protected coercePackagePrefix(packageName: string): string {
    return packageName.match(/^@[\w-]+\//)
      ? packageName.split('/')[1]
      : packageName;
  }
}
