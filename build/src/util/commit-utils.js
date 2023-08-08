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
exports.normalizePaths = void 0;
const normalizePaths = (paths) => {
    return paths.map(path => {
        // normalize so that all paths have leading and trailing slashes for
        // non-overlap validation.
        // NOTE: GitHub API always returns paths using the `/` separator,
        // regardless of what platform the client code is running on
        let newPath = path.replace(/\/$/, '');
        newPath = newPath.replace(/^\//, '');
        newPath = newPath.replace(/$/, '/');
        newPath = newPath.replace(/^/, '/');
        // store them with leading and trailing slashes removed.
        newPath = newPath.replace(/\/$/, '');
        newPath = newPath.replace(/^\//, '');
        return newPath;
    });
};
exports.normalizePaths = normalizePaths;
//# sourceMappingURL=commit-utils.js.map