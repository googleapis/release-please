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
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {
  getVersioningStrategyTypes,
  registerVersioningStrategy,
  VersioningStrategyType,
  GitHub,
} from '../../src';
import {DefaultVersioningStrategy} from '../../src/versioning-strategies/default';
import {
  buildVersioningStrategy,
  unregisterVersioningStrategy,
} from '../../src/factories/versioning-strategy-factory';

describe('VersioningStrategyFactory', () => {
  const defaultTypes: VersioningStrategyType[] = [
    'default',
    'always-bump-patch',
    'service-pack',
  ];
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'test-owner',
      repo: 'test-repo',
      defaultBranch: 'main',
    });
  });

  describe('buildVersioningStrategy', () => {
    for (const type of defaultTypes) {
      it(`should build a simple ${type}`, () => {
        const versioningStrategy = buildVersioningStrategy({
          github,
          type: type,
        });
        expect(versioningStrategy).to.not.be.undefined;
      });
    }
    it('should throw for unknown type', () => {
      expect(() =>
        buildVersioningStrategy({
          github,
          type: 'non-existent',
        })
      ).to.throw();
    });
  });
  describe('getVersioningStrategyTypes', () => {
    it('should return default types', () => {
      const types = getVersioningStrategyTypes();
      defaultTypes.forEach(type => expect(types).to.contain(type));
    });
  });
  describe('registerVersioningStrategy', () => {
    const versioningStrategyType = 'custom-test';

    class CustomTest extends DefaultVersioningStrategy {}

    afterEach(() => {
      unregisterVersioningStrategy(versioningStrategyType);
    });

    it('should register new releaser', async () => {
      registerVersioningStrategy(
        versioningStrategyType,
        options => new CustomTest(options)
      );

      const versioningStrategyOptions = {
        github,
        type: versioningStrategyType,
      };
      const strategy = await buildVersioningStrategy(versioningStrategyOptions);
      expect(strategy).to.be.instanceof(CustomTest);
    });
    it('should return custom type', () => {
      registerVersioningStrategy(
        versioningStrategyType,
        options => new CustomTest(options)
      );

      const allTypes = getVersioningStrategyTypes();
      expect(allTypes).to.contain(versioningStrategyType);
    });
  });
});
