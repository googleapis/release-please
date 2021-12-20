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

// Commits containing a scope prefixed with an item in this array will be
// ignored when generating a release PR for the parent module.
const IGNORED_SUB_MODULES = new Set([
  'bigtable',
  'bigquery',
  'datastore',
  'firestore',
  'logging',
  'pubsub',
  'pubsublite',
  'spanner',
  'storage',
]);
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

  protected postProcessCommits(
    commits: ConventionalCommit[]
  ): ConventionalCommit[] {
    let regenCommit: ConventionalCommit;

    return commits.filter(commit => {
      // ignore commits whose scope is in the list of ignored modules
      if (IGNORED_SUB_MODULES.has(commit.scope || '')) {
        return false;
      }

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
      return true;
    });
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
