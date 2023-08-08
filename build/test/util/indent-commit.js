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
const indent_commit_1 = require("../../src/util/indent-commit");
const mocha_1 = require("mocha");
const snapshot = require("snap-shot-it");
(0, mocha_1.describe)('indentCommit', () => {
    (0, mocha_1.it)('handles carriage return', () => {
        snapshot((0, indent_commit_1.indentCommit)({
            message: `feat: my awesome commit message\r
* testing one line\r
* testing second line`,
            sha: 'abc123',
            files: [],
        }));
    });
    (0, mocha_1.it)('only adds lines prefixed with * to CHANGELOG', () => {
        snapshot((0, indent_commit_1.indentCommit)({
            message: `feat: my awesome commit message

* testing one line
* testing second line

[Fixes #32]`,
            sha: 'abc123',
            files: [],
        }));
    });
    (0, mocha_1.it)('handles multiple lines of multi-line text', () => {
        snapshot((0, indent_commit_1.indentCommit)({
            message: `feat: my awesome commit message
* testing one line
  this is a second line of text
  this is a third line
* testing second line
  this is a second line`,
            sha: 'abc123',
            files: [],
        }));
    });
});
//# sourceMappingURL=indent-commit.js.map