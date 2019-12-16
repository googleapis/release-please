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
import { ReleaseType } from 'semver';
import { Readable } from 'stream';

import { checkpoint, CheckpointType } from './util/checkpoint';
import { Commit } from './graphql-to-commits';

const concat = require('concat-stream');
const conventionalCommitsFilter = require('conventional-commits-filter');
const conventionalCommitsParser = require('conventional-commits-parser');
const conventionalChangelogWriter = require('conventional-changelog-writer');
const parseGithubRepoUrl = require('parse-github-repo-url');
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

interface ParsedConventionalCommit {
  type: string;
  scope: string | null;
  subject: string;
  merge: boolean | null;
  header: string;
  body: string | null;
  footer: string | null;
  notes: object[];
  references: object[];
  mentions: string[];
  revert: boolean | null;
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
    const config: { [key: string]: ChangelogSection[] } = {};
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

    return new Promise((resolve, reject) => {
      let content = '';
      const stream = this.commitsReadable()
        .pipe(conventionalCommitsParser(preset.parserOpts))
        .pipe(conventionalChangelogWriter(context, preset.writerOpts));

      stream.on('error', (err: Error) => {
        return reject(err);
      });

      stream.on('data', (buffer: Buffer) => {
        content += buffer.toString('utf8');
      });

      stream.on('end', () => {
        return resolve(content.trim());
      });
    });
  }
  private async guessReleaseType(preMajor: boolean): Promise<BumpSuggestion> {
    const VERSIONS = ['major', 'minor', 'patch'];
    const preset = await presetFactory({ preMajor });
    return new Promise((resolve: Function, reject: Function) => {
      const stream = this.commitsReadable()
        .pipe(conventionalCommitsParser(preset.parserOpts))
        .pipe(
          concat((data: ParsedConventionalCommit[]) => {
            const commits = conventionalCommitsFilter(data);

            let result = preset.recommendedBumpOpts.whatBump(
              commits,
              preset.recommendedBumpOpts
            );

            if (result && result.level != null) {
              result.releaseType = VERSIONS[result.level];
            } else if (result == null) {
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

            return resolve(result);
          })
        );

      stream.on('error', (err: Error) => {
        return reject(err);
      });
    });
  }
  private commitsReadable(): Readable {
    // The conventional commits parser expects an array of string commit
    // messages terminated by `-hash-` followed by the commit sha. We
    // piggyback off of this, and use this sha when choosing a
    // point to branch from for PRs.
    const commitsReadable = new Readable();
    this.commits.forEach((commit: Commit) => {
      commitsReadable.push(`${commit.message}\n-hash-\n${commit.sha}`);
    });
    commitsReadable.push(null);
    return commitsReadable;
  }
}
