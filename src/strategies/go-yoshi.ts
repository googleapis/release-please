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

import {BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions} from './base';
import {Update} from '../update';
import {Changelog} from '../updaters/changelog';
import {ConventionalCommit} from '../commit';
import {Version} from '../version';
import {TagName} from '../util/tag-name';
import {Release} from '../release';
import {VersionGo} from '../updaters/go/version-go';
import {logger} from '../util/logger';
import {dirname} from 'path';

const REGEN_PR_REGEX = /.*auto-regenerate.*/;
const REGEN_ISSUE_REGEX = /(?<prefix>.*)\(#(?<pr>.*)\)(\n|$)/;

export class GoYoshi extends BaseStrategy {
  constructor(options: BaseStrategyOptions) {
    options.changelogPath = options.changelogPath ?? 'CHANGES.md';
    super(options);
  }
  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });
    updates.push({
      path: this.addPath('internal/version.go'),
      createIfMissing: false,
      updater: new VersionGo({
        version,
      }),
    });

    return updates;
  }

  protected async postProcessCommits(
    commits: ConventionalCommit[]
  ): Promise<ConventionalCommit[]> {
    let regenCommit: ConventionalCommit;
    const component = await this.getComponent();
    logger.debug('Filtering commits');
    const ignoredSubmodules = await this.getIgnoredSubModules();
    return commits.filter(commit => {
      // Only have a single entry of the nightly regen listed in the changelog.
      // If there are more than one of these commits, append associated PR.
      if (
        this.repository.owner === 'googleapis' &&
        this.repository.repo === 'google-api-go-client' &&
        REGEN_PR_REGEX.test(commit.message)
      ) {
        if (regenCommit) {
          const match = commit.message.match(REGEN_ISSUE_REGEX);
          if (match?.groups?.pr) {
            regenCommit.references.push({
              action: 'refs',
              issue: match.groups.pr,
              prefix: '#',
            });
          }
          return false;
        } else {
          commit.sha = '';
          regenCommit = commit;

          const match = commit.bareMessage.match(REGEN_ISSUE_REGEX);
          if (match?.groups?.pr) {
            regenCommit.references.push({
              action: 'refs',
              issue: match.groups.pr,
              prefix: '#',
            });
            regenCommit.bareMessage = match.groups.prefix.trim();
          }
        }
      }

      // For google-cloud-go, filter into 2 cases, a subset of modules
      // released independently, and the remainder
      if (
        this.repository.owner === 'googleapis' &&
        this.repository.repo === 'google-cloud-go'
      ) {
        // Skip commits that don't have a scope as we don't know where to
        // put them
        if (!commit.scope) {
          logger.debug(`Skipping commit without scope: ${commit.message}`);
          return false;
        }

        // Skip commits related to sub-modules as they are not part of
        // the parent module.
        if (this.includeComponentInTag) {
          // This is a submodule release, so only include commits in this
          // scope
          if (!commitMatchesScope(commit.scope, component!)) {
            logger.debug(
              `Skipping commit scope: ${commit.scope} != ${component}`
            );
            return false;
          }
        } else {
          // This is the main module release, so ignore sub modules that
          // are released independently
          for (const submodule of ignoredSubmodules) {
            if (commitMatchesScope(commit.scope, submodule)) {
              logger.debug(`Skipping ignored commit scope: ${commit.scope}`);
              return false;
            }
          }
        }
      }
      return true;
    });
  }

  async getIgnoredSubModules(): Promise<Set<string>> {
    // ignored submodules only applies to the root component of
    // googleapis/google-cloud-go
    if (
      this.repository.owner !== 'googleapis' ||
      this.repository.repo !== 'google-cloud-go' ||
      this.includeComponentInTag
    ) {
      return new Set();
    }

    logger.info('Looking for go.mod files');
    const paths = (
      await this.github.findFilesByFilenameAndRef('go.mod', this.targetBranch)
    )
      .filter(path => !path.includes('internal') && path !== 'go.mod')
      .map(path => dirname(path));
    logger.info(`Found ${paths.length} submodules`);
    logger.debug(JSON.stringify(paths));
    return new Set(paths);
  }

  // "closes" is a little presumptuous, let's just indicate that the
  // PR references these other commits:
  protected async buildReleaseNotes(
    conventionalCommits: ConventionalCommit[],
    newVersion: Version,
    newVersionTag: TagName,
    latestRelease?: Release
  ): Promise<string> {
    const releaseNotes = await super.buildReleaseNotes(
      conventionalCommits,
      newVersion,
      newVersionTag,
      latestRelease
    );
    return releaseNotes.replace(/, closes /g, ', refs ');
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }
}

function commitMatchesScope(commitScope: string, scope: string): boolean {
  return commitScope === scope || commitScope.startsWith(`${scope}/`);
}
