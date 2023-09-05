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

import {GitHub} from './github';
import {CandidateReleasePullRequest, RepositoryConfig} from './manifest';
import {Strategy} from './strategy';
import {Commit, ConventionalCommit} from './commit';
import {Release} from './release';
import {logger as defaultLogger, Logger} from './util/logger';

export interface ManifestPluginOptions {
  logger?: Logger;
  changesBranch?: string;
}

/**
 * A plugin runs after a repository manifest has built candidate
 * pull requests and can make updates that span across multiple
 * components. A plugin *might* choose to merge pull requests or add
 * or update existing files.
 */
export abstract class ManifestPlugin {
  readonly github: GitHub;
  readonly targetBranch: string;
  readonly changesBranch: string;
  readonly manifestPath: string;
  readonly repositoryConfig: RepositoryConfig;
  protected logger: Logger;
  constructor(
    github: GitHub,
    targetBranch: string,
    manifestPath: string,
    repositoryConfig: RepositoryConfig,
    options: ManifestPluginOptions
  ) {
    this.github = github;
    this.targetBranch = targetBranch;
    this.manifestPath = manifestPath;
    this.repositoryConfig = repositoryConfig;
    this.changesBranch = options?.changesBranch || this.targetBranch;
    this.logger = options.logger || defaultLogger;
  }

  /**
   * Perform post-processing on commits, e.g, sentence casing them.
   * @param {Commit[]} commits The set of commits that will feed into release pull request.
   * @returns {Commit[]} The modified commit objects.
   */
  processCommits(commits: ConventionalCommit[]): ConventionalCommit[] {
    return commits;
  }

  /**
   * Post-process candidate pull requests.
   * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
   * @returns {CandidateReleasePullRequest[]} Updated pull requests
   */
  async run(
    pullRequests: CandidateReleasePullRequest[]
  ): Promise<CandidateReleasePullRequest[]> {
    return pullRequests;
  }

  /**
   * Pre-configure strategies.
   * @param {Record<string, Strategy>} strategiesByPath Strategies indexed by path
   * @returns {Record<string, Strategy>} Updated strategies indexed by path
   */
  async preconfigure(
    strategiesByPath: Record<string, Strategy>,
    _commitsByPath: Record<string, Commit[]>,
    _releasesByPath: Record<string, Release>
  ): Promise<Record<string, Strategy>> {
    return strategiesByPath;
  }
}
