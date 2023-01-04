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

import {GitHub} from '../github';
import {ChangelogNotes, ChangelogSection} from '../changelog-notes';
import {GitHubChangelogNotes} from '../changelog-notes/github';
import {DefaultChangelogNotes} from '../changelog-notes/default';
import {ConfigurationError} from '../errors';

export type ChangelogNotesType = string;

export interface ChangelogNotesFactoryOptions {
  type: ChangelogNotesType;
  github: GitHub;
  changelogSections?: ChangelogSection[];
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
}

export type ChangelogNotesBuilder = (
  options: ChangelogNotesFactoryOptions
) => ChangelogNotes;

const changelogNotesFactories: Record<string, ChangelogNotesBuilder> = {
  github: options => new GitHubChangelogNotes(options.github),
  default: options => new DefaultChangelogNotes(options),
};

export function buildChangelogNotes(
  options: ChangelogNotesFactoryOptions
): ChangelogNotes {
  const builder = changelogNotesFactories[options.type];
  if (builder) {
    return builder(options);
  }
  throw new ConfigurationError(
    `Unknown changelog type: ${options.type}`,
    'core',
    `${options.github.repository.owner}/${options.github.repository.repo}`
  );
}

export function registerChangelogNotes(
  name: string,
  changelogNotesBuilder: ChangelogNotesBuilder
) {
  changelogNotesFactories[name] = changelogNotesBuilder;
}

export function unregisterChangelogNotes(name: string) {
  delete changelogNotesFactories[name];
}

export function getChangelogTypes(): readonly ChangelogNotesType[] {
  return Object.keys(changelogNotesFactories).sort();
}
