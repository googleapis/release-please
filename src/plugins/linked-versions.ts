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

import {ManifestPlugin, ManifestPluginOptions} from '../plugin';
import {RepositoryConfig, CandidateReleasePullRequest} from '../manifest';
import {GitHub} from '../github';
import {Strategy} from '../strategy';
import {Commit, parseConventionalCommits} from '../commit';
import {Release} from '../release';
import {Version} from '../version';
import {buildStrategy} from '../factory';
import {Merge} from './merge';
import {BranchName} from '../util/branch-name';

interface LinkedVersionsPluginOptions extends ManifestPluginOptions {
  merge?: boolean;
}

/**
 * This plugin reconfigures strategies by linking multiple components
 * together.
 *
 * Release notes are broken up using `<summary>`/`<details>` blocks.
 */
export class LinkedVersions extends ManifestPlugin {
  readonly groupName: string;
  readonly components: Set<string>;
  readonly merge: boolean;

  constructor(
    github: GitHub,
    targetBranch: string,
    manifestPath: string,
    repositoryConfig: RepositoryConfig,
    groupName: string,
    components: string[],
    options: LinkedVersionsPluginOptions = {}
  ) {
    super(github, targetBranch, manifestPath, repositoryConfig, options);
    this.groupName = groupName;
    this.components = new Set(components);
    this.merge = options.merge ?? true;
  }

  /**
   * Pre-configure strategies.
   * @param {Record<string, Strategy>} strategiesByPath Strategies indexed by path
   * @returns {Record<string, Strategy>} Updated strategies indexed by path
   */
  async preconfigure(
    strategiesByPath: Record<string, Strategy>,
    commitsByPath: Record<string, Commit[]>,
    releasesByPath: Record<string, Release>
  ): Promise<Record<string, Strategy>> {
    // Find all strategies in the group
    const groupStrategies: Record<string, Strategy> = {};
    for (const path in strategiesByPath) {
      const strategy = strategiesByPath[path];
      const component = await strategy.getComponent();
      if (!component) {
        continue;
      }
      if (this.components.has(component)) {
        groupStrategies[path] = strategy;
      }
    }
    this.logger.info(
      `Found ${Object.keys(groupStrategies).length} components for group '${
        this.groupName
      }'`
    );

    const groupVersions: Record<string, Version> = {};
    const missingReleasePaths = new Set<string>();
    for (const path in groupStrategies) {
      const strategy = groupStrategies[path];
      const latestRelease = releasesByPath[path];
      const releasePullRequest = await strategy.buildReleasePullRequest({
        commits: parseConventionalCommits(commitsByPath[path], this.logger),
        latestRelease,
        manifestPath: this.manifestPath,
      });
      if (releasePullRequest?.version) {
        groupVersions[path] = releasePullRequest.version;
      } else {
        missingReleasePaths.add(path);
      }
    }
    const versions = Object.values(groupVersions);
    if (versions.length === 0) {
      return strategiesByPath;
    }

    const primaryVersion = versions.reduce(
      (collector, version) =>
        collector.compare(version) > 0 ? collector : version,
      versions[0]
    );

    const newStrategies: Record<string, Strategy> = {};
    for (const path in strategiesByPath) {
      if (path in groupStrategies) {
        const component = await strategiesByPath[path].getComponent();
        this.logger.info(
          `Replacing strategy for path ${path} with forced version: ${primaryVersion}`
        );
        newStrategies[path] = await buildStrategy({
          ...this.repositoryConfig[path],
          github: this.github,
          path,
          targetBranch: this.targetBranch,
          changesBranch: this.changesBranch,
          releaseAs: primaryVersion.toString(),
        });
        if (missingReleasePaths.has(path)) {
          this.logger.debug(`Appending fake commit for path: ${path}`);
          commitsByPath[path].push({
            sha: '',
            message: `chore(${component}): Synchronize ${
              this.groupName
            } versions\n\nRelease-As: ${primaryVersion.toString()}`,
          });
        }
      } else {
        newStrategies[path] = strategiesByPath[path];
      }
    }

    return newStrategies;
  }

  /**
   * Post-process candidate pull requests.
   * @param {CandidateReleasePullRequest[]} pullRequests Candidate pull requests
   * @returns {CandidateReleasePullRequest[]} Updated pull requests
   */
  async run(
    candidates: CandidateReleasePullRequest[]
  ): Promise<CandidateReleasePullRequest[]> {
    if (!this.merge) {
      return candidates;
    }

    const [inScopeCandidates, outOfScopeCandidates] = candidates.reduce(
      (collection, candidate) => {
        if (!candidate.pullRequest.version) {
          this.logger.warn('pull request missing version', candidate);
          collection[1].push(candidate);
          return collection;
        }
        if (this.components.has(candidate.config.component || '')) {
          collection[0].push(candidate);
        } else {
          collection[1].push(candidate);
        }
        return collection;
      },
      [[], []] as CandidateReleasePullRequest[][]
    );
    this.logger.info(
      `Found ${inScopeCandidates.length} linked-versions candidates`
    );

    // delegate to the merge plugin and add merged pull request
    if (inScopeCandidates.length > 0) {
      const merge = new Merge(
        this.github,
        this.targetBranch,
        this.manifestPath,
        this.repositoryConfig,
        {
          pullRequestTitlePattern: `chore\${scope}: release ${this.groupName} libraries`,
          forceMerge: true,
          headBranchName: BranchName.ofGroupTargetBranch(
            this.groupName,
            this.targetBranch,
            this.changesBranch
          ).toString(),
        }
      );
      const merged = await merge.run(inScopeCandidates);
      outOfScopeCandidates.push(...merged);
    }

    return outOfScopeCandidates;
  }
}
