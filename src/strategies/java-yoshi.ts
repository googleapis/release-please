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
import {BaseStrategy, BuildUpdatesOptions, BaseStrategyOptions} from './base';
import {Changelog} from '../updaters/changelog';
import {GitHubFileContents} from '../github';
import {JavaSnapshot} from '../versioning-strategies/java-snapshot';
import {GitHubAPIError, MissingRequiredFileError} from '../errors';
import {Commit, ConventionalCommit} from '../commit';
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

interface JavaBuildUpdatesOption extends BuildUpdatesOptions {
  isSnapshot?: boolean;
}

export class JavaYoshi extends BaseStrategy {
  private versionsContent?: GitHubFileContents;
  private snapshotVersioning: VersioningStrategy;

  constructor(options: BaseStrategyOptions) {
    options.changelogSections = options.changelogSections ?? CHANGELOG_SECTIONS;
    // wrap the configured versioning strategy with snapshotting
    const parentVersioningStrategy =
      options.versioningStrategy || new DefaultVersioningStrategy();
    options.versioningStrategy = new JavaSnapshot(parentVersioningStrategy);
    super(options);
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
    const notes =
      '### Updating meta-information for bleeding-edge SNAPSHOT release.';
    const pullRequestBody = new PullRequestBody([
      {
        component,
        version: newVersion,
        notes,
      },
    ]);
    const updates = await this.buildUpdates({
      newVersion,
      versionsMap,
      changelogEntry: notes,
      isSnapshot: true,
    });
    return {
      title: pullRequestTitle,
      body: pullRequestBody,
      updates,
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
          this.addPath('versions.txt'),
          this.targetBranch
        );
      } catch (err) {
        if (err instanceof GitHubAPIError) {
          throw new MissingRequiredFileError(
            this.addPath('versions.txt'),
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
    options: JavaBuildUpdatesOption
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

    const pomFilesSearch = this.github.findFilesByFilenameAndRef(
      'pom.xml',
      this.targetBranch,
      this.path
    );
    const buildFilesSearch = this.github.findFilesByFilenameAndRef(
      'build.gradle',
      this.targetBranch,
      this.path
    );
    const dependenciesSearch = this.github.findFilesByFilenameAndRef(
      'dependencies.properties',
      this.targetBranch,
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
          isSnapshot: options.isSnapshot,
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
          isSnapshot: options.isSnapshot,
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
          isSnapshot: options.isSnapshot,
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
          isSnapshot: options.isSnapshot,
        }),
      });
    });

    if (!options.isSnapshot) {
      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version,
          changelogEntry: options.changelogEntry,
        }),
      });
    }

    return updates;
  }

  protected async updateVersionsMap(
    versionsMap: VersionsMap,
    conventionalCommits: ConventionalCommit[]
  ): Promise<VersionsMap> {
    let isPromotion = false;
    const modifiedCommits: ConventionalCommit[] = [];
    for (const commit of conventionalCommits) {
      if (isPromotionCommit(commit)) {
        isPromotion = true;
        modifiedCommits.push({
          ...commit,
          notes: commit.notes.filter(note => !isPromotionNote(note)),
        });
      } else {
        modifiedCommits.push(commit);
      }
    }
    for (const versionKey of versionsMap.keys()) {
      const version = versionsMap.get(versionKey);
      if (!version) {
        logger.warn(`didn't find version for ${versionKey}`);
        continue;
      }
      if (isPromotion && isStableArtifact(versionKey)) {
        versionsMap.set(versionKey, Version.parse('1.0.0'));
      } else {
        const newVersion = await this.versioningStrategy.bump(
          version,
          modifiedCommits
        );
        versionsMap.set(versionKey, newVersion);
      }
    }
    return versionsMap;
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }
}

const VERSIONED_ARTIFACT_REGEX = /^.*-(v\d+[^-]*)$/;
const VERSION_REGEX = /^v\d+(.*)$/;

/**
 * Returns true if the artifact should be considered stable
 * @param artifact name of the artifact to check
 */
function isStableArtifact(artifact: string): boolean {
  const match = artifact.match(VERSIONED_ARTIFACT_REGEX);
  if (!match) {
    // The artifact does not have a version qualifier at the end
    return true;
  }

  const versionMatch = match[1].match(VERSION_REGEX);
  if (versionMatch && versionMatch[1]) {
    // The version is not stable (probably alpha/beta/rc)
    return false;
  }

  return true;
}

function isPromotionCommit(commit: ConventionalCommit): boolean {
  return commit.notes.some(isPromotionNote);
}

function isPromotionNote(note: {title: string; text: string}): boolean {
  return note.title === 'RELEASE AS' && note.text === '1.0.0';
}
