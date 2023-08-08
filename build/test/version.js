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
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const version_1 = require("../src/version");
(0, mocha_1.describe)('Version', () => {
    (0, mocha_1.describe)('parse', () => {
        (0, mocha_1.it)('can read a plain semver', async () => {
            const input = '1.23.45';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).is.undefined;
            (0, chai_1.expect)(version.build).is.undefined;
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read a SNAPSHOT version', async () => {
            const input = '1.23.45-SNAPSHOT';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).to.equal('SNAPSHOT');
            (0, chai_1.expect)(version.build).is.undefined;
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read a beta version', async () => {
            const input = '1.23.45-beta';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).to.equal('beta');
            (0, chai_1.expect)(version.build).is.undefined;
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read a beta SNAPSHOT version', async () => {
            const input = '1.23.45-beta-SNAPSHOT';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).to.equal('beta-SNAPSHOT');
            (0, chai_1.expect)(version.build).is.undefined;
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read an lts version', async () => {
            const input = '1.23.45-sp.1';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).to.equal('sp.1');
            (0, chai_1.expect)(version.build).is.undefined;
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read an lts beta version', async () => {
            const input = '1.23.45-beta-sp.1';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).to.equal('beta-sp.1');
            (0, chai_1.expect)(version.build).is.undefined;
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read an lts snapshot version', async () => {
            const input = '1.23.45-sp.1-SNAPSHOT';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).to.equal('sp.1-SNAPSHOT');
            (0, chai_1.expect)(version.build).is.undefined;
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read an lts beta snapshot version', async () => {
            const input = '1.23.45-beta-sp.1-SNAPSHOT';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).to.equal('beta-sp.1-SNAPSHOT');
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read a plain semver with build', async () => {
            const input = '1.23.45+678';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).is.undefined;
            (0, chai_1.expect)(version.build).to.equal('678');
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read a plain semver with alphanumeric build', async () => {
            const input = '1.23.45+678abc';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).is.undefined;
            (0, chai_1.expect)(version.build).to.equal('678abc');
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
        (0, mocha_1.it)('can read a semver with pre-release and build', async () => {
            const input = '1.23.45-beta.123+678';
            const version = version_1.Version.parse(input);
            (0, chai_1.expect)(version.major).to.equal(1);
            (0, chai_1.expect)(version.minor).to.equal(23);
            (0, chai_1.expect)(version.patch).to.equal(45);
            (0, chai_1.expect)(version.preRelease).to.equal('beta.123');
            (0, chai_1.expect)(version.build).to.equal('678');
            (0, chai_1.expect)(version.toString()).to.equal(input);
        });
    });
    (0, mocha_1.describe)('compare', () => {
        (0, mocha_1.it)('should handle pre-release versions', () => {
            const comparison = version_1.Version.parse('1.2.3').compare(version_1.Version.parse('1.2.3-alpha'));
            (0, chai_1.expect)(comparison).to.eql(1);
        });
        (0, mocha_1.it)('should sort in ascending order using compare', () => {
            const input = [
                version_1.Version.parse('1.2.3'),
                version_1.Version.parse('1.2.3-alpha'),
                version_1.Version.parse('2.2.0'),
            ];
            const output = input.sort((a, b) => a.compare(b));
            (0, chai_1.expect)(output.map(version => version.toString())).to.eql([
                '1.2.3-alpha',
                '1.2.3',
                '2.2.0',
            ]);
        });
    });
});
//# sourceMappingURL=version.js.map