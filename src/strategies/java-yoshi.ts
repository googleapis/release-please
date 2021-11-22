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

import {Update} from '../update';
import {VersionsManifest} from '../updaters/java/versions-manifest';
import {Version, VersionsMap} from '../version';
import {JavaUpdate} from '../updaters/java/java-update';
import {Strategy, StrategyOptions, BuildUpdatesOptions} from '../strategy';
import {Changelog} from '../updaters/changelog';
import {GitHubFileContents} from '../github';
import {JavaSnapshot} from '../versioning-strategies/java-snapshot';
import {GitHubAPIError, MissingRequiredFileError} from '../errors';
import {Commit} from '../commit';
import {Release} from '../release';
import {ReleasePullRequest} from '../release-pull-request';
import {logger} from '../util/logger';
import {PullRequestTitle} from '../util/pull-request-title';
import {BranchName} from '../util/branch-name';
import {PullRequestBody} from '../util/pull-request-body';
import {VersioningStrategy} from '../versioning-strategy';
import {DefaultVersioningStrategy} from '../versioning-strategies/default';
import {JavaAddSnapshot} from '../versioning-strategies/java-add-snapshot';

const CHANGELOG_SECTIONS = [
  {type: 'feat', section: 'Features'},
  {type: 'fix', section: 'Bug Fixes'},
  {type: 'perf', section: 'Performance Improvements'},
  {type: 'deps', section: 'Dependencies'},
  {type: 'revert', section: 'Reverts'},
  {type: 'docs', section: 'Documentation'},
  {type: 'style', section: 'Styles', hidden: true},
  {type: 'chore', section: 'Miscellaneous Chores', hidden: true},
  {type: 'refactor', section: 'Code Refactoring', hidden: true},
  {type: 'test', section: 'Tests', hidden: true},
  {type: 'build', section: 'Build System', hidden: true},
  {type: 'ci', section: 'Continuous Integration', hidden: true},
];

interface JavaStrategyOptions extends StrategyOptions {
  extraFiles?: string[];
}

export class JavaYoshi extends Strategy {
  readonly extraFiles: string[];
  private versionsContent?: GitHubFileContents;
  private snapshotVersioning: VersioningStrategy;

  constructor(options: JavaStrategyOptions) {
    options.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
    // wrap the configured versioning strategy with snapshotting
    const parentVersioningStrategy =
      options.versioningStrategy || new DefaultVersioningStrategy();
    options.versioningStrategy = new JavaSnapshot(parentVersioningStrategy);
    super(options);
    this.extraFiles = options.extraFiles || [];
    this.snapshotVersioning = new JavaAddSnapshot(parentVersioningStrategy);
  }

  async buildReleasePullRequest(
    commits: Commit[],
    latestRelease?: Release,
    draft?: boolean,
    labels: string[] = []
  ): Promise<ReleasePullRequest | undefined> {
    if (await this.needsSnapshot()) {
      logger.info('Repository needs a snapshot bump.');
      return await this.buildSnapshotPullRequest(latestRelease);
    }
    logger.info('No Java snapshot needed');
    return await super.buildReleasePullRequest(
      commits,
      latestRelease,
      draft,
      labels
    );
  }

  private async buildSnapshotPullRequest(
    latestRelease?: Release
  ): Promise<ReleasePullRequest> {
    const component = await this.getComponent();
    const newVersion = latestRelease
      ? await this.snapshotVersioning.bump(latestRelease.tag.version, [])
      : this.initialReleaseVersion();
    const versionsMap = await this.buildVersionsMap();
    for (const versionKey of versionsMap.keys()) {
      const version = versionsMap.get(versionKey);
      if (!version) {
        logger.warn(`didn't find version for ${versionKey}`);
        continue;
      }
      const newVersion = await this.snapshotVersioning.bump(version, []);
      versionsMap.set(versionKey, newVersion);
    }
    const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
      component || '',
      this.targetBranch,
      newVersion
    );
    const branchName = component
      ? BranchName.ofComponentTargetBranch(component, this.targetBranch)
      : BranchName.ofTargetBranch(this.targetBranch);
    const pullRequestBody = new PullRequestBody([
      {
        component,
        version: newVersion,
        notes:
          '### Updating meta-information for bleeding-edge SNAPSHOT release.',
      },
    ]);
    return {
      title: pullRequestTitle,
      body: pullRequestBody,
      updates: [
        {
          path: this.addPath('versions.txt'),
          createIfMissing: false,
          updater: new VersionsManifest({
            version: newVersion,
            versionsMap,
          }),
        },
      ],
      labels: [],
      headRefName: branchName.toString(),
      version: newVersion,
      draft: false,
    };
  }

  private async needsSnapshot(): Promise<boolean> {
    return VersionsManifest.needsSnapshot(
      (await this.getVersionsContent()).parsedContent
    );
  }

  protected async buildVersionsMap(): Promise<VersionsMap> {
    this.versionsContent = await this.getVersionsContent();
    return VersionsManifest.parseVersions(this.versionsContent.parsedContent);
  }

  protected async getVersionsContent(): Promise<GitHubFileContents> {
    if (!this.versionsContent) {
      try {
        this.versionsContent = await this.github.getFileContentsOnBranch(
          'versions.txt',
          this.targetBranch
        );
      } catch (err) {
        if (err instanceof GitHubAPIError) {
          throw new MissingRequiredFileError(
            'versions.txt',
            JavaYoshi.name,
            `${this.repository.owner}/${this.repository.repo}`
          );
        }
        throw err;
      }
    }
    return this.versionsContent;
  }

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;
    const versionsMap = options.versionsMap;

    updates.push({
      path: this.addPath('versions.txt'),
      createIfMissing: false,
      cachedFileContents: this.versionsContent,
      updater: new VersionsManifest({
        version,
        versionsMap,
      }),
    });

    const pomFilesSearch = this.github.findFilesByFilename(
      'pom.xml',
      this.path
    );
    const buildFilesSearch = this.github.findFilesByFilename(
      'build.gradle',
      this.path
    );
    const dependenciesSearch = this.github.findFilesByFilename(
      'dependencies.properties',
      this.path
    );

    const pomFiles = await pomFilesSearch;
    pomFiles.forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new JavaUpdate({
          version,
          versionsMap,
        }),
      });
    });

    const buildFiles = await buildFilesSearch;
    buildFiles.forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new JavaUpdate({
          version,
          versionsMap,
        }),
      });
    });

    const dependenciesFiles = await dependenciesSearch;
    dependenciesFiles.forEach(path => {
      updates.push({
        path: this.addPath(path),
        createIfMissing: false,
        updater: new JavaUpdate({
          version,
          versionsMap,
        }),
      });
    });

    this.extraFiles.forEach(path => {
      updates.push({
        path,
        createIfMissing: false,
        updater: new JavaUpdate({
          version,
          versionsMap,
        }),
      });
    });

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    return updates;
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }
}
