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

import {ReleasePR, ReleaseCandidate, OpenPROptions} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag} from '../github';
import {checkpoint, CheckpointType} from '../util/checkpoint';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

// Generic
import {Changelog} from '../updaters/changelog';
// Python specific.
import {SetupPy} from '../updaters/python/setup-py';
import {SetupCfg} from '../updaters/python/setup-cfg';
import {VersionPy} from '../updaters/python/version-py';

const CHANGELOG_SECTIONS = [
  {type: 'feat', section: 'Features'},
  {type: 'fix', section: 'Bug Fixes'},
  {type: 'perf', section: 'Performance Improvements'},
  {type: 'deps', section: 'Dependencies'},
  {type: 'revert', section: 'Reverts'},
  {type: 'docs', section: 'Documentation'},
  {type: 'style', section: 'Styles', hidden: true},
  {type: 'chore', section: 'Miscellaneous Chores', hidden: true},
  {type: 'refactor', section: 'Code Refactoring', hidden: true},
  {type: 'test', section: 'Tests', hidden: true},
  {type: 'build', section: 'Build System', hidden: true},
  {type: 'ci', section: 'Continuous Integration', hidden: true},
];

export class Python extends ReleasePR {
  protected async _getOpenPROptions(
    commits: Commit[],
    latestTag?: GitHubTag
  ): Promise<OpenPROptions | undefined> {
    const cc = new ConventionalCommits({
      commits,
      owner: this.gh.owner,
      repository: this.gh.repo,
      bumpMinorPreMajor: this.bumpMinorPreMajor,
      changelogSections: this.changelogSections || CHANGELOG_SECTIONS,
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

    const packageName = await this.getPackageName();
    updates.push(
      new Changelog({
        path: this.addPath(this.changelogPath),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    updates.push(
      new SetupCfg({
        path: this.addPath('setup.cfg'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );
    updates.push(
      new SetupPy({
        path: this.addPath('setup.py'),
        changelogEntry,
        version: candidate.version,
        packageName: packageName.name,
      })
    );

    // There should be only one version.py, but foreach in case that is incorrect
    const versionPyFilesSearch = this.gh.findFilesByFilename(
      'version.py',
      this.path
    );
    const versionPyFiles = await versionPyFilesSearch;
    versionPyFiles.forEach(path => {
      updates.push(
        new VersionPy({
          path: this.addPath(path),
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );
    });
    return {
      sha: commits[0].sha!,
      changelogEntry: `${changelogEntry}\n---\n`,
      updates,
      version: candidate.version,
      includePackageName: this.monorepoTags,
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

  defaultInitialVersion(): string {
    return '0.1.0';
  }
}
