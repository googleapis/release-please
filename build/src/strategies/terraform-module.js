"use strict";
// Copyright 2020 Google LLC
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
exports.TerraformModule = void 0;
// Generic
const changelog_1 = require("../updaters/changelog");
// Terraform specific.
const readme_1 = require("../updaters/terraform/readme");
const module_version_1 = require("../updaters/terraform/module-version");
const base_1 = require("./base");
const version_1 = require("../version");
class TerraformModule extends base_1.BaseStrategy {
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        updates.push({
            path: this.addPath(this.changelogPath),
            createIfMissing: true,
            updater: new changelog_1.Changelog({
                version,
                changelogEntry: options.changelogEntry,
            }),
        });
        // Update version in README to current candidate version.
        // A module may have submodules, so find all submodules.
        const readmeFiles = await Promise.all([
            this.github.findFilesByFilenameAndRef('readme.md', this.targetBranch, this.path),
            this.github.findFilesByFilenameAndRef('README.md', this.targetBranch, this.path),
        ]).then(([v, vt]) => {
            return v.concat(vt);
        });
        readmeFiles.forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new readme_1.ReadMe({
                    version,
                }),
            });
        });
        // Update versions.tf to current candidate version.
        // A module may have submodules, so find all versions.tfand versions.tf.tmpl to update.
        const versionFiles = await Promise.all([
            this.github.findFilesByFilenameAndRef('versions.tf', this.targetBranch, this.path),
            this.github.findFilesByFilenameAndRef('versions.tf.tmpl', this.targetBranch, this.path),
        ]).then(([v, vt]) => {
            return v.concat(vt);
        });
        versionFiles.forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new module_version_1.ModuleVersion({
                    version,
                }),
            });
        });
        return updates;
    }
    initialReleaseVersion() {
        return version_1.Version.parse('0.1.0');
    }
}
exports.TerraformModule = TerraformModule;
//# sourceMappingURL=terraform-module.js.map