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
const coerce_option_1 = require("../../src/util/coerce-option");
const path_1 = require("path");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const fixturesPath = './test/fixtures';
(0, mocha_1.describe)('coerceOption', () => {
    (0, mocha_1.it)('is a noop if option does not look like path', () => {
        (0, chai_1.expect)((0, coerce_option_1.coerceOption)('helloworld')).to.equal('helloworld');
    });
    (0, mocha_1.it)('returns path-like option, if it does not exist', () => {
        (0, chai_1.expect)((0, coerce_option_1.coerceOption)('this/path/does/not/exist')).to.equal('this/path/does/not/exist');
    });
    (0, mocha_1.it)('returns path-like option, if it resolves to a folder', () => {
        (0, chai_1.expect)((0, coerce_option_1.coerceOption)(fixturesPath)).to.equal(fixturesPath);
    });
    (0, mocha_1.it)('returns file contents if option is path-like, and it resolves to file', () => {
        const coerced = (0, coerce_option_1.coerceOption)((0, path_1.resolve)(fixturesPath, 'key.txt'));
        (0, chai_1.expect)(coerced).to.equal('abc123');
    });
});
//# sourceMappingURL=coerce-option.js.map