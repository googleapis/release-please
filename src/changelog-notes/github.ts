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

import {ChangelogNotes, BuildNotesOptions} from '../changelog-notes';
import {ConventionalCommit} from '../commit';
import {GitHub} from '../github';

export class GitHubChangelogNotes implements ChangelogNotes {
  private github: GitHub;
  constructor(github: GitHub) {
    this.github = github;
  }
  async buildNotes(
    _commits: ConventionalCommit[],
    options: BuildNotesOptions
  ): Promise<string> {
    const body = await this.github.generateReleaseNotes(
      options.currentTag,
      options.targetBranch,
      options.previousTag
    );
    const date = new Date().toLocaleDateString('en-CA');
    const header = `## ${options.version} (${date})`;
    return `${header}\n\n${body}`;
  }
}
