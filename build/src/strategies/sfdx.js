"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sfdx = void 0;
const base_1 = require("./base");
const changelog_1 = require("../updaters/changelog");
const errors_1 = require("../errors");
const sfdx_project_json_1 = require("../updaters/sfdx/sfdx-project-json");
const sfdxProjectJsonFileName = 'sfdx-project.json';
class Sfdx extends base_1.BaseStrategy {
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
        updates.push({
            path: this.addPath(sfdxProjectJsonFileName),
            createIfMissing: false,
            cachedFileContents: this.sfdxProjectJsonContents,
            updater: new sfdx_project_json_1.SfdxProjectJson({
                version,
            }),
        });
        return updates;
    }
    async getDefaultPackageName() {
        const pkgJsonContents = await this.getSfdxProjectJsonContents();
        const pkg = JSON.parse(pkgJsonContents.parsedContent);
        return pkg.name;
    }
    async getSfdxProjectJsonContents() {
        if (!this.sfdxProjectJsonContents) {
            try {
                this.sfdxProjectJsonContents =
                    await this.github.getFileContentsOnBranch(this.addPath(sfdxProjectJsonFileName), this.targetBranch);
            }
            catch (e) {
                if (e instanceof errors_1.FileNotFoundError) {
                    throw new errors_1.MissingRequiredFileError(this.addPath(sfdxProjectJsonFileName), 'sfdx', `${this.repository.owner}/${this.repository.repo}`);
                }
                throw e;
            }
        }
        return this.sfdxProjectJsonContents;
    }
}
exports.Sfdx = Sfdx;
//# sourceMappingURL=sfdx.js.map