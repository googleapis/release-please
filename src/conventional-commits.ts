/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import chalk from 'chalk';
import * as semver from 'semver';
import {ReleaseType} from 'semver';
import {Readable} from 'stream';

import {checkpoint, CheckpointType} from './checkpoint';

const concat = require('concat-stream');
const conventionalCommitsFilter = require('conventional-commits-filter');
const conventionalCommitsParser = require('conventional-commits-parser');
const conventionalChangelogWriter = require('conventional-changelog-writer');
const parseGithubRepoUrl = require('parse-github-repo-url');
const presetFactory = require('conventional-changelog-conventionalcommits');

interface ConventionalCommitsOptions {
  commits: string[];
  githubRepoUrl: string;
  host?: string;
  bumpMinorPreMajor?: boolean;
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
  scope: string|null;
  subject: string;
  merge: boolean|null;
  header: string;
  body: string|null;
  footer: string|null;
  notes: object[];
  references: object[];
  mentions: string[];
  revert: boolean|null;
}

export class ConventionalCommits {
  commits: string[];
  host: string;
  owner: string;
  repository: string;
  bumpMinorPreMajor?: boolean;

  constructor(options: ConventionalCommitsOptions) {
    const parsedGithubRepoUrl = parseGithubRepoUrl(options.githubRepoUrl);
    if (!parsedGithubRepoUrl) throw Error('could not parse githubRepoUrl');
    const [owner, repository] = parsedGithubRepoUrl;
    this.commits = options.commits;
    this.bumpMinorPreMajor = options.bumpMinorPreMajor || false;
    this.host = options.host || 'https://www.github.com';
    this.owner = owner;
    this.repository = repository;
  }
  async suggestBump(version: string): Promise<BumpSuggestion> {
    const preMajor =
        this.bumpMinorPreMajor ? semver.lt(version, 'v1.0.0') : false;
    const bump: BumpSuggestion = await this.guessReleaseType(preMajor);
    checkpoint(
        `release as ${chalk.green(bump.releaseType)}: ${
            chalk.yellow(bump.reason)}`,
        CheckpointType.Success);
    return bump;
  }
  async generateChangelogEntry(options: ChangelogEntryOptions):
      Promise<string> {
    const context = {
      host: this.host,
      owner: this.owner,
      repository: this.repository,
      version: options.version,
      previousTag: options.previousTag,
      currentTag: options.currentTag,
      linkCompare: !!options.previousTag
    };
    const preset = await presetFactory({});
    return new Promise((resolve, reject) => {
      let content = '';
      const stream =
          this.commitsReadable()
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
    const preset = await presetFactory({preMajor});
    return new Promise((resolve: Function, reject: Function) => {
      const stream = this.commitsReadable()
                         .pipe(conventionalCommitsParser(preset.parserOpts))
                         .pipe(concat((data: ParsedConventionalCommit[]) => {
                           const commits = conventionalCommitsFilter(data);

                           let result = preset.recommendedBumpOpts.whatBump(
                               commits, preset.recommendedBumpOpts);

                           if (result && result.level != null) {
                             result.releaseType = VERSIONS[result.level];
                           } else if (result == null) {
                             result = {};
                           }

                           return resolve(result);
                         }));

      stream.on('error', (err: Error) => {
        return reject(err);
      });
    });
  }
  private commitsReadable(): Readable {
    const commitsReadable = new Readable();
    this.commits.forEach(commit => {
      commitsReadable.push(commit);
    });
    commitsReadable.push(null);
    return commitsReadable;
  }
}
