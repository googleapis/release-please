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
exports.KRMBlueprint = void 0;
// Generic
const changelog_1 = require("../updaters/changelog");
// KRM specific.
const krm_blueprint_version_1 = require("../updaters/krm/krm-blueprint-version");
const base_1 = require("./base");
const version_1 = require("../version");
const KRMBlueprintAttribAnnotation = 'cnrm.cloud.google.com/blueprint';
const hasKRMBlueprintAttrib = (content) => content.includes(KRMBlueprintAttribAnnotation);
class KRMBlueprint extends base_1.BaseStrategy {
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
        const versionsMap = new Map();
        if (options.latestVersion) {
            versionsMap.set('previousVersion', options.latestVersion);
        }
        // Update version in all yaml files with attribution annotation
        const yamlPaths = await this.github.findFilesByExtensionAndRef('yaml', this.targetBranch, this.path);
        for (const yamlPath of yamlPaths) {
            const contents = await this.github.getFileContents(this.addPath(yamlPath));
            if (hasKRMBlueprintAttrib(contents.parsedContent)) {
                updates.push({
                    path: this.addPath(yamlPath),
                    createIfMissing: false,
                    cachedFileContents: contents,
                    updater: new krm_blueprint_version_1.KRMBlueprintVersion({
                        version,
                        versionsMap,
                    }),
                });
            }
        }
        return updates;
    }
    initialReleaseVersion() {
        return version_1.Version.parse('0.1.0');
    }
}
exports.KRMBlueprint = KRMBlueprint;
//# sourceMappingURL=krm-blueprint.js.map