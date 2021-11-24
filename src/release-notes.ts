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

import {ConventionalCommit} from './commit';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const conventionalChangelogWriter = require('conventional-changelog-writer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const presetFactory = require('conventional-changelog-conventionalcommits');

export interface ChangelogSection {
  type: string;
  section: string;
  hidden?: boolean;
}

interface ReleaseNotesOptions {
  changelogSections?: ChangelogSection[];
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
}

interface BuildNotesOptions {
  host?: string;
  owner: string;
  repository: string;
  version: string;
  previousTag?: string;
  currentTag: string;
}

export class ReleaseNotes {
  // allow for customized commit template.
  private changelogSections?: ChangelogSection[];
  private commitPartial?: string;
  private headerPartial?: string;
  private mainTemplate?: string;

  constructor(options: ReleaseNotesOptions = {}) {
    this.changelogSections = options.changelogSections;
    this.commitPartial = options.commitPartial;
    this.headerPartial = options.headerPartial;
    this.mainTemplate = options.mainTemplate;
  }

  async buildNotes(
    commits: ConventionalCommit[],
    options: BuildNotesOptions
  ): Promise<string> {
    const context = {
      host: options.host || 'https://github.com',
      owner: options.owner,
      repository: options.repository,
      version: options.version,
      previousTag: options.previousTag,
      currentTag: options.currentTag,
      linkCompare: !!options.previousTag,
    };

    const config: {[key: string]: ChangelogSection[]} = {};
    if (this.changelogSections) {
      config.types = this.changelogSections;
    }
    const preset = await presetFactory(config);
    preset.writerOpts.commitPartial =
      this.commitPartial || preset.writerOpts.commitPartial;
    preset.writerOpts.headerPartial =
      this.headerPartial || preset.writerOpts.headerPartial;
    preset.writerOpts.mainTemplate =
      this.mainTemplate || preset.writerOpts.mainTemplate;

    const changelogCommits = commits.map(commit => {
      return {
        body: '', // commit.body,
        subject: commit.bareMessage,
        type: commit.type,
        scope: commit.scope,
        notes: commit.notes,
        references: commit.references,
        mentions: [],
        merge: null,
        revert: null,
        header: commit.message,
        footer: null,
        hash: commit.sha,
      };
    });

    return conventionalChangelogWriter
      .parseArray(changelogCommits, context, preset.writerOpts)
      .trim();
  }
}
