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
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const common_1 = require("../../../src/updaters/ruby/common");
const version_1 = require("../../../src/version");
(0, mocha_1.describe)('ruby-common', () => {
    (0, mocha_1.describe)('resolveRubyGemfileLockVersion', () => {
        // input, expected
        const testTable = [
            ['0.0.0', '0.0.0'],
            ['1.2.3', '1.2.3'],
            ['15.10.22', '15.10.22'],
            ['1.0.0-alpha', '1.0.0.pre.alpha'],
            ['1.0.0-alpha1', '1.0.0.pre.alpha1'],
            ['2.0.0-rc1', '2.0.0.pre.rc1'],
        ];
        testTable.forEach(([input, expected]) => {
            (0, mocha_1.it)(`${input} should resolve to ${expected}`, () => {
                (0, chai_1.expect)((0, common_1.resolveRubyGemfileLockVersion)(version_1.Version.parse(input).toString())).to.equal(expected);
            });
        });
    });
    (0, mocha_1.describe)('stringifyRubyVersion', () => {
        // input, expected
        const testTable = [
            ['0.2.0', '0.2.0'],
            ['1.2.3', '1.2.3'],
            ['1.2.10', '1.2.10'],
            ['15.10.22', '15.10.22'],
            ['1.0.0-alpha', '1.0.0-alpha'],
            ['1.0.0-alpha1', '1.0.0-alpha1'],
            ['2.0.0-rc1', '2.0.0-rc1'],
        ];
        testTable.forEach(([input, expected]) => {
            (0, mocha_1.it)(`${input} should equal ${expected}`, () => {
                (0, chai_1.expect)((0, common_1.stringifyRubyVersion)(version_1.Version.parse(input))).to.equal(expected);
            });
        });
        (0, mocha_1.describe)('combined with resolve resolveRubyGemfileLockVersion', () => {
            // input, expected
            const testTable = [
                ['0.2.0', '0.2.0'],
                ['1.2.3', '1.2.3'],
                ['1.2.10', '1.2.10'],
                ['15.10.22', '15.10.22'],
                ['1.0.0-alpha', '1.0.0.pre.alpha'],
                ['1.0.0-alpha1', '1.0.0.pre.alpha1'],
                ['2.0.0-rc1', '2.0.0.pre.rc1'],
            ];
            testTable.forEach(([input, expected]) => {
                (0, mocha_1.it)(`${input} combined with resolveRubyGemfileLockVersion should equal ${expected}`, () => {
                    const versionString = (0, common_1.stringifyRubyVersion)(version_1.Version.parse(input));
                    (0, chai_1.expect)((0, common_1.resolveRubyGemfileLockVersion)(versionString)).to.equal(expected);
                });
            });
        });
        (0, mocha_1.describe)('with dot prelease seperator', () => {
            const testTable = [
                ['0.2.0', '0.2.0'],
                ['1.2.3', '1.2.3'],
                ['1.2.10', '1.2.10'],
                ['15.10.22', '15.10.22'],
                ['1.0.0-alpha', '1.0.0.alpha'],
                ['1.0.0-alpha1', '1.0.0.alpha1'],
                ['2.0.0-beta', '2.0.0.beta'],
                ['2.0.0-rc1', '2.0.0.rc1'],
            ];
            testTable.forEach(([input, expected]) => {
                (0, mocha_1.it)(`${input} should equal ${expected}`, () => {
                    (0, chai_1.expect)((0, common_1.stringifyRubyVersion)(version_1.Version.parse(input), true)).to.equal(expected);
                });
                (0, mocha_1.it)(`${input} combined with resolveRubyGemfileLockVersion should equal ${expected}`, () => {
                    const versionString = (0, common_1.stringifyRubyVersion)(version_1.Version.parse(input), true);
                    (0, chai_1.expect)((0, common_1.resolveRubyGemfileLockVersion)(versionString)).to.equal(expected);
                });
            });
        });
    });
});
//# sourceMappingURL=common.js.map