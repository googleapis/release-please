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
const tag_name_1 = require("../../src/util/tag-name");
(0, mocha_1.describe)('TagName', () => {
    (0, mocha_1.describe)('parse', () => {
        (0, mocha_1.describe)('with component', () => {
            (0, mocha_1.it)('handles a default separator', () => {
                const name = 'some-component-v1.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.eql('some-component');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('-');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('handles a / separator', () => {
                const name = 'some-component/v1.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.eql('some-component');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('/');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('handles tag without a v', () => {
                const name = 'some-component-1.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.eql('some-component');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('-');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('handles tag without a v with a / separator', () => {
                const name = 'some-component/1.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.eql('some-component');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('/');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
        });
        (0, mocha_1.describe)('without component', () => {
            (0, mocha_1.it)('handles a version', () => {
                const name = 'v1.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('-');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('handles a version without a v', () => {
                const name = '1.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('1.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('-');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('handles a dual digit version without v', () => {
                const name = '10.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('10.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('-');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('handles a dual digit version', () => {
                const name = 'v10.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('10.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('-');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('handles a triple digit version without v', () => {
                const name = '178.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('178.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('-');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
            (0, mocha_1.it)('handles a triple digit version', () => {
                const name = 'v178.2.3';
                const tagName = tag_name_1.TagName.parse(name);
                (0, chai_1.expect)(tagName).to.not.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.component).to.be.undefined;
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.version.toString()).to.eql('178.2.3');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.separator).to.eql('-');
                (0, chai_1.expect)(tagName === null || tagName === void 0 ? void 0 : tagName.toString()).to.eql(name);
            });
        });
    });
});
//# sourceMappingURL=tag-name.js.map