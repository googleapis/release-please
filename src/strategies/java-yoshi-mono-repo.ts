// Copyright 2023 Google LLC
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
import {Changelog} from '../updaters/changelog';
import {ChangelogJson} from '../updaters/changelog-json';
import {CommitSplit} from '../util/commit-split';
import {CompositeUpdater} from '../updaters/composite';
import {Updater} from '../update';

import {GitHubFileContents} from '@google-automations/git-file-utils';
import {
  FileNotFoundError,
  GitHubAPIError,
  MissingRequiredFileError,
} from '../errors';
import {ConventionalCommit} from '../commit';
import {Java, JavaBuildUpdatesOption} from './java';
import {JavaUpdate} from '../updaters/java/java-update';
import {filterCommits} from '../util/filter-commits';

export class JavaYoshiMonoRepo extends Java {
  private versionsContent?: GitHubFileContents;

  /**
   * Override this method to post process commits
   * @param {ConventionalCommit[]} commits parsed commits
   * @returns {ConventionalCommit[]} modified commits
   */
  protected async postProcessCommits(
    commits: ConventionalCommit[]
  ): Promise<ConventionalCommit[]> {
    if (commits.length === 0) {
      // For Java commits, push a fake commit so we force a
      // SNAPSHOT release
      commits.push({
        type: 'fake',
        bareMessage: 'fake commit',
        message: 'fake commit',
        breaking: false,
        scope: null,
        notes: [],
        files: [],
        references: [],
        sha: 'fake',
      });
    }
    return commits;
  }

  protected async needsSnapshot(): Promise<boolean> {
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
          this.changesBranch
        );
      } catch (err) {
        if (err instanceof GitHubAPIError) {
          throw new MissingRequiredFileError(
            this.addPath('versions.txt'),
            JavaYoshiMonoRepo.name,
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
      this.changesBranch,
      this.path
    );
    const buildFilesSearch = this.github.findFilesByFilenameAndRef(
      'build.gradle',
      this.changesBranch,
      this.path
    );
    const dependenciesSearch = this.github.findFilesByFilenameAndRef(
      'dependencies.properties',
      this.changesBranch,
      this.path
    );
    const readmeFilesSearch = this.github.findFilesByFilenameAndRef(
      'README.md',
      this.changesBranch,
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

    const readmeFiles = await readmeFilesSearch;
    readmeFiles.forEach(path => {
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

    this.extraFiles.forEach(extraFile => {
      if (typeof extraFile === 'object') {
        return;
      }
      updates.push({
        path: extraFile,
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

      // Bail early if the repository has no root changelog.json.
      // This file is used to opt into machine readable commits.
      const hasChangelogJson = await this.hasChangelogJson();
      if (hasChangelogJson && options.commits) {
        const changelogUpdates: Array<Updater> = [];
        const cs = new CommitSplit({
          includeEmpty: false,
        });
        const splitCommits = cs.split(
          filterCommits(options.commits, this.changelogSections)
        );
        for (const path of Object.keys(splitCommits)) {
          const repoMetadata = await this.getRepoMetadata(path);
          const artifactName = repoMetadata
            ? repoMetadata['distribution_name']
            : null;
          if (repoMetadata && artifactName) {
            this.logger.info(`Found artifact ${artifactName} for ${path}`);
            changelogUpdates.push(
              new ChangelogJson({
                artifactName,
                version,
                // We filter out "chore:" commits, to reduce noise in the upstream
                // release notes. We will only show a product release note entry
                // if there has been a substantial change, such as a fix or feature.
                commits: splitCommits[path],
                language: 'JAVA',
              })
            );
          }
        }
        updates.push({
          path: 'changelog.json',
          createIfMissing: false,
          updater: new CompositeUpdater(...changelogUpdates),
        });
      }
    }

    return updates;
  }

  private async hasChangelogJson(): Promise<Boolean> {
    try {
      const content = await this.github.getFileContentsOnBranch(
        'changelog.json',
        this.changesBranch
      );
      return !!content;
    } catch (e) {
      if (e instanceof FileNotFoundError) return false;
      else throw e;
    }
  }

  private async getRepoMetadata(
    path: string
  ): Promise<Record<string, string> | null> {
    try {
      const content = await this.github.getFileContentsOnBranch(
        this.addPath(`${path}/.repo-metadata.json`),
        this.changesBranch
      );
      return content ? JSON.parse(content.parsedContent) : null;
    } catch (e) {
      if (e instanceof FileNotFoundError) return null;
      else throw e;
    }
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
        this.logger.warn(`didn't find version for ${versionKey}`);
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
    return Version.parse('0.0.1');
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
