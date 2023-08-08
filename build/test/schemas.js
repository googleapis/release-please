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
const ajv_1 = require("ajv");
const ajv_formats_1 = require("ajv-formats");
const fs_1 = require("fs");
const path_1 = require("path");
const index_1 = require("../src/index");
const fixturesPath = './test/fixtures/manifest';
const ajv = new ajv_1.default();
(0, ajv_formats_1.default)(ajv);
(0, mocha_1.describe)('schemas', () => {
    (0, mocha_1.describe)('manifest file', () => {
        const manifestValidator = ajv.compile(index_1.manifestSchema);
        for (const manifestFile of (0, fs_1.readdirSync)((0, path_1.resolve)(fixturesPath, 'versions'))) {
            (0, mocha_1.it)(`validates ${manifestFile}`, () => {
                const manifest = require((0, path_1.resolve)(fixturesPath, 'versions', manifestFile));
                const result = manifestValidator(manifest);
                (0, chai_1.expect)(result).to.be.true;
                (0, chai_1.expect)(manifestValidator.errors).to.be.null;
            });
        }
    });
    (0, mocha_1.describe)('config file', () => {
        const configValidator = ajv.compile(index_1.configSchema);
        for (const manifestFile of (0, fs_1.readdirSync)((0, path_1.resolve)(fixturesPath, 'config'))) {
            (0, mocha_1.it)(`validates ${manifestFile}`, () => {
                const config = require((0, path_1.resolve)(fixturesPath, 'config', manifestFile));
                const result = configValidator(config);
                (0, chai_1.expect)(result).to.be.true;
                (0, chai_1.expect)(configValidator.errors).to.be.null;
            });
        }
        (0, mocha_1.it)('rejects extra properties', () => {
            const config = {
                extraField: 'foo',
                packages: {
                    '.': {},
                },
            };
            const result = configValidator(config);
            (0, chai_1.expect)(result).to.be.false;
            (0, chai_1.expect)(configValidator.errors).lengthOf(1);
            const error = configValidator.errors[0];
            (0, chai_1.expect)(error.message).to.eql('must NOT have additional properties');
            (0, chai_1.expect)(error.instancePath).to.eql('');
            (0, chai_1.expect)(error.params.additionalProperty).to.eql('extraField');
        });
    });
});
//# sourceMappingURL=schemas.js.map