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
const branch_name_1 = require("../../src/util/branch-name");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const version_1 = require("../../src/version");
(0, mocha_1.describe)('BranchName', () => {
    (0, mocha_1.describe)('parse', () => {
        (0, mocha_1.describe)('autorelease branch name', () => {
            (0, mocha_1.it)('parses a versioned branch name', () => {
                var _a;
                const name = 'release-v1.2.3';
                const branchName = branch_name_1.BranchName.parse(name);
                (0, chai_1.expect)(branchName).to.not.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.be.undefined;
                (0, chai_1.expect)((_a = branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('parses a versioned branch name with component', () => {
                var _a;
                const name = 'release-storage-v1.2.3';
                const branchName = branch_name_1.BranchName.parse(name);
                (0, chai_1.expect)(branchName).to.not.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.eql('storage');
                (0, chai_1.expect)((_a = branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('should not crash on parsing', () => {
                const name = 'release-storage-v1';
                const branchName = branch_name_1.BranchName.parse(name);
                (0, chai_1.expect)(branchName).to.be.undefined;
            });
        });
        (0, mocha_1.describe)('v12 format', () => {
            (0, mocha_1.it)('parses a target branch', () => {
                const name = 'release-please/branches/main';
                const branchName = branch_name_1.BranchName.parse(name);
                (0, chai_1.expect)(branchName).to.not.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.eql('main');
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()).to.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('parses a target branch and component', () => {
                const name = 'release-please/branches/main/components/storage';
                const branchName = branch_name_1.BranchName.parse(name);
                (0, chai_1.expect)(branchName).to.not.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.eql('main');
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.eql('storage');
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()).to.be.undefined;
                (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
            });
        });
        (0, mocha_1.it)('parses a target branch', () => {
            const name = 'release-please--branches--main';
            const branchName = branch_name_1.BranchName.parse(name);
            (0, chai_1.expect)(branchName).to.not.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.eql('main');
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
        });
        (0, mocha_1.it)('parses a target branch that starts with a v', () => {
            const name = 'release-please--branches--v3.3.x';
            const branchName = branch_name_1.BranchName.parse(name);
            (0, chai_1.expect)(branchName).to.not.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.eql('v3.3.x');
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
        });
        (0, mocha_1.it)('parses a target branch named with a valid semver', () => {
            const name = 'release-please--branches--v3.3.9';
            const branchName = branch_name_1.BranchName.parse(name);
            (0, chai_1.expect)(branchName).to.not.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.eql('v3.3.9');
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
        });
        (0, mocha_1.it)('parses a target branch and component', () => {
            const name = 'release-please--branches--main--components--storage';
            const branchName = branch_name_1.BranchName.parse(name);
            (0, chai_1.expect)(branchName).to.not.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.eql('main');
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.eql('storage');
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
        });
        (0, mocha_1.it)('parses a target branch that has a /', () => {
            const name = 'release-please--branches--hotfix/3.3.x';
            const branchName = branch_name_1.BranchName.parse(name);
            (0, chai_1.expect)(branchName).to.not.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getTargetBranch()).to.eql('hotfix/3.3.x');
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getComponent()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.getVersion()).to.be.undefined;
            (0, chai_1.expect)(branchName === null || branchName === void 0 ? void 0 : branchName.toString()).to.eql(name);
        });
        (0, mocha_1.it)('fails to parse', () => {
            const branchName = branch_name_1.BranchName.parse('release-foo');
            (0, chai_1.expect)(branchName).to.be.undefined;
        });
    });
    (0, mocha_1.describe)('ofVersion', () => {
        (0, mocha_1.it)('builds the autorelease versioned branch name', () => {
            const branchName = branch_name_1.BranchName.ofVersion(version_1.Version.parse('1.2.3'));
            (0, chai_1.expect)(branchName.toString()).to.eql('release-v1.2.3');
        });
    });
    (0, mocha_1.describe)('ofComponentVersion', () => {
        (0, mocha_1.it)('builds the autorelease versioned branch name with component', () => {
            const branchName = branch_name_1.BranchName.ofComponentVersion('storage', version_1.Version.parse('1.2.3'));
            (0, chai_1.expect)(branchName.toString()).to.eql('release-storage-v1.2.3');
        });
    });
    (0, mocha_1.describe)('ofTargetBranch', () => {
        (0, mocha_1.it)('builds branchname with only target branch', () => {
            const branchName = branch_name_1.BranchName.ofTargetBranch('main');
            (0, chai_1.expect)(branchName.toString()).to.eql('release-please--branches--main');
        });
    });
    (0, mocha_1.describe)('ofComponentTargetBranch', () => {
        (0, mocha_1.it)('builds branchname with target branch and component', () => {
            const branchName = branch_name_1.BranchName.ofComponentTargetBranch('foo', 'main');
            (0, chai_1.expect)(branchName.toString()).to.eql('release-please--branches--main--components--foo');
        });
    });
});
//# sourceMappingURL=branch-name.js.map