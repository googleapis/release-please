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

import {it} from "mocha";
import {RootComposerUpdatePackages} from "../../src/updaters/php/root-composer-update-packages";
import {Version, VersionsMap} from "../../src/version";
import {readFileSync} from "fs";
import {resolve} from "path";
import * as snapshot from "snap-shot-it";
import {expect} from "chai";

const fixturesPath = './test/updaters/fixtures/php';

describe('PHPComposer', () => {
    describe('updateContent', () => {
        it.only('update version in composer.json', async () => {
            const oldContent = readFileSync(
                resolve(fixturesPath, './composer.json'),
                'utf8'
            )

            const version = Version.parse('1.0.0');

            const versionsMap: VersionsMap = new Map();

            versionsMap.set('version', version);

            const newContent = new RootComposerUpdatePackages({version, versionsMap}).updateContent(oldContent);

            expect(newContent).to.contain('1.0.0');

            snapshot(newContent);
        });
    });
});
