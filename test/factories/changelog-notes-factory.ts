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
import {expect} from 'chai';
import {
  ChangelogNotesType,
  getChangelogTypes,
  GitHub,
  registerChangelogNotes,
} from '../../src';
import {
  buildChangelogNotes,
  unregisterChangelogNotes,
} from '../../src/factories/changelog-notes-factory';
import {DefaultChangelogNotes} from '../../src/changelog-notes/default';

describe('ChangelogNotesFactory', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'fake-owner',
      repo: 'fake-repo',
      defaultBranch: 'main',
      token: 'fake-token',
    });
  });
  describe('buildChangelogNotes', () => {
    const changelogTypes = ['default', 'github'];
    for (const changelogType of changelogTypes) {
      it(`should build a simple ${changelogType}`, () => {
        const changelogNotes = buildChangelogNotes({
          github,
          type: changelogType,
        });
        expect(changelogNotes).to.not.be.undefined;
      });
    }
    it('should throw for unknown type', () => {
      expect(() =>
        buildChangelogNotes({github, type: 'non-existent'})
      ).to.throw();
    });
  });
  describe('getChangelogTypes', () => {
    it('should return default types', () => {
      const defaultTypes: ChangelogNotesType[] = ['default', 'github'];

      const types = getChangelogTypes();
      defaultTypes.forEach(type => expect(types).to.contain(type));
    });
  });
  describe('registerChangelogNotes', () => {
    const changelogType = 'custom-test';

    class CustomTest extends DefaultChangelogNotes {}

    afterEach(() => {
      unregisterChangelogNotes(changelogType);
    });

    it('should register new releaser', async () => {
      registerChangelogNotes(changelogType, options => new CustomTest(options));

      const changelogNotesOptions = {
        type: changelogType,
        github,
        repositoryConfig: {},
        targetBranch: 'main',
      };
      const strategy = await buildChangelogNotes(changelogNotesOptions);
      expect(strategy).to.be.instanceof(CustomTest);
    });
    it('should return custom type', () => {
      registerChangelogNotes(changelogType, options => new CustomTest(options));

      const allTypes = getChangelogTypes();
      expect(allTypes).to.contain(changelogType);
    });
  });
});
