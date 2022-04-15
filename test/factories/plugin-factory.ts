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

import {beforeEach, describe, it} from 'mocha';
import {PluginType, RepositoryConfig} from '../../src/manifest';
import {
  buildPlugin,
  getPluginTypes,
  registerPlugin,
  unregisterPlugin,
} from '../../src/factories/plugin-factory';
import {expect} from 'chai';
import {LinkedVersions} from '../../src/plugins/linked-versions';
import {ManifestPlugin} from '../../src/plugin';
import {GitHub} from '../../src';

describe('PluginFactory', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'fake-owner',
      repo: 'fake-repo',
      defaultBranch: 'main',
      token: 'fake-token',
    });
  });
  describe('buildPlugin', () => {
    const simplePluginTypes: PluginType[] = [
      'cargo-workspace',
      'node-workspace',
    ];
    const repositoryConfig: RepositoryConfig = {
      '.': {releaseType: 'simple'},
    };
    for (const pluginType of simplePluginTypes) {
      it(`should build a simple ${pluginType}`, () => {
        const plugin = buildPlugin({
          github,
          type: pluginType,
          targetBranch: 'target-branch',
          repositoryConfig,
        });
        expect(plugin).to.not.be.undefined;
      });
    }
    it('should throw for unknown type', () => {
      expect(() =>
        buildPlugin({
          github,
          type: 'non-existent',
          targetBranch: 'target-branch',
          repositoryConfig,
        })
      ).to.throw();
    });
    it('should build a linked-versions config', () => {
      const plugin = buildPlugin({
        github,
        type: {
          type: 'linked-versions',
          groupName: 'group-name',
          components: ['pkg1', 'pkg2'],
        },
        targetBranch: 'target-branch',
        repositoryConfig,
      });
      expect(plugin).to.not.be.undefined;
      expect(plugin).instanceof(LinkedVersions);
    });
  });
  describe('getPluginTypes', () => {
    it('should return default types', () => {
      const defaultTypes: PluginType[] = [
        'cargo-workspace',
        'node-workspace',
        'linked-versions',
      ];

      const types = getPluginTypes();
      defaultTypes.forEach(type => expect(types).to.contain(type));
    });
  });
  describe('registerPlugin', () => {
    const pluginType = 'custom-test';

    class CustomTest extends ManifestPlugin {}

    afterEach(() => {
      unregisterPlugin(pluginType);
    });

    it('should register new releaser', async () => {
      registerPlugin(
        pluginType,
        options =>
          new CustomTest(
            options.github,
            options.targetBranch,
            options.repositoryConfig
          )
      );

      const pluginOptions = {
        type: pluginType,
        github,
        repositoryConfig: {},
        targetBranch: 'main',
      };
      const strategy = await buildPlugin(pluginOptions);
      expect(strategy).to.be.instanceof(CustomTest);
    });
    it('should return custom type', () => {
      registerPlugin(
        pluginType,
        options =>
          new CustomTest(
            options.github,
            options.targetBranch,
            options.repositoryConfig
          )
      );

      const allTypes = getPluginTypes();
      expect(allTypes).to.contain(pluginType);
    });
  });
});
