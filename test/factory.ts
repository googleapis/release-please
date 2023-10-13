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

import {beforeEach, describe, it} from 'mocha';
import {
  buildStrategy,
  getReleaserTypes,
  registerReleaseType,
  unregisterReleaseType,
} from '../src/factory';
import {GitHub} from '../src/github';
import {expect} from 'chai';
import {Simple} from '../src/strategies/simple';
import {DefaultVersioningStrategy} from '../src/versioning-strategies/default';
import {AlwaysBumpPatch} from '../src/versioning-strategies/always-bump-patch';
import {Ruby} from '../src/strategies/ruby';
import {JavaYoshi} from '../src/strategies/java-yoshi';
import {JavaSnapshot} from '../src/versioning-strategies/java-snapshot';
import {ServicePackVersioningStrategy} from '../src/versioning-strategies/service-pack';
import {DependencyManifest} from '../src/versioning-strategies/dependency-manifest';
import {GitHubChangelogNotes} from '../src/changelog-notes/github';
import {DefaultChangelogNotes} from '../src/changelog-notes/default';
import {Java} from '../src/strategies/java';
import {PrereleaseVersioningStrategy} from '../src/versioning-strategies/prerelease';

describe('factory', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'fake-owner',
      repo: 'fake-repo',
      defaultBranch: 'main',
      token: 'fake-token',
    });
  });
  describe('buildStrategy', () => {
    it('should build a basic strategy', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'simple',
      });
      expect(strategy).instanceof(Simple);

      expect(strategy.versioningStrategy).instanceof(DefaultVersioningStrategy);
      const versioningStrategy =
        strategy.versioningStrategy as DefaultVersioningStrategy;
      expect(versioningStrategy.bumpMinorPreMajor).to.be.false;
      expect(versioningStrategy.bumpPatchForMinorPreMajor).to.be.false;
      expect(strategy.path).to.eql('.');
      expect(await strategy.getComponent()).not.ok;
      expect(strategy.changelogNotes).instanceof(DefaultChangelogNotes);
    });
    it('should build a with configuration', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
      });
      expect(strategy).instanceof(Simple);
      expect(strategy.versioningStrategy).instanceof(DefaultVersioningStrategy);
      const versioningStrategy =
        strategy.versioningStrategy as DefaultVersioningStrategy;
      expect(versioningStrategy.bumpMinorPreMajor).to.be.true;
      expect(versioningStrategy.bumpPatchForMinorPreMajor).to.be.true;
    });
    it('should build with prerelease type', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'simple',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        versioning: 'prerelease',
        prereleaseType: 'alpha',
      });
      expect(strategy).instanceof(Simple);
      expect(strategy.versioningStrategy).instanceof(
        PrereleaseVersioningStrategy
      );
      const versioningStrategy =
        strategy.versioningStrategy as PrereleaseVersioningStrategy;
      expect(versioningStrategy.bumpMinorPreMajor).to.be.true;
      expect(versioningStrategy.bumpPatchForMinorPreMajor).to.be.true;
      expect(versioningStrategy.prereleaseType).to.eql('alpha');
    });
    it('should throw for unknown type', async () => {
      try {
        await buildStrategy({
          github,
          releaseType: 'non-existent',
        });
      } catch (err) {
        expect(err).to.be.instanceof(Error);
        return;
      }
      expect.fail();
    });
    it('should build with a configured versioning strategy', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'simple',
        versioning: 'always-bump-patch',
      });
      expect(strategy).instanceof(Simple);
      expect(strategy.versioningStrategy).instanceof(AlwaysBumpPatch);
    });
    it('should build with a service pack versioning strategy', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'simple',
        versioning: 'service-pack',
      });
      expect(strategy).instanceof(Simple);
      expect(strategy.versioningStrategy).instanceof(
        ServicePackVersioningStrategy
      );
    });
    it('should build with a configured changelog type', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'simple',
        changelogType: 'github',
      });
      expect(strategy).instanceof(Simple);
      expect(strategy.changelogNotes).instanceof(GitHubChangelogNotes);
    });
    it('should build a ruby strategy', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'ruby',
        versionFile: 'src/version.rb',
      });
      expect(strategy).instanceof(Ruby);
      expect((strategy as Ruby).versionFile).to.eql('src/version.rb');
    });
    it('should build a java-yoshi strategy', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'java-yoshi',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
      });
      expect(strategy).instanceof(JavaYoshi);
      expect((strategy as JavaYoshi).extraFiles).to.eql([
        'path1/foo1.java',
        'path2/foo2.java',
      ]);
      expect(strategy.versioningStrategy).instanceof(JavaSnapshot);
      const versioningStrategy = strategy.versioningStrategy as JavaSnapshot;
      expect(versioningStrategy.strategy).instanceof(DefaultVersioningStrategy);
      const innerVersioningStrategy =
        versioningStrategy.strategy as DefaultVersioningStrategy;
      expect(innerVersioningStrategy.bumpMinorPreMajor).to.be.true;
      expect(innerVersioningStrategy.bumpPatchForMinorPreMajor).to.be.true;
    });
    it('should build a java-backport strategy', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'java-backport',
        extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
      });
      expect(strategy).instanceof(JavaYoshi);
      expect((strategy as JavaYoshi).extraFiles).to.eql([
        'path1/foo1.java',
        'path2/foo2.java',
      ]);
      expect(strategy.versioningStrategy).instanceof(JavaSnapshot);
      const versioningStrategy = strategy.versioningStrategy as JavaSnapshot;
      expect(versioningStrategy.strategy).instanceof(AlwaysBumpPatch);
    });
    it('should build a java-lts strategy', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'java-lts',
        extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
      });
      expect(strategy).instanceof(JavaYoshi);
      expect((strategy as JavaYoshi).extraFiles).to.eql([
        'path1/foo1.java',
        'path2/foo2.java',
      ]);
      expect(strategy.versioningStrategy).instanceof(JavaSnapshot);
      const versioningStrategy = strategy.versioningStrategy as JavaSnapshot;
      expect(versioningStrategy.strategy).instanceof(
        ServicePackVersioningStrategy
      );
    });
    it('should build a java-bom strategy', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'java-bom',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
      });
      expect(strategy).instanceof(JavaYoshi);
      expect((strategy as JavaYoshi).extraFiles).to.eql([
        'path1/foo1.java',
        'path2/foo2.java',
      ]);
      expect(strategy.versioningStrategy).instanceof(JavaSnapshot);
      const versioningStrategy = strategy.versioningStrategy as JavaSnapshot;
      expect(versioningStrategy.strategy).instanceof(DependencyManifest);
      const innerVersioningStrategy =
        versioningStrategy.strategy as DependencyManifest;
      expect(innerVersioningStrategy.bumpMinorPreMajor).to.be.true;
      expect(innerVersioningStrategy.bumpPatchForMinorPreMajor).to.be.true;
    });
    it('should handle skipping snapshots', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'java',
        bumpMinorPreMajor: true,
        bumpPatchForMinorPreMajor: true,
        extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
        skipSnapshot: true,
      });
      expect(strategy).instanceof(Java);
      const javaStrategy = strategy as Java;
      expect(javaStrategy.extraFiles).to.eql([
        'path1/foo1.java',
        'path2/foo2.java',
      ]);
      expect(javaStrategy.skipSnapshot).to.be.true;
    });
    it('should handle extra-files', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'simple',
        extraFiles: ['path1/foo1.java', 'path2/foo2.java'],
      });
      expect(strategy).instanceof(Simple);
      expect((strategy as Simple).extraFiles).to.eql([
        'path1/foo1.java',
        'path2/foo2.java',
      ]);
    });
    for (const releaseType of getReleaserTypes()) {
      it(`should build a default ${releaseType}`, async () => {
        const strategy = await buildStrategy({github, releaseType});
        expect(strategy).to.not.be.undefined;
      });
    }
    it('should customize a version-file for Simple', async () => {
      const strategy = await buildStrategy({
        github,
        releaseType: 'simple',
        versionFile: 'foo/bar',
      });
      expect(strategy).instanceof(Simple);
      expect((strategy as Simple).versionFile).to.eql('foo/bar');
    });
  });
  describe('registerReleaseType', () => {
    const releaseType = 'custom-test';

    class CustomTest extends Simple {}

    afterEach(() => {
      unregisterReleaseType(releaseType);
    });

    it('should register new releaser', async () => {
      registerReleaseType(releaseType, options => new CustomTest(options));

      const strategy = await buildStrategy({github, releaseType: releaseType});
      expect(strategy).to.be.instanceof(CustomTest);
    });
    it('should return custom types', () => {
      registerReleaseType(releaseType, options => new Simple(options));

      const allTypes = getReleaserTypes();
      expect(allTypes).to.contain(releaseType);
    });
  });
});
