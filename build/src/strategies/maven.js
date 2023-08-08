"use strict";
// Copyright 2022 Google LLC
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
exports.Maven = void 0;
const java_1 = require("./java");
const java_released_1 = require("../updaters/java/java-released");
const generic_1 = require("../updaters/generic");
const pom_xml_1 = require("../updaters/java/pom-xml");
/**
 * Strategy for Maven projects. It generates SNAPSHOT version after each release, and updates all found
 * pom.xml files automatically.
 */
class Maven extends java_1.Java {
    async buildUpdates(options) {
        const version = options.newVersion;
        const versionsMap = options.versionsMap;
        // Use generic Java updates
        const updates = await super.buildUpdates(options);
        // Update pom.xml files
        const pomFiles = await this.github.findFilesByFilenameAndRef('pom.xml', this.targetBranch, this.path);
        pomFiles.forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new pom_xml_1.PomXml(version),
            });
            if (!options.isSnapshot) {
                updates.push({
                    path: this.addPath(path),
                    createIfMissing: false,
                    updater: new java_released_1.JavaReleased({ version, versionsMap }),
                });
            }
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new generic_1.Generic({ version, versionsMap }),
            });
        });
        return updates;
    }
}
exports.Maven = Maven;
//# sourceMappingURL=maven.js.map