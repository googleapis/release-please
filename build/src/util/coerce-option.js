"use strict";
// Copyright 2019 Google LLC
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
exports.coerceOption = void 0;
const fs_1 = require("fs");
// if an option looks like a file path, assume it's a
// path to a key and load it.
function coerceOption(option) {
    if (option.match(/[\\/]/)) {
        try {
            const stat = (0, fs_1.statSync)(option);
            if (stat.isDirectory())
                return option;
            else
                return (0, fs_1.readFileSync)(option, 'utf8').trim();
        }
        catch (err) {
            // simply fallback to returning the original option.
        }
    }
    return option;
}
exports.coerceOption = coerceOption;
//# sourceMappingURL=coerce-option.js.map