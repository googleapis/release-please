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
  toConventionalChangelogFormat,
} from '@conventional-commits/parser';

interface CommitWithHash extends ConventionalChangelogCommit {
  hash: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const conventionalCommitsFilter = require('conventional-commits-filter');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const conventionalChangelogWriter = require('conventional-changelog-writer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const presetFactory = require('conventional-changelog-conventionalcommits');

interface ConventionalCommitsOptions {
  commits: Commit[];
  githubRepoUrl: string;
  host?: string;
  bumpMinorPreMajor?: boolean;
  // allow for customized commit template.
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
  changelogSections?: ChangelogSection[];
}

interface ChangelogSection {
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

  // allow for customized commit template.
  commitPartial?: string;
  headerPartial?: string;
  mainTemplate?: string;
  changelogSections?: ChangelogSection[];

  constructor(options: ConventionalCommitsOptions) {
    const parsedGithubRepoUrl = parseGithubRepoUrl(options.githubRepoUrl);
    if (!parsedGithubRepoUrl) throw Error('could not parse githubRepoUrl');
    const [owner, repository] = parsedGithubRepoUrl;
    this.commits = options.commits;
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.host = options.host || 'https://www.github.com';
    this.owner = owner;
    this.repository = repository;
    // we allow some languages (currently Ruby) to provide their own
    // template style:
    this.commitPartial = options.commitPartial;
    this.headerPartial = options.headerPartial;
    this.mainTemplate = options.mainTemplate;
    this.changelogSections = options.changelogSections;
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
    const parsedCommits = [];
    for (const commit of this.commits) {
      try {
        const parsedCommit = postProcessCommits(
          toConventionalChangelogFormat(parser(commit.message))
        ) as CommitWithHash;
        parsedCommit.hash = commit.sha;
        parsedCommits.push(parsedCommit);
      } catch (_err) {
        // Commit is not in conventional commit format, it does not
        // contribute to the CHANGELOG generation.
      }
    }
    const parsed: string = conventionalChangelogWriter
      .parseArray(parsedCommits, context, preset.writerOpts)
      .trim();
    return parsed;
  }
  private async guessReleaseType(preMajor: boolean): Promise<BumpSuggestion> {
    const VERSIONS = ['major', 'minor', 'patch'];
    const preset = await presetFactory({preMajor});
    const parsedCommits = [];
    for (const commit of this.commits) {
      try {
        const parsedCommit = toConventionalChangelogFormat(
          parser(commit.message)
        );
        parsedCommits.push(parsedCommit);
      } catch (_err) {
        // Commit is not in conventional commit format, it does not
        // contribute to the CHANGELOG generation.
      }
    }
    const commits = conventionalCommitsFilter(
      parsedCommits
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
    if (
      result.reason.indexOf(' 0 features') === -1 &&
      result.releaseType === 'patch'
    ) {
      result.releaseType = 'minor';
    }
    return result;
  }
}
