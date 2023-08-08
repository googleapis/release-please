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
const factory_1 = require("../src/factory");
const github_1 = require("../src/github");
const chai_1 = require("chai");
const simple_1 = require("../src/strategies/simple");
const default_1 = require("../src/versioning-strategies/default");
const always_bump_patch_1 = require("../src/versioning-strategies/always-bump-patch");
const ruby_1 = require("../src/strategies/ruby");
const java_yoshi_1 = require("../src/strategies/java-yoshi");
const java_snapshot_1 = require("../src/versioning-strategies/java-snapshot");
const service_pack_1 = require("../src/versioning-strategies/service-pack");
const dependency_manifest_1 = require("../src/versioning-strategies/dependency-manifest");
const github_2 = require("../src/changelog-notes/github");
const default_2 = require("../src/changelog-notes/default");
const java_1 = require("../src/strategies/java");
(0, mocha_1.describe)('factory', () => {
    let github;
    (0, mocha_1.beforeEach)(async () => {
        github = await github_1.GitHub.create({
            owner: 'fake-owner',
            repo: 'fake-repo',
            defaultBranch: 'main',
            token: 'fake-token',
        });
    });
    (0, mocha_1.describe)('buildStrategy', () => {
        (0, mocha_1.it)('should build a basic strategy', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'simple',
            });
            (0, chai_1.expect)(strategy).instanceof(simple_1.Simple);
            (0, chai_1.expect)(strategy.versioningStrategy).instanceof(default_1.DefaultVersioningStrategy);
            const versioningStrategy = strategy.versioningStrategy;
            (0, chai_1.expect)(versioningStrategy.bumpMinorPreMajor).to.be.false;
            (0, chai_1.expect)(versioningStrategy.bumpPatchForMinorPreMajor).to.be.false;
            (0, chai_1.expect)(strategy.path).to.eql('.');
            (0, chai_1.expect)(await strategy.getComponent()).not.ok;
            (0, chai_1.expect)(strategy.changelogNotes).instanceof(default_2.DefaultChangelogNotes);
        });
        (0, mocha_1.it)('should build a with configuration', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'simple',
                bumpMinorPreMajor: true,
                bumpPatchForMinorPreMajor: true,
            });
            (0, chai_1.expect)(strategy).instanceof(simple_1.Simple);
            (0, chai_1.expect)(strategy.versioningStrategy).instanceof(default_1.DefaultVersioningStrategy);
            const versioningStrategy = strategy.versioningStrategy;
            (0, chai_1.expect)(versioningStrategy.bumpMinorPreMajor).to.be.true;
            (0, chai_1.expect)(versioningStrategy.bumpPatchForMinorPreMajor).to.be.true;
        });
        (0, mocha_1.it)('should throw for unknown type', async () => {
            try {
                await (0, factory_1.buildStrategy)({
                    github,
                    releaseType: 'non-existent',
                });
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceof(Error);
                return;
            }
            chai_1.expect.fail();
        });
        (0, mocha_1.it)('should build with a configured versioning strategy', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'simple',
                versioning: 'always-bump-patch',
            });
            (0, chai_1.expect)(strategy).instanceof(simple_1.Simple);
            (0, chai_1.expect)(strategy.versioningStrategy).instanceof(always_bump_patch_1.AlwaysBumpPatch);
        });
        (0, mocha_1.it)('should build with a service pack versioning strategy', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'simple',
                versioning: 'service-pack',
            });
            (0, chai_1.expect)(strategy).instanceof(simple_1.Simple);
            (0, chai_1.expect)(strategy.versioningStrategy).instanceof(service_pack_1.ServicePackVersioningStrategy);
        });
        (0, mocha_1.it)('should build with a configured changelog type', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'simple',
                changelogType: 'github',
            });
            (0, chai_1.expect)(strategy).instanceof(simple_1.Simple);
            (0, chai_1.expect)(strategy.changelogNotes).instanceof(github_2.GitHubChangelogNotes);
        });
        (0, mocha_1.it)('should build a ruby strategy', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'ruby',
                versionFile: 'src/version.rb',
            });
            (0, chai_1.expect)(strategy).instanceof(ruby_1.Ruby);
            (0, chai_1.expect)(strategy.versionFile).to.eql('src/version.rb');
        });
        (0, mocha_1.it)('should build a java-yoshi strategy', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'java-yoshi',
                bumpMinorPreMajor: true,
                bumpPatchForMinorPreMajor: true,
                extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
            });
            (0, chai_1.expect)(strategy).instanceof(java_yoshi_1.JavaYoshi);
            (0, chai_1.expect)(strategy.extraFiles).to.eql([
                'path1/foo1.java',
                'path2/foo2.java',
            ]);
            (0, chai_1.expect)(strategy.versioningStrategy).instanceof(java_snapshot_1.JavaSnapshot);
            const versioningStrategy = strategy.versioningStrategy;
            (0, chai_1.expect)(versioningStrategy.strategy).instanceof(default_1.DefaultVersioningStrategy);
            const innerVersioningStrategy = versioningStrategy.strategy;
            (0, chai_1.expect)(innerVersioningStrategy.bumpMinorPreMajor).to.be.true;
            (0, chai_1.expect)(innerVersioningStrategy.bumpPatchForMinorPreMajor).to.be.true;
        });
        (0, mocha_1.it)('should build a java-backport strategy', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'java-backport',
                extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
            });
            (0, chai_1.expect)(strategy).instanceof(java_yoshi_1.JavaYoshi);
            (0, chai_1.expect)(strategy.extraFiles).to.eql([
                'path1/foo1.java',
                'path2/foo2.java',
            ]);
            (0, chai_1.expect)(strategy.versioningStrategy).instanceof(java_snapshot_1.JavaSnapshot);
            const versioningStrategy = strategy.versioningStrategy;
            (0, chai_1.expect)(versioningStrategy.strategy).instanceof(always_bump_patch_1.AlwaysBumpPatch);
        });
        (0, mocha_1.it)('should build a java-lts strategy', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'java-lts',
                extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
            });
            (0, chai_1.expect)(strategy).instanceof(java_yoshi_1.JavaYoshi);
            (0, chai_1.expect)(strategy.extraFiles).to.eql([
                'path1/foo1.java',
                'path2/foo2.java',
            ]);
            (0, chai_1.expect)(strategy.versioningStrategy).instanceof(java_snapshot_1.JavaSnapshot);
            const versioningStrategy = strategy.versioningStrategy;
            (0, chai_1.expect)(versioningStrategy.strategy).instanceof(service_pack_1.ServicePackVersioningStrategy);
        });
        (0, mocha_1.it)('should build a java-bom strategy', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'java-bom',
                bumpMinorPreMajor: true,
                bumpPatchForMinorPreMajor: true,
                extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
            });
            (0, chai_1.expect)(strategy).instanceof(java_yoshi_1.JavaYoshi);
            (0, chai_1.expect)(strategy.extraFiles).to.eql([
                'path1/foo1.java',
                'path2/foo2.java',
            ]);
            (0, chai_1.expect)(strategy.versioningStrategy).instanceof(java_snapshot_1.JavaSnapshot);
            const versioningStrategy = strategy.versioningStrategy;
            (0, chai_1.expect)(versioningStrategy.strategy).instanceof(dependency_manifest_1.DependencyManifest);
            const innerVersioningStrategy = versioningStrategy.strategy;
            (0, chai_1.expect)(innerVersioningStrategy.bumpMinorPreMajor).to.be.true;
            (0, chai_1.expect)(innerVersioningStrategy.bumpPatchForMinorPreMajor).to.be.true;
        });
        (0, mocha_1.it)('should handle skipping snapshots', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'java',
                bumpMinorPreMajor: true,
                bumpPatchForMinorPreMajor: true,
                extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
                skipSnapshot: true,
            });
            (0, chai_1.expect)(strategy).instanceof(java_1.Java);
            const javaStrategy = strategy;
            (0, chai_1.expect)(javaStrategy.extraFiles).to.eql([
                'path1/foo1.java',
                'path2/foo2.java',
            ]);
            (0, chai_1.expect)(javaStrategy.skipSnapshot).to.be.true;
        });
        (0, mocha_1.it)('should handle extra-files', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'simple',
                extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
            });
            (0, chai_1.expect)(strategy).instanceof(simple_1.Simple);
            (0, chai_1.expect)(strategy.extraFiles).to.eql([
                'path1/foo1.java',
                'path2/foo2.java',
            ]);
        });
        for (const releaseType of (0, factory_1.getReleaserTypes)()) {
            (0, mocha_1.it)(`should build a default ${releaseType}`, async () => {
                const strategy = await (0, factory_1.buildStrategy)({ github, releaseType });
                (0, chai_1.expect)(strategy).to.not.be.undefined;
            });
        }
        (0, mocha_1.it)('should customize a version-file for Simple', async () => {
            const strategy = await (0, factory_1.buildStrategy)({
                github,
                releaseType: 'simple',
                versionFile: 'foo/bar',
            });
            (0, chai_1.expect)(strategy).instanceof(simple_1.Simple);
            (0, chai_1.expect)(strategy.versionFile).to.eql('foo/bar');
        });
    });
    (0, mocha_1.describe)('registerReleaseType', () => {
        const releaseType = 'custom-test';
        class CustomTest extends simple_1.Simple {
        }
        afterEach(() => {
            (0, factory_1.unregisterReleaseType)(releaseType);
        });
        (0, mocha_1.it)('should register new releaser', async () => {
            (0, factory_1.registerReleaseType)(releaseType, options => new CustomTest(options));
            const strategy = await (0, factory_1.buildStrategy)({ github, releaseType: releaseType });
            (0, chai_1.expect)(strategy).to.be.instanceof(CustomTest);
        });
        (0, mocha_1.it)('should return custom types', () => {
            (0, factory_1.registerReleaseType)(releaseType, options => new simple_1.Simple(options));
            const allTypes = (0, factory_1.getReleaserTypes)();
            (0, chai_1.expect)(allTypes).to.contain(releaseType);
        });
    });
});
//# sourceMappingURL=factory.js.map