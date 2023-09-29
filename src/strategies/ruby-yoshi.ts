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
import {ConventionalCommit, Commit} from '../commit';
import {Update} from '../update';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import {Release} from '../release';
import {TagName} from '../util/tag-name';
import {Version} from '../version';

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

export class RubyYoshi extends BaseStrategy {
  readonly versionFile: string;
  constructor(options: BaseStrategyOptions) {
    super({
      ...options,
      changelogSections: CHANGELOG_SECTIONS,
      commitPartial: readFileSync(
        resolve(__dirname, '../../templates/commit.hbs'),
        'utf8'
      ),
      headerPartial: readFileSync(
        resolve(__dirname, '../../templates/header.hbs'),
        'utf8'
      ),
      mainTemplate: readFileSync(
        resolve(__dirname, '../../templates/template.hbs'),
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

  protected async postProcessCommits(
    commits: ConventionalCommit[]
  ): Promise<ConventionalCommit[]> {
    commits.forEach(commit => {
      commit.message = indentCommit(commit);
    });
    return commits;
  }

  protected async buildReleaseNotes(
    conventionalCommits: ConventionalCommit[],
    newVersion: Version,
    newVersionTag: TagName,
    latestRelease?: Release,
    commits?: Commit[]
  ): Promise<string> {
    const releaseNotes = await super.buildReleaseNotes(
      conventionalCommits,
      newVersion,
      newVersionTag,
      latestRelease,
      commits
    );
    return (
      releaseNotes
        // Remove links in version title line and standardize on h3
        .replace(/^###? \[([\d.]+)\]\([^)]*\)/gm, '### $1')
        // Remove bolded scope from change lines
        .replace(/^\* \*\*[\w-]+:\*\* /gm, '* ')
        // Remove PR and commit links from pull request title suffixes
        .replace(/(\(\[(\w+)\]\(https:\/\/github\.com\/[^)]*\)\))+\s*$/gm, '')
        // Standardize on h4 for change type subheaders
        .replace(/^### (Features|Bug Fixes|Documentation)$/gm, '#### $1')
        // Collapse 2 or more blank lines
        .replace(/\n{3,}/g, '\n\n')
    );
  }
}
