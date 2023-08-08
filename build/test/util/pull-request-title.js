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
const pull_request_title_1 = require("../../src/util/pull-request-title");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const version_1 = require("../../src/version");
const manifest_1 = require("../../src/manifest");
(0, mocha_1.describe)('PullRequestTitle', () => {
    (0, mocha_1.describe)('parse', () => {
        (0, mocha_1.describe)('autorelease branch name', () => {
            (0, mocha_1.it)('parses a versioned branch name', () => {
                var _a;
                const name = 'chore: release 1.2.3';
                const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name);
                (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.be.undefined;
                (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.toString()).to.eql(name);
            });
            (0, mocha_1.it)('parses a versioned branch name with v', () => {
                var _a;
                const name = 'chore: release v1.2.3';
                const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name);
                (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.be.undefined;
                (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
            });
            (0, mocha_1.it)('parses a versioned branch name with component', () => {
                var _a;
                const name = 'chore: release storage v1.2.3';
                const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name);
                (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.eql('storage');
                (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
            });
        });
        (0, mocha_1.it)('parses a target branch', () => {
            var _a;
            const name = 'chore(main): release v1.2.3';
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name);
            (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.eql('main');
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.be.undefined;
            (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
        });
        (0, mocha_1.it)('parses a target branch and component', () => {
            var _a;
            const name = 'chore(main): release storage v1.2.3';
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name);
            (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.eql('main');
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.eql('storage');
            (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
        });
        (0, mocha_1.it)('parses a target branch and component with a slash', () => {
            var _a;
            const name = 'chore(main): release some/title-test 0.0.1';
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name);
            (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.eql('main');
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.eql('some/title-test');
            (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('0.0.1');
        });
        (0, mocha_1.it)('fails to parse', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse('release-foo');
            (0, chai_1.expect)(pullRequestTitle).to.be.undefined;
        });
    });
    (0, mocha_1.describe)('ofVersion', () => {
        (0, mocha_1.it)('builds the autorelease versioned branch name', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofVersion(version_1.Version.parse('1.2.3'));
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore: release 1.2.3');
        });
    });
    (0, mocha_1.describe)('ofComponentVersion', () => {
        (0, mocha_1.it)('builds the autorelease versioned branch name with component', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofComponentVersion('storage', version_1.Version.parse('1.2.3'));
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore: release storage 1.2.3');
        });
    });
    (0, mocha_1.describe)('ofTargetBranch', () => {
        (0, mocha_1.it)('builds branchname with only target branch', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofTargetBranch('main');
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore(main): release');
        });
    });
    (0, mocha_1.describe)('ofTargetBranchVersion', () => {
        (0, mocha_1.it)('builds branchname with target branch and version', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofTargetBranchVersion('main', version_1.Version.parse('1.2.3'));
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore(main): release 1.2.3');
        });
    });
    (0, mocha_1.describe)('ofComponentTargetBranch', () => {
        (0, mocha_1.it)('builds branchname with target branch and component', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofComponentTargetBranchVersion('foo', 'main', version_1.Version.parse('1.2.3'));
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore(main): release foo 1.2.3');
        });
    });
    (0, mocha_1.describe)('generateMatchPattern', () => {
        (0, mocha_1.it)('return matchPattern with default Pattern', () => {
            const matchPattern = (0, pull_request_title_1.generateMatchPattern)();
            (0, chai_1.expect)(matchPattern).to.eql(/^chore(\((?<branch>[\w-./]+)\))?: release ?(?<component>@?[\w-./]*)? v?(?<version>[0-9].*)$/);
        });
    });
});
(0, mocha_1.describe)('PullRequestTitle with custom pullRequestTitlePattern', () => {
    (0, mocha_1.describe)('parse', () => {
        (0, mocha_1.describe)('autorelease branch name', () => {
            (0, mocha_1.it)('parses a versioned branch name', () => {
                var _a;
                const name = 'chore: 🔖 release 1.2.3';
                const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name, 'chore${scope}: 🔖 release${component} ${version}');
                (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.be.undefined;
                (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.toString()).to.eql(name);
            });
            (0, mocha_1.it)('parses a versioned branch name with v', () => {
                var _a;
                const name = 'chore: 🔖 release v1.2.3';
                const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name, 'chore${scope}: 🔖 release${component} ${version}');
                (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.be.undefined;
                (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
            });
            (0, mocha_1.it)('parses a versioned branch name with component', () => {
                var _a;
                const name = 'chore: 🔖 release storage v1.2.3';
                const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name, 'chore${scope}: 🔖 release${component} ${version}');
                (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.be.undefined;
                (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.eql('storage');
                (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
            });
        });
        (0, mocha_1.it)('parses a target branch', () => {
            var _a;
            const name = 'chore(main): 🔖 release v1.2.3';
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name, 'chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.eql('main');
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.be.undefined;
            (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
        });
        (0, mocha_1.it)('parses a target branch and component', () => {
            var _a;
            const name = 'chore(main): 🔖 release storage v1.2.3';
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name, 'chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.eql('main');
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.eql('storage');
            (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('1.2.3');
        });
        (0, mocha_1.it)('parses a component with @ sign prefix', () => {
            const name = 'chore(main): 🔖 release @example/storage v1.2.3';
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name, 'chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.eql('@example/storage');
        });
        (0, mocha_1.it)('fails to parse', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse('release-foo', 'chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(pullRequestTitle).to.be.undefined;
        });
        (0, mocha_1.it)('parses a manifest title', () => {
            const name = 'chore: release main';
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse(name, manifest_1.MANIFEST_PULL_REQUEST_TITLE_PATTERN);
            (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.eql('main');
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()).to.be.undefined;
        });
        (0, mocha_1.it)('parses a complex title and pattern', () => {
            var _a;
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.parse('[HOTFIX] - chore(hotfix/v3.1.0-bug): release 3.1.0-hotfix1 (@example/storage)', '[HOTFIX] - chore${scope}: release ${version} (${component})');
            (0, chai_1.expect)(pullRequestTitle).to.not.be.undefined;
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getTargetBranch()).to.eql('hotfix/v3.1.0-bug');
            (0, chai_1.expect)((_a = pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getVersion()) === null || _a === void 0 ? void 0 : _a.toString()).to.eql('3.1.0-hotfix1');
            (0, chai_1.expect)(pullRequestTitle === null || pullRequestTitle === void 0 ? void 0 : pullRequestTitle.getComponent()).to.eql('@example/storage');
        });
    });
    (0, mocha_1.describe)('ofVersion', () => {
        (0, mocha_1.it)('builds the autorelease versioned branch name', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofVersion(version_1.Version.parse('1.2.3'), 'chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore: 🔖 release 1.2.3');
        });
    });
    (0, mocha_1.describe)('ofComponentVersion', () => {
        (0, mocha_1.it)('builds the autorelease versioned branch name with component', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofComponentVersion('storage', version_1.Version.parse('1.2.3'), 'chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore: 🔖 release storage 1.2.3');
        });
    });
    (0, mocha_1.describe)('ofTargetBranch', () => {
        (0, mocha_1.it)('builds branchname with only target branch', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofTargetBranchVersion('main', version_1.Version.parse('1.2.3'), 'chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore(main): 🔖 release 1.2.3');
        });
    });
    (0, mocha_1.describe)('ofComponentTargetBranch', () => {
        (0, mocha_1.it)('builds branchname with target branch and component', () => {
            const pullRequestTitle = pull_request_title_1.PullRequestTitle.ofComponentTargetBranchVersion('foo', 'main', version_1.Version.parse('1.2.3'), 'chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(pullRequestTitle.toString()).to.eql('chore(main): 🔖 release foo 1.2.3');
        });
    });
    (0, mocha_1.describe)('generateMatchPattern', () => {
        (0, mocha_1.it)('return matchPattern with custom Pattern', () => {
            const matchPattern = (0, pull_request_title_1.generateMatchPattern)('chore${scope}: 🔖 release${component} ${version}');
            (0, chai_1.expect)(matchPattern).to.eql(/^chore(\((?<branch>[\w-./]+)\))?: 🔖 release ?(?<component>@?[\w-./]*)? v?(?<version>[0-9].*)$/);
        });
        // it('throw Error with custom Pattern missing ${scope}', () => {
        //   expect(() =>
        //     generateMatchPattern('chore: 🔖 release${component} ${version}')
        //   ).to.throw("pullRequestTitlePattern miss the part of '${scope}'");
        // });
        // it('throw Error with custom Pattern missing ${component}', () => {
        //   expect(() =>
        //     generateMatchPattern('chore${scope}: 🔖 release ${version}')
        //   ).to.throw("pullRequestTitlePattern miss the part of '${component}'");
        // });
        // it('throw Error with custom Pattern missing ${version}', () => {
        //   expect(() =>
        //     generateMatchPattern('chore${scope}: 🔖 release${component}')
        //   ).to.throw("pullRequestTitlePattern miss the part of '${version}'");
        // });
    });
});
//# sourceMappingURL=pull-request-title.js.map