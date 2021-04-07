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

import chalk = require('chalk');
import * as semver from 'semver';
import {ReleaseType} from 'semver';

import {checkpoint, CheckpointType} from './util/checkpoint';
import {Commit} from './graphql-to-commits';
import {
  ConventionalChangelogCommit,
  parser,
} from '@conventional-commits/parser';
import toConventionalChangelogFormat from './util/to-conventional-changelog-format';
interface CommitWithHash extends ConventionalChangelogCommit {
  hash: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const conventionalCommitsFilter = require('conventional-commits-filter');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const conventionalChangelogWriter = require('conventional-changelog-writer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const presetFactory = require('conventional-changelog-conventionalcommits');

interface ConventionalCommitsOptions {
  commits: Commit[];
  owner: string;
  repository: string;
  host?: string;
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
  // allow for customized commit template.
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
  changelogSections?: ChangelogSection[];
  commitFilter?: (c: ConventionalChangelogCommit) => boolean;
}

export interface ChangelogSection {
  type: string;
  section: string;
  hidden?: boolean;
}

interface ChangelogEntryOptions {
  version: string;
  previousTag?: string;
  currentTag?: string;
}

interface BumpSuggestion {
  releaseType: ReleaseType;
  reason: string;
  level: number;
}

interface Note {
  title: string;
  text: string;
}

function getParsedCommits(
  commits: Commit[],
  commitFilter: (c: ConventionalChangelogCommit) => boolean = () => false
): CommitWithHash[] {
  const parsedCommits: CommitWithHash[] = [];
  for (const commit of commits) {
    try {
      for (const parsedCommit of toConventionalChangelogFormat(
        parser(commit.message)
      )) {
        const commitWithHash = postProcessCommits(
          parsedCommit
        ) as CommitWithHash;
        if (commitFilter(parsedCommit)) {
          continue;
        }
        commitWithHash.hash = commit.sha;
        parsedCommits.push(commitWithHash);
      }
    } catch (_err) {
      // Commit is not in conventional commit format, it does not
      // contribute to the CHANGELOG generation.
    }
  }
  return parsedCommits;
}

// TODO(@bcoe): now that we walk the actual AST of conventional commits
// we should be able to move post processing into
// to-conventional-changelog.ts.
function postProcessCommits(commit: ConventionalChangelogCommit) {
  commit.notes.forEach(note => {
    let text = '';
    let i = 0;
    let extendedContext = false;
    for (const chunk of note.text.split(/\r?\n/)) {
      if (i > 0 && hasExtendedContext(chunk) && !extendedContext) {
        text = `${text.trim()}\n`;
        extendedContext = true;
      }
      if (chunk === '') break;
      else if (extendedContext) {
        text += `    ${chunk}\n`;
      } else {
        text += `${chunk} `;
      }
      i++;
    }
    note.text = text.trim();
  });
  return commit;
}

// If someone wishes to include additional contextual information for a
// BREAKING CHANGE using markdown, they can do so by starting the line after the initial
// breaking change description with either:
//
// 1. a fourth-level header.
// 2. a bulleted list (using either '*' or '-').
//
// BREAKING CHANGE: there were breaking changes
// #### Deleted Endpoints
// - endpoint 1
// - endpoint 2
function hasExtendedContext(line: string) {
  if (line.match(/^#### |^[*-] /)) return true;
  return false;
}

export class ConventionalCommits {
  commits: Commit[];
  host: string;
  owner: string;
  repository: string;
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;

  // allow for customized commit template.
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
  changelogSections?: ChangelogSection[];
  private commitFilter?: (c: ConventionalChangelogCommit) => boolean;

  constructor(options: ConventionalCommitsOptions) {
    this.commits = options.commits;
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.bumpPatchForMinorPreMajor = options.bumpPatchForMinorPreMajor || false;
    this.host = options.host || 'https://www.github.com';
    this.owner = options.owner;
    this.repository = options.repository;
    // we allow some languages (currently Ruby) to provide their own
    // template style:
    this.commitPartial = options.commitPartial;
    this.headerPartial = options.headerPartial;
    this.mainTemplate = options.mainTemplate;
    this.changelogSections = options.changelogSections;
    this.commitFilter = options.commitFilter;
  }
  async suggestBump(version: string): Promise<BumpSuggestion> {
    const preMajor = this.bumpMinorPreMajor
      ? semver.lt(version, 'v1.0.0')
      : false;
    const bump: BumpSuggestion = await this.guessReleaseType(preMajor);
    checkpoint(
      `release as ${chalk.green(bump.releaseType)}: ${chalk.yellow(
        bump.reason
      )}`,
      CheckpointType.Success
    );
    return bump;
  }
  async generateChangelogEntry(
    options: ChangelogEntryOptions
  ): Promise<string> {
    const context = {
      host: this.host,
      owner: this.owner,
      repository: this.repository,
      version: options.version,
      previousTag: options.previousTag,
      currentTag: options.currentTag,
      linkCompare: !!options.previousTag,
    };

    // allows the sections displayed in the CHANGELOG to be configured
    // as an example, Ruby displays docs:
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
    const parsed: string = conventionalChangelogWriter
      .parseArray(
        getParsedCommits(this.commits, this.commitFilter),
        context,
        preset.writerOpts
      )
      .trim();
    return parsed;
  }
  private async guessReleaseType(preMajor: boolean): Promise<BumpSuggestion> {
    const VERSIONS = ['major', 'minor', 'patch'];
    const preset = await presetFactory({preMajor});
    const commits = conventionalCommitsFilter(
      getParsedCommits(this.commits, this.commitFilter)
    ) as ConventionalChangelogCommit;

    let result = preset.recommendedBumpOpts.whatBump(
      commits,
      preset.recommendedBumpOpts
    );

    if (result && result.level !== null) {
      result.releaseType = VERSIONS[result.level];
    } else if (result === null) {
      result = {};
    }

    // we have slightly different logic than the default of conventional commits,
    // the minor should be bumped when features are introduced for pre 1.x.x libs:
    // turn off custom logic here by setting bumpPatchForMinorPreMajor = true
    if (
      result.reason.indexOf(' 0 features') === -1 &&
      result.releaseType === 'patch' &&
      !this.bumpPatchForMinorPreMajor
    ) {
      result.releaseType = 'minor';
    }
    return result;
  }
}
