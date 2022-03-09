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
import {BaseStrategyOptions} from './base';
import {GitHubFileContents} from '../util/file-cache';
import {GitHubAPIError, MissingRequiredFileError} from '../errors';
import {ConventionalCommit} from '../commit';
import {logger} from '../util/logger';
import {Java, JavaBuildUpdatesOption} from './java';

export class JavaYoshi extends Java {
  private versionsContent?: GitHubFileContents;

  constructor(options: BaseStrategyOptions) {
    super(options);
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

  protected async addComponentVersion(
    versionMap: VersionsMap,
    _version: Version
  ): Promise<VersionsMap> {
    return versionMap; // don't add current component to the map
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
    const version = options.newVersion;
    const versionsMap = options.versionsMap;

    const updates = await super.buildUpdates(options);

    updates.push({
      path: this.addPath('versions.txt'),
      createIfMissing: false,
      cachedFileContents: this.versionsContent,
      updater: new VersionsManifest({
        version,
        versionsMap,
      }),
    });

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
