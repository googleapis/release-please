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
exports.ReleasePleaseManifest = void 0;
const json_stringify_1 = require("../util/json-stringify");
const default_1 = require("./default");
class ReleasePleaseManifest extends default_1.DefaultUpdater {
    updateContent(content) {
        const parsed = content ? JSON.parse(content) : {};
        for (const [path, version] of this.versionsMap) {
            parsed[path] = version.toString();
        }
        if (content) {
            return (0, json_stringify_1.jsonStringify)(parsed, content);
        }
        else {
            return JSON.stringify(parsed, null, 2);
        }
    }
}
exports.ReleasePleaseManifest = ReleasePleaseManifest;
//# sourceMappingURL=release-please-manifest.js.map