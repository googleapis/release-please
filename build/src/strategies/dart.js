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
exports.Dart = void 0;
// Generic
const changelog_1 = require("../updaters/changelog");
const yaml = require("js-yaml");
// pubspec
const pubspec_yaml_1 = require("../updaters/dart/pubspec-yaml");
const base_1 = require("./base");
const errors_1 = require("../errors");
class Dart extends base_1.BaseStrategy {
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
            path: this.addPath('pubspec.yaml'),
            createIfMissing: false,
            cachedFileContents: this.pubspecYmlContents,
            updater: new pubspec_yaml_1.PubspecYaml({
                version,
            }),
        });
        return updates;
    }
    async getDefaultPackageName() {
        const pubspecYmlContents = await this.getPubspecYmlContents();
        const pubspec = yaml.load(pubspecYmlContents.parsedContent, { json: true });
        if (typeof pubspec === 'object') {
            return pubspec.name;
        }
        else {
            return undefined;
        }
    }
    async getPubspecYmlContents() {
        if (!this.pubspecYmlContents) {
            try {
                this.pubspecYmlContents = await this.github.getFileContentsOnBranch(this.addPath('pubspec.yaml'), this.targetBranch);
            }
            catch (e) {
                if (e instanceof errors_1.FileNotFoundError) {
                    throw new errors_1.MissingRequiredFileError(this.addPath('pubspec.yaml'), Dart.name, `${this.repository.owner}/${this.repository.repo}`);
                }
                throw e;
            }
        }
        return this.pubspecYmlContents;
    }
}
exports.Dart = Dart;
//# sourceMappingURL=dart.js.map