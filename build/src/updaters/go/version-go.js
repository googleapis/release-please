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
exports.VersionGo = void 0;
const default_1 = require("../default");
class VersionGo extends default_1.DefaultUpdater {
    updateContent(content) {
        return content.replace(/const Version = "[0-9]+\.[0-9]+\.[0-9](-\w+)?"/, `const Version = "${this.version.toString()}"`);
    }
}
exports.VersionGo = VersionGo;
//# sourceMappingURL=version-go.js.map