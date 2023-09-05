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
import {RootComposerUpdatePackages} from '../updaters/php/root-composer-update-packages';
import {PHPClientVersion} from '../updaters/php/php-client-version';
import {VersionsMap, Version} from '../version';
import {Commit, ConventionalCommit, parseConventionalCommits} from '../commit';
import {CommitSplit} from '../util/commit-split';
import {DefaultUpdater} from '../updaters/default';
import {Release} from '../release';
import {ReleasePullRequest} from '../release-pull-request';
import {TagName} from '../util/tag-name';
import {PullRequestTitle} from '../util/pull-request-title';
import {BranchName} from '../util/branch-name';
import {PullRequestBody} from '../util/pull-request-body';
import {GitHubFileContents} from '@google-automations/git-file-utils';
import {FileNotFoundError} from '../errors';
import {PullRequest} from '../pull-request';

const CHANGELOG_SECTIONS = [
  {type: 'feat', section: 'Features'},
  {type: 'fix', section: 'Bug Fixes'},
  {type: 'perf', section: 'Performance Improvements'},
  {type: 'revert', section: 'Reverts'},
  {type: 'docs', section: 'Documentation'},
  {type: 'misc', section: 'Miscellaneous'},
  {type: 'chore', section: 'Chores', hidden: true},
  {type: 'style', section: 'Styles', hidden: true},
  {type: 'refactor', section: 'Code Refactoring', hidden: true},
  {type: 'test', section: 'Tests', hidden: true},
  {type: 'build', section: 'Build System', hidden: true},
  {type: 'ci', section: 'Continuous Integration', hidden: true},
];
interface ComposerJson {
  name: string;
  extra?: {
    component?: {
      entry?: string;
    };
  };
}
interface ComponentInfo {
  versionContents: GitHubFileContents;
  composer: ComposerJson;
}

export class PHPYoshi extends BaseStrategy {
  constructor(options: BaseStrategyOptions) {
    super({
      ...options,
      changelogSections: CHANGELOG_SECTIONS,
    });
  }
  async buildReleasePullRequest({
    commits,
    existingPullRequest,
    labels = [],
    latestRelease,
    draft,
    manifestPath,
  }: {
    commits: ConventionalCommit[];
    latestRelease?: Release;
    draft?: boolean;
    labels?: string[];
    existingPullRequest?: PullRequest;
    manifestPath: string;
  }): Promise<ReleasePullRequest | undefined> {
    const conventionalCommits = await this.postProcessCommits(
      parseConventionalCommits(commits, this.logger)
    );
    if (conventionalCommits.length === 0) {
      this.logger.info(`No commits for path: ${this.path}, skipping`);
      return undefined;
    }

    const newVersion = latestRelease
      ? await this.versioningStrategy.bump(
          latestRelease.tag.version,
          conventionalCommits
        )
      : this.initialReleaseVersion();
    const cs = new CommitSplit();
    const splitCommits = cs.split(conventionalCommits);
    const topLevelDirectories = Object.keys(splitCommits).sort();
    const versionsMap: VersionsMap = new Map();
    const directoryVersionContents: Record<string, ComponentInfo> = {};
    const component = await this.getComponent();
    const newVersionTag = new TagName(newVersion, component);
    let releaseNotesBody = `## ${newVersion.toString()}`;
    for (const directory of topLevelDirectories) {
      try {
        const contents = await this.github.getFileContentsOnBranch(
          this.addPath(`${directory}/VERSION`),
          this.changesBranch
        );
        const version = Version.parse(contents.parsedContent);
        const composer = await this.github.getFileJson<ComposerJson>(
          this.addPath(`${directory}/composer.json`),
          this.changesBranch
        );
        directoryVersionContents[directory] = {
          versionContents: contents,
          composer,
        };
        const newVersion = await this.versioningStrategy.bump(
          version,
          splitCommits[directory]
        );
        versionsMap.set(composer.name, newVersion);
        const partialReleaseNotes = await this.changelogNotes.buildNotes(
          splitCommits[directory],
          {
            host: this.changelogHost,
            owner: this.repository.owner,
            repository: this.repository.repo,
            version: newVersion.toString(),
            previousTag: latestRelease?.tag?.toString(),
            currentTag: newVersionTag.toString(),
            targetBranch: this.targetBranch,
            changesBranch: this.changesBranch,
            changelogSections: this.changelogSections,
          }
        );
        releaseNotesBody = updatePHPChangelogEntry(
          `${composer.name} ${newVersion.toString()}`,
          releaseNotesBody,
          partialReleaseNotes
        );
      } catch (err) {
        if (err instanceof FileNotFoundError) {
          // if the updated path has no VERSION, assume this isn't a
          // module that needs updating.
          continue;
        } else {
          throw err;
        }
      }
    }

    const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
      component || '',
      this.targetBranch,
      this.changesBranch,
      newVersion
    );
    const branchName = component
      ? BranchName.ofComponentTargetBranch(
          component,
          this.targetBranch,
          this.changesBranch
        )
      : BranchName.ofTargetBranch(this.targetBranch, this.changesBranch);

    const updates = await this.buildUpdates({
      changelogEntry: releaseNotesBody,
      newVersion,
      versionsMap,
      latestVersion: latestRelease?.tag.version,
      commits: conventionalCommits, // TODO(@bcoe): these commits will need to be divided into multiple changelog.json updates.
    });
    for (const directory in directoryVersionContents) {
      const componentInfo = directoryVersionContents[directory];
      const version = versionsMap.get(componentInfo.composer.name);
      if (!version) {
        this.logger.warn(`No version found for ${componentInfo.composer.name}`);
        continue;
      }
      updates.push({
        path: this.addPath(`${directory}/VERSION`),
        createIfMissing: false,
        cachedFileContents: componentInfo.versionContents,
        updater: new DefaultUpdater({
          version,
        }),
      });
      if (componentInfo.composer.extra?.component?.entry) {
        updates.push({
          path: this.addPath(
            `${directory}/${componentInfo.composer.extra.component.entry}`
          ),
          createIfMissing: false,
          updater: new PHPClientVersion({
            version,
          }),
        });
      }
    }
    // TODO use pullrequest header here?
    const pullRequestBody = new PullRequestBody([
      {
        component,
        version: newVersion,
        notes: releaseNotesBody,
      },
    ]);

    return {
      title: pullRequestTitle,
      body: pullRequestBody,
      updates,
      labels: [...labels, ...this.extraLabels],
      headRefName: branchName.toString(),
      version: newVersion,
      draft: draft ?? false,
    };
  }

  protected async parsePullRequestBody(
    pullRequestBody: string
  ): Promise<PullRequestBody | undefined> {
    const body = PullRequestBody.parse(pullRequestBody, this.logger);
    if (!body) {
      return undefined;
    }
    const component = await this.getComponent();
    const notes = body.releaseData
      .map(release => {
        return `<details><summary>${
          release.component
        }: ${release.version?.toString()}</summary>\n\n${
          release.notes
        }\n</details>`;
      })
      .join('\n\n');
    return new PullRequestBody([{component, notes}], {
      footer: body.footer,
      header: body.header,
    });
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;
    const versionsMap = options.versionsMap;

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    // update the aggregate package information in the root composer.json
    updates.push({
      path: this.addPath('composer.json'),
      createIfMissing: false,
      updater: new RootComposerUpdatePackages({
        version,
        versionsMap,
      }),
    });

    return updates;
  }
}

function updatePHPChangelogEntry(
  pkgKey: string,
  changelogEntry: string,
  entryUpdate: string
) {
  // Remove the first line of the entry, in favor of <summary>.
  // This also allows us to use the same regex for extracting release
  // notes (since the string "## v0.0.0" doesn't show up multiple times).
  const entryUpdateSplit: string[] = entryUpdate.split(/\r?\n/);
  entryUpdateSplit.shift();
  entryUpdate = entryUpdateSplit.join('\n');
  return `${changelogEntry}

<details><summary>${pkgKey}</summary>

${entryUpdate}

</details>`;
}
