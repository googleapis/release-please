// Copyright 2023 Google LLC
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

import {ConventionalCommit} from '../commit';
import {logger as defaultLogger, Logger} from '../util/logger';
import {DefaultUpdater, UpdateOptions} from './default';
import {randomUUID} from 'crypto';

const BREAKING_CHANGE_TITLE = 'BREAKING CHANGE';
const COMMIT_PREFIX = /^[^:]+: ?/;
const PR_SUFFIX_REGEX = / ?\(#(?<pr>[0-9]+)\)$/;

interface ChangelogJsonOptions extends UpdateOptions {
  artifactName: string;
  language: string;
  commits: ConventionalCommit[];
}

interface Change {
  type: string;
  scope?: string;
  sha: string;
  issues: string[];
  message: string;
  breakingChangeNote?: string;
}

/**
 * Maintians a machine readable CHANGELOG in chnagelog.json.
 * See: https://gist.github.com/bcoe/50ef0a0024bbf107cd5bc0adbdc04758
 */
export class ChangelogJson extends DefaultUpdater {
  artifactName: string;
  language: string;
  commits: ConventionalCommit[];

  /**
   * Instantiate a new SamplesPackageJson updater
   * @param options
   */
  constructor(options: ChangelogJsonOptions) {
    super(options);
    this.language = options.language;
    this.artifactName = options.artifactName;
    this.commits = options.commits;
  }

  /**
   * Given initial file contents, return updated contents.
   * @param {string} content The initial content
   * @returns {string} The updated content
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = JSON.parse(content);
    logger.info(`adding release ${this.version} for ${this.artifactName}`);
    const changes = [];
    for (const commit of this.commits) {
      const issues = new Set<string>();
      // The commit.message field contains the type/scope prefix.
      let message = commit.message.replace(COMMIT_PREFIX, '');
      // When squashing commits, GitHub adds a suffix refrencing
      // the # of the PR, e.g., chore(main): release 15.5.1 (#1838)
      // this logic removes this suffix and prepends it to the
      // issues array.
      const match = message.match(PR_SUFFIX_REGEX);
      if (match && match.groups?.pr) {
        message = message.replace(match[0], '');
        issues.add(match.groups.pr);
      }
      // Array.from(someSet) will maintain elements in insertion
      // order, given this we add references after the pr suffix.
      for (const ref of commit.references) {
        issues.add(ref.issue);
      }
      const change: Change = {
        type: commit.type,
        sha: commit.sha,
        message: message,
        issues: Array.from(issues),
      };
      if (commit.scope) change.scope = commit.scope;
      for (const note of commit.notes) {
        if (note.title === BREAKING_CHANGE_TITLE) {
          change.breakingChangeNote = note.text;
        }
      }
      changes.push(change);
    }
    // If all commits were ignored, simply return the original changelog.json.
    if (changes.length === 0) {
      return content;
    }
    const time = new Date().toISOString();
    const release = {
      changes,
      version: this.version.toString(),
      language: this.language,
      artifactName: this.artifactName,
      id: randomUUID(),
      createTime: time,
    };
    parsed.entries.unshift(release);
    parsed.updateTime = time;
    return JSON.stringify(parsed, null, 2);
  }
}
