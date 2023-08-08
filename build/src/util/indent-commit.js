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
exports.indentCommit = void 0;
function indentCommit(commit) {
    const reduced = [];
    let inList = false;
    commit.message.split(/\r?\n/).forEach((line, i) => {
        if (i !== 0)
            line = `  ${line}`;
        else
            reduced.push(line);
        if (/^\s*\*/.test(line)) {
            inList = true;
            reduced.push(line);
        }
        else if (/^ +[\w]/.test(line) && inList) {
            reduced[reduced.length - 1] = `${reduced[reduced.length - 1]}\n${line}`;
        }
        else {
            inList = false;
        }
    });
    return reduced.join('\n');
}
exports.indentCommit = indentCommit;
//# sourceMappingURL=indent-commit.js.map