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

import {Commit, ConventionalCommit} from './commit';

export interface BuildNotesOptions {
  host?: string;
  owner: string;
  repository: string;
  version: string;
  previousTag?: string;
  currentTag: string;
  targetBranch: string;
  changelogSections?: ChangelogSection[];
  commits?: Commit[];
}

export interface ChangelogNotes {
  buildNotes(
    commits: ConventionalCommit[],
    options: BuildNotesOptions
  ): Promise<string>;
}

export interface ChangelogSection {
  type: string;
  section: string;
  hidden?: boolean;
}

const DEFAULT_HEADINGS: Record<string, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance Improvements',
  deps: 'Dependencies',
  revert: 'Reverts',
  docs: 'Documentation',
  style: 'Styles',
  chore: 'Miscellaneous Chores',
  refactor: 'Code Refactoring',
  test: 'Tests',
  build: 'Build System',
  ci: 'Continuous Integration',
};

export function buildChangelogSections(scopes: string[]): ChangelogSection[] {
  return scopes.map(scope => {
    return {
      type: scope,
      section: DEFAULT_HEADINGS[scope] || scope,
    };
  });
}
