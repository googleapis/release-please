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

/**
 * A plugin runs after a repository manifest has built candidate
 * pull requests and can make updates that span across multiple
 * components. A plugin *might* choose to merge pull requests or add
 * or update existing files.
 */
export abstract class ManifestPlugin {
  readonly github: GitHub;
  readonly targetBranch: string;
  readonly repositoryConfig: RepositoryConfig;
  constructor(
    github: GitHub,
    targetBranch: string,
    repositoryConfig: RepositoryConfig
  ) {
    this.github = github;
    this.targetBranch = targetBranch;
    this.repositoryConfig = repositoryConfig;
  }

  /**
   * Post-process candidate pull requests.
   * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
   * @returns {CandidateReleasePullRequest[]} Updated pull requests
   */
  abstract run(
    pullRequests: CandidateReleasePullRequest[]
  ): Promise<CandidateReleasePullRequest[]>;
}
