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

import {
  DEFAULT_RELEASE_PLEASE_MANIFEST,
  DEFAULT_RELEASE_PLEASE_CONFIG,
  ReleaserConfig,
  ROOT_PROJECT_PATH,
} from './manifest';
import {PullRequest} from './pull-request';
import {Version, VersionsMap} from './version';
import {Update} from './update';
import {ReleasePleaseManifest} from './updaters/release-please-manifest';
import {ReleasePleaseConfig} from './updaters/release-please-config';
import {Scm} from './scm';

export class Bootstrapper {
  private scm: Scm;
  private targetBranch: string;
  private manifestFile: string;
  private configFile: string;
  private initialVersion: Version;
  constructor(
    scm: Scm,
    targetBranch: string,
    manifestFile: string = DEFAULT_RELEASE_PLEASE_MANIFEST,
    configFile: string = DEFAULT_RELEASE_PLEASE_CONFIG,
    initialVersionString = '0.0.0'
  ) {
    this.scm = scm;
    this.targetBranch = targetBranch;
    this.manifestFile = manifestFile;
    this.configFile = configFile;
    this.initialVersion = Version.parse(initialVersionString);
  }

  async bootstrap(path: string, config: ReleaserConfig): Promise<PullRequest> {
    const message = `chore: bootstrap releases for path: ${path}`;
    const branchName = path === ROOT_PROJECT_PATH ? 'default' : path;
    const pullRequest = {
      headBranchName: `release-please/bootstrap/${branchName}`,
      baseBranchName: this.targetBranch,
      number: -1,
      title: message,
      body: `Configuring release-please for path: ${path}`,
      labels: [],
      files: [],
    };
    const version = this.initialVersion;
    const versionsMap: VersionsMap = new Map();
    versionsMap.set(path, version);
    const updates: Update[] = [
      {
        path: this.manifestFile,
        createIfMissing: true,
        updater: new ReleasePleaseManifest({version, versionsMap}),
      },
      {
        path: this.configFile,
        createIfMissing: true,
        updater: new ReleasePleaseConfig(path, config),
      },
    ];
    return await this.scm.createPullRequest(
      pullRequest,
      this.targetBranch,
      message,
      updates,
      {}
    );
  }
}
