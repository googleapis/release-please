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

import {ManifestPlugin, ManifestPluginOptions} from '../plugin';
import {
  CandidateReleasePullRequest,
  RepositoryConfig,
  MANIFEST_PULL_REQUEST_TITLE_PATTERN,
  ROOT_PROJECT_PATH,
} from '../manifest';
import {PullRequestTitle} from '../util/pull-request-title';
import {PullRequestBody, ReleaseData} from '../util/pull-request-body';
import {BranchName} from '../util/branch-name';
import {Update} from '../update';
import {mergeUpdates} from '../updaters/composite';
import {GitHub} from '../github';
import {ReleasePullRequest} from '../release-pull-request';

interface MergeOptions extends ManifestPluginOptions {
  pullRequestTitlePattern?: string;
  pullRequestHeader?: string;
  headBranchName?: string;
  forceMerge?: boolean;
}

/**
 * This plugin merges multiple pull requests into a single
 * release pull request.
 *
 * Release notes are broken up using `<summary>`/`<details>` blocks.
 */
export class Merge extends ManifestPlugin {
  private pullRequestTitlePattern?: string;
  private pullRequestHeader?: string;
  private headBranchName?: string;
  private forceMerge: boolean;

  constructor(
    github: GitHub,
    targetBranch: string,
    manifestPath: string,
    repositoryConfig: RepositoryConfig,
    options: MergeOptions = {}
  ) {
    super(github, targetBranch, manifestPath, repositoryConfig, options);
    this.pullRequestTitlePattern =
      options.pullRequestTitlePattern ?? MANIFEST_PULL_REQUEST_TITLE_PATTERN;
    this.pullRequestHeader = options.pullRequestHeader;
    this.headBranchName = options.headBranchName;
    this.forceMerge = options.forceMerge ?? false;
  }

  async run(
    candidates: CandidateReleasePullRequest[]
  ): Promise<CandidateReleasePullRequest[]> {
    if (candidates.length < 1) {
      return candidates;
    }
    this.logger.info(`Merging ${candidates.length} pull requests`);

    const [inScopeCandidates, outOfScopeCandidates] = candidates.reduce<
      Array<Array<CandidateReleasePullRequest>>
    >(
      (collection, candidate) => {
        if (candidate.config.separatePullRequests && !this.forceMerge) {
          collection[1].push(candidate);
        } else {
          collection[0].push(candidate);
        }
        return collection;
      },
      [[], []]
    );

    const releaseData: ReleaseData[] = [];
    const labels = new Set<string>();
    let rawUpdates: Update[] = [];
    let rootRelease: CandidateReleasePullRequest | null = null;
    for (const candidate of inScopeCandidates) {
      const pullRequest = candidate.pullRequest;
      rawUpdates = rawUpdates.concat(...pullRequest.updates);
      for (const label of pullRequest.labels) {
        labels.add(label);
      }
      releaseData.push(...pullRequest.body.releaseData);
      if (candidate.path === '.') {
        rootRelease = candidate;
      }
    }
    const updates = mergeUpdates(rawUpdates);

    const pullRequest: ReleasePullRequest = {
      title: PullRequestTitle.ofComponentTargetBranchVersion(
        rootRelease?.pullRequest.title.component,
        this.targetBranch,
        this.changesBranch,
        rootRelease?.pullRequest.title.version,
        this.pullRequestTitlePattern
      ),
      body: new PullRequestBody(releaseData, {
        useComponents: true,
        header: this.pullRequestHeader,
      }),
      updates,
      labels: Array.from(labels),
      headRefName:
        this.headBranchName ??
        BranchName.ofTargetBranch(
          this.targetBranch,
          this.changesBranch
        ).toString(),
      draft: !candidates.some(candidate => !candidate.pullRequest.draft),
      conventionalCommits: candidates.flatMap(
        c => c.pullRequest.conventionalCommits
      ),
    };

    const releaseTypes = new Set(
      candidates.map(candidate => candidate.config.releaseType)
    );
    const releaseType =
      releaseTypes.size === 1 ? releaseTypes.values().next().value! : 'simple';
    return [
      {
        path: ROOT_PROJECT_PATH,
        pullRequest,
        config: {
          releaseType,
        },
      },
      ...outOfScopeCandidates,
    ];
  }
}
