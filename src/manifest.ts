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

import {GitHub, GitHubFileContents} from './github';
import {ReleaseType} from './releasers';
import {RELEASE_PLEASE_CONFIG, RELEASE_PLEASE_MANIFEST} from './constants';
import {ManifestConstructorOptions} from '.';
import {ChangelogSection} from './conventional-commits';
import {CheckpointType, checkpoint, Checkpoint} from './util/checkpoint';
import {GitHubReleaseResponse} from './github-release';

interface ReleaserConfig {
  'release-type'?: ReleaseType;
  'bump-minor-pre-major'?: boolean;
  'changelog-sections'?: ChangelogSection[];
}

interface ReleaserPackageConfig extends ReleaserConfig {
  'package-name'?: string;
}

export interface ManifestConfig extends ReleaserConfig {
  packages: Record<string, ReleaserPackageConfig>;
}

export class Manifest {
  gh: GitHub;
  configFileName: string;
  manifestFileName: string;
  checkpoint: Checkpoint;
  configFile?: GitHubFileContents;
  headManifest?: GitHubFileContents;

  constructor(options: ManifestConstructorOptions) {
    this.gh = options.github;
    this.configFileName = options.configFile || RELEASE_PLEASE_CONFIG;
    this.manifestFileName = options.manifestFile || RELEASE_PLEASE_MANIFEST;
    this.checkpoint = options.checkpoint || checkpoint;
  }

  protected async getFile(
    fileName: string,
    sha?: string
  ): Promise<GitHubFileContents> {
    let data;
    try {
      if (sha) {
        data = await this.gh.getFileContentsWithSimpleAPI(fileName, sha, false);
      } else {
        data = await this.gh.getFileContents(fileName);
      }
    } catch (e) {
      this.checkpoint(
        `Failed to get ${fileName} at ${sha ?? 'HEAD'}: ${e.status}`,
        CheckpointType.Failure
      );
      throw e;
    }
    return data;
  }

  protected async getManifest(sha?: string): Promise<GitHubFileContents> {
    if (sha === undefined) {
      if (!this.headManifest) {
        this.headManifest = await this.getFile(this.manifestFileName, sha);
      }
      return this.headManifest;
    }
    return await this.getFile(this.manifestFileName, sha);
  }

  protected async getConfig(): Promise<GitHubFileContents> {
    if (!this.configFile) {
      this.configFile = await this.getFile(this.configFileName);
    }
    return this.configFile;
  }

  private async validateJsonFile<T extends object>(
    getFileMethod: 'getConfig' | 'getManifest',
    fileName: string
  ): Promise<{valid: true; obj: T} | {valid: false; obj: undefined}> {
    let response: {valid: true; obj: T} | {valid: false; obj: undefined} = {
      valid: false,
      obj: undefined,
    };
    const file = await this[getFileMethod]();
    try {
      const obj: T = JSON.parse(file.parsedContent);
      if (obj.constructor.name === 'Object') {
        response = {valid: true, obj: obj};
      }
    } catch (e) {
      this.checkpoint(`Invalid JSON in ${fileName}`, CheckpointType.Failure);
    }
    return response;
  }

  protected async validate(): Promise<boolean> {
    const configValidation = await this.validateJsonFile<ManifestConfig>(
      'getConfig',
      this.configFileName
    );
    let validConfig = false;
    if (configValidation.valid) {
      validConfig = !!Object.keys(configValidation.obj.packages ?? {}).length;
      if (!validConfig) {
        this.checkpoint(
          `No packages found: ${this.configFileName}`,
          CheckpointType.Failure
        );
      }
    }

    const manifestValidation = await this.validateJsonFile<
      Record<string, string>
    >('getManifest', this.manifestFileName);
    let validManifest = false;
    if (manifestValidation.valid) {
      validManifest = true;
      const versions = manifestValidation.obj;
      for (const version in versions) {
        if (typeof versions[version] !== 'string') {
          validManifest = false;
          this.checkpoint(
            `${this.manifestFileName} must only contain string values`,
            CheckpointType.Failure
          );
          break;
        }
      }
    }
    return validConfig && validManifest;
  }

  async pullRequest(): Promise<number | undefined> {
    const valid = await this.validate();
    if (!valid) {
      return;
    }
    return 1;
  }

  async githubRelease(): Promise<GitHubReleaseResponse[] | undefined> {
    const valid = await this.validate();
    if (!valid) {
      return;
    }
    return [
      {
        major: 1,
        minor: 1,
        patch: 1,
        version: '1.1.1',
        sha: 'abc123',
        html_url: 'https://release.url',
        name: 'foo foo-v1.1.1',
        tag_name: 'foo-v1.1.1',
        upload_url: 'https://upload.url/',
        pr: 1,
        draft: false,
      },
    ];
  }
}
