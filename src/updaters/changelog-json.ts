// Copyright 2022 Google LLC
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

interface ChangelogJsonOptions extends UpdateOptions {
  artifactName: string;
  commits: ConventionalCommit[];
}

/**
 *
 */
export class ChangelogJson extends DefaultUpdater {
  artifactName: string;
  commits: ConventionalCommit[];

  /**
   * Instantiate a new SamplesPackageJson updater
   * @param options
   */
  constructor(options: ChangelogJsonOptions) {
    super(options);
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
    const breakingChangeNotes = [];
    const changes = [];
    for (const commit of this.commits) {
      for (const note of commit.notes) {
        if (note.title === BREAKING_CHANGE_TITLE) {
          breakingChangeNotes.push(
            commit.scope ? `${commit.scope}: ${note.text}` : note.text
          );
        }
      }
      changes.push({
        type: commit.type,
        scope: commit.scope,
        sha: commit.sha,
        message: commit.message,
      });
    }
    const release = {
      version: this.version.toString(),
      artifact_name: this.artifactName,
      id: randomUUID(),
      breaking_change_notes: breakingChangeNotes,
      changes,
    };
    parsed.unshift(release);
    return JSON.stringify(parsed, null, 2);
  }
}
