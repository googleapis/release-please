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
exports.OCaml = void 0;
// Generic
const changelog_1 = require("../updaters/changelog");
// OCaml
const opam_1 = require("../updaters/ocaml/opam");
const esy_json_1 = require("../updaters/ocaml/esy-json");
const dune_project_1 = require("../updaters/ocaml/dune-project");
const base_1 = require("./base");
const notEsyLock = (path) => !path.startsWith('esy.lock');
class OCaml extends base_1.BaseStrategy {
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
        const jsonPaths = await this.github.findFilesByExtension('json', this.path);
        for (const path of jsonPaths) {
            if (notEsyLock(path)) {
                const contents = await this.github.getFileContents(this.addPath(path));
                const pkg = JSON.parse(contents.parsedContent);
                if (pkg.version !== undefined) {
                    updates.push({
                        path: this.addPath(path),
                        createIfMissing: false,
                        cachedFileContents: contents,
                        updater: new esy_json_1.EsyJson({
                            version,
                        }),
                    });
                }
            }
        }
        const opamPaths = await this.github.findFilesByExtension('opam', this.path);
        opamPaths.filter(notEsyLock).forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new opam_1.Opam({
                    version,
                }),
            });
        });
        const opamLockedPaths = await this.github.findFilesByExtension('opam.locked', this.path);
        opamLockedPaths.filter(notEsyLock).forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new opam_1.Opam({
                    version,
                }),
            });
        });
        updates.push({
            path: this.addPath('dune-project'),
            createIfMissing: false,
            updater: new dune_project_1.DuneProject({
                version,
            }),
        });
        return updates;
    }
}
exports.OCaml = OCaml;
//# sourceMappingURL=ocaml.js.map