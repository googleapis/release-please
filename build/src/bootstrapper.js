"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bootstrapper = void 0;
const manifest_1 = require("./manifest");
const version_1 = require("./version");
const release_please_manifest_1 = require("./updaters/release-please-manifest");
const release_please_config_1 = require("./updaters/release-please-config");
class Bootstrapper {
    constructor(github, targetBranch, manifestFile = manifest_1.DEFAULT_RELEASE_PLEASE_MANIFEST, configFile = manifest_1.DEFAULT_RELEASE_PLEASE_CONFIG, initialVersionString = '0.0.0') {
        this.github = github;
        this.targetBranch = targetBranch;
        this.manifestFile = manifestFile;
        this.configFile = configFile;
        this.initialVersion = version_1.Version.parse(initialVersionString);
    }
    async bootstrap(path, config) {
        const pullRequest = await this.buildPullRequest(path, config);
        return await this.github.createPullRequest(pullRequest, this.targetBranch, pullRequest.title, pullRequest.updates, {});
    }
    async buildPullRequest(path, config) {
        const message = `chore: bootstrap releases for path: ${path}`;
        const branchName = path === manifest_1.ROOT_PROJECT_PATH ? 'default' : path;
        const version = this.initialVersion;
        const versionsMap = new Map();
        versionsMap.set(path, version);
        const updates = [
            {
                path: this.manifestFile,
                createIfMissing: true,
                updater: new release_please_manifest_1.ReleasePleaseManifest({ version, versionsMap }),
            },
            {
                path: this.configFile,
                createIfMissing: true,
                updater: new release_please_config_1.ReleasePleaseConfig(path, config),
            },
        ];
        return {
            title: message,
            body: `Configuring release-please for path: ${path}`,
            baseBranchName: this.targetBranch,
            headBranchName: `release-please/bootstrap/${branchName}`,
            updates,
            number: -1,
            labels: [],
            files: [],
        };
    }
}
exports.Bootstrapper = Bootstrapper;
//# sourceMappingURL=bootstrapper.js.map