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

import {readFileSync} from 'fs';
import {resolve} from 'path';
import {ReleasePR, ReleaseCandidate} from '../release-pr';

import {ConventionalCommits} from '../conventional-commits';
import {GitHubTag} from '../github';
import {indentCommit} from '../util/indent-commit';
import {Update} from '../updaters/update';
import {Commit} from '../graphql-to-commits';

import {Changelog} from '../updaters/changelog';
import {VersionRB} from '../updaters/version-rb';
import {logger} from '../util/logger';

const CHANGELOG_SECTIONS = [
  {type: 'feat', section: 'Features'},
  {type: 'fix', section: 'Bug Fixes'},
  {type: 'perf', section: 'Performance Improvements'},
  {type: 'revert', section: 'Reverts'},
  {type: 'docs', section: 'Documentation'},
  {type: 'style', section: 'Styles', hidden: true},
  {type: 'chore', section: 'Miscellaneous Chores', hidden: true},
  {type: 'refactor', section: 'Code Refactoring', hidden: true},
  {type: 'test', section: 'Tests', hidden: true},
  {type: 'build', section: 'Build System', hidden: true},
  {type: 'ci', section: 'Continuous Integration', hidden: true},
];

export class RubyYoshi extends ReleasePR {
  protected async _run(): Promise<number | undefined> {
    const packageName = await this.getPackageName();
    const lastReleaseSha: string | undefined = this.lastPackageVersion
      ? await this.gh.getTagSha(
          `${packageName.getComponent()}/v${this.lastPackageVersion}`
        )
      : undefined;
    const commits: Commit[] = await this.commits({
      sha: lastReleaseSha,
      path: packageName.name,
    });
    if (commits.length === 0) {
      logger.error(`no commits found since ${lastReleaseSha}`);
      return undefined;
    } else {
      const cc = new ConventionalCommits({
        commits: postProcessCommits(commits),
        owner: this.gh.owner,
        repository: this.gh.repo,
        bumpMinorPreMajor: this.bumpMinorPreMajor,
        commitPartial: readFileSync(
          resolve(__dirname, '../../../templates/commit.hbs'),
          'utf8'
        ),
        headerPartial: readFileSync(
          resolve(__dirname, '../../../templates/header.hbs'),
          'utf8'
        ),
        mainTemplate: readFileSync(
          resolve(__dirname, '../../../templates/template.hbs'),
          'utf8'
        ),
        changelogSections: CHANGELOG_SECTIONS,
      });
      const candidate: ReleaseCandidate = await this.coerceReleaseCandidate(
        cc,
        {
          version: this.lastPackageVersion,
          name: this.lastPackageVersion,
        } as GitHubTag
      );
      const changelogEntry: string = await cc.generateChangelogEntry({
        version: candidate.version,
        currentTag: `v${candidate.version}`,
        previousTag: undefined,
      });

      // don't create a release candidate until user facing changes
      // (fix, feat, BREAKING CHANGE) have been made; a CHANGELOG that's
      // one line is a good indicator that there were no interesting commits.
      if (this.changelogEmpty(changelogEntry)) {
        logger.error(
          `no user facing commits found since ${
            lastReleaseSha ? lastReleaseSha : 'beginning of time'
          }`
        );
        return undefined;
      }

      const updates: Update[] = [];

      updates.push(
        new Changelog({
          path: `${packageName.name}/CHANGELOG.md`,
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );

      updates.push(
        new VersionRB({
          path: `${packageName.name}/lib/${packageName.name.replace(
            /-/g,
            '/'
          )}/version.rb`,
          changelogEntry,
          version: candidate.version,
          packageName: packageName.name,
        })
      );

      return await this.openPR({
        sha: commits[0].sha!,
        changelogEntry: `${changelogEntry}\n---\n${this.summarizeCommits(
          lastReleaseSha,
          commits,
          packageName.name
        )}\n`,
        updates,
        version: candidate.version,
        includePackageName: true,
      });
    }
  }
  // create a summary of the commits landed since the last release,
  // for the benefit of the release PR.
  private summarizeCommits(
    lastReleaseSha: string | undefined,
    commits: Commit[],
    packageName: string
  ): string {
    // summarize the commits that landed:
    let summary = '### Commits since last release:\n\n';
    const updatedFiles: {[key: string]: boolean} = {};
    const repoUrl = `${this.gh.owner}/${this.gh.repo}`;
    commits.forEach(commit => {
      if (commit.sha === null) return;
      const splitMessage = commit.message.split('\n');
      summary += `* [${splitMessage[0]}](https://github.com/${repoUrl}/commit/${commit.sha})\n`;
      if (splitMessage.length > 2) {
        summary = `${summary}<pre><code>${splitMessage
          .slice(1)
          .join('\n')}</code></pre>\n`;
      }
      commit.files.forEach(file => {
        if (file.startsWith(packageName)) {
          updatedFiles[file] = true;
        }
      });
    });
    // summarize the files that changed:
    summary = `${summary}\n### Files edited since last release:\n\n<pre><code>`;
    Object.keys(updatedFiles).forEach(file => {
      summary += `${file}\n`;
    });
    return `${summary}</code></pre>\n[Compare Changes](https://github.com/${repoUrl}/compare/${lastReleaseSha}...HEAD)\n`;
  }
}

function postProcessCommits(commits: Commit[]): Commit[] {
  commits.forEach(commit => {
    commit.message = indentCommit(commit);
  });
  return commits;
}
