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

import {indentCommit} from '../util/indent-commit';

// Generic
import {Changelog} from '../updaters/changelog';

// RubyYoshi
import {VersionRB} from '../updaters/ruby/version-rb';
import {BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions} from './base';
import {ConventionalCommit} from '../commit';
import {Update} from '../update';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {Release} from '../release';
import {Version} from '../version';
import {TagName} from '../util/tag-name';
import {ROOT_PROJECT_PATH} from '../manifest';
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

interface RubyYoshiStrategyOptions extends BaseStrategyOptions {
  versionFile?: string;
}

export class RubyYoshi extends BaseStrategy {
  readonly versionFile: string;
  constructor(options: RubyYoshiStrategyOptions) {
    super({
      ...options,
      changelogSections: CHANGELOG_SECTIONS,
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
      tagSeparator: '/',
    });
    this.versionFile = options.versionFile ?? '';
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    const versionFile: string = this.versionFile
      ? this.versionFile
      : `lib/${(this.component || '').replace(/-/g, '/')}/version.rb`;
    updates.push({
      path: this.addPath(versionFile),
      createIfMissing: false,
      updater: new VersionRB({
        version,
      }),
    });
    return updates;
  }

  protected postProcessCommits(
    commits: ConventionalCommit[]
  ): ConventionalCommit[] {
    commits.forEach(commit => {
      commit.message = indentCommit(commit);
    });
    return commits;
  }

  protected async buildReleaseNotes(
    conventionalCommits: ConventionalCommit[],
    newVersion: Version,
    newVersionTag: TagName,
    latestRelease?: Release
  ): Promise<string> {
    const releaseNotes = await super.buildReleaseNotes(
      conventionalCommits,
      newVersion,
      newVersionTag,
      latestRelease
    );
    if (!latestRelease) {
      return releaseNotes;
    }
    // summarize the commits that landed:
    let summary = '### Commits since last release:\n\n';
    const updatedFiles: {[key: string]: boolean} = {};
    const repoUrl = `${this.repository.owner}/${this.repository.repo}`;
    for (const commit of conventionalCommits) {
      if (!commit.sha) continue;
      const splitMessage = commit.message.split('\n');
      summary += `* [${splitMessage[0]}](https://github.com/${repoUrl}/commit/${commit.sha})\n`;
      if (splitMessage.length > 2) {
        summary = `${summary}<pre><code>${splitMessage
          .slice(1)
          .join('\n')}</code></pre>\n`;
      }
      if (commit.files === undefined) {
        logger.error('No files for commit - this is likely a bug.');
        continue;
      }
      commit.files.forEach(file => {
        if (this.path === ROOT_PROJECT_PATH || file.startsWith(this.path)) {
          updatedFiles[file] = true;
        }
      });
    }
    // summarize the files that changed:
    summary = `${summary}\n### Files edited since last release:\n\n<pre><code>`;
    Object.keys(updatedFiles).forEach(file => {
      summary += `${file}\n`;
    });
    summary += `</code></pre>\n[Compare Changes](https://github.com/${repoUrl}/compare/${latestRelease.sha}...HEAD)\n`;
    return releaseNotes + `\n---\n${summary}`;
  }
}
