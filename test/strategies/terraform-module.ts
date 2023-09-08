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

import {describe, it, afterEach, beforeEach} from 'mocha';
import {expect} from 'chai';
import {GitHub} from '../../src/github';
import {TerraformModule} from '../../src/strategies/terraform-module';
import * as sinon from 'sinon';
import {assertHasUpdate, buildMockConventionalCommit} from '../helpers';
import {TagName} from '../../src/util/tag-name';
import {Version} from '../../src/version';
import {Changelog} from '../../src/updaters/changelog';
import {ReadMe} from '../../src/updaters/terraform/readme';
import {ModuleVersion} from '../../src/updaters/terraform/module-version';
import {MetadataVersion} from '../../src/updaters/terraform/metadata-version';

const sandbox = sinon.createSandbox();

const COMMITS = [
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-storage to v1.120.0'
  ),
  ...buildMockConventionalCommit(
    'fix(deps): update dependency com.google.cloud:google-cloud-spanner to v1.50.0'
  ),
  ...buildMockConventionalCommit('chore: update common templates'),
];

describe('TerraformModule', () => {
  let github: GitHub;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'terraform-module-test-repo',
      defaultBranch: 'main',
    });
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('buildReleasePullRequest', () => {
    it('returns release PR changes with defaultInitialVersion', async () => {
      const expectedVersion = '0.0.1';
      const strategy = new TerraformModule({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
    it('returns release PR changes with semver patch bump', async () => {
      const expectedVersion = '0.123.5';
      const strategy = new TerraformModule({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = {
        tag: new TagName(Version.parse('0.123.4'), 'google-cloud-automl'),
        sha: 'abc123',
        notes: 'some notes',
      };
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      expect(release!.version?.toString()).to.eql(expectedVersion);
    });
  });
  describe('buildUpdates', () => {
    it('builds common files', async () => {
      const strategy = new TerraformModule({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      sandbox.stub(github, 'findFilesByFilenameAndRef').resolves([]);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      assertHasUpdate(updates, 'CHANGELOG.md', Changelog);
    });

    it('finds and updates README files', async () => {
      const strategy = new TerraformModule({
        targetBranch: 'main',
        github,
        component: 'google-cloud-automl',
      });
      const findFilesStub = sandbox.stub(github, 'findFilesByFilenameAndRef');
      findFilesStub
        .withArgs('readme.md', 'main', '.')
        .resolves(['path1/readme.md', 'path2/readme.md']);
      findFilesStub
        .withArgs('README.md', 'main', '.')
        .resolves(['README.md', 'path3/README.md']);
      findFilesStub
        .withArgs('versions.tf', 'main', '.')
        .resolves(['path1/versions.tf', 'path2/versions.tf']);
      findFilesStub
        .withArgs('versions.tf.tmpl', 'main', '.')
        .resolves(['path1/versions.tf.tmpl', 'path2/versions.tf.tmpl']);
      findFilesStub
        .withArgs('metadata.yaml', 'main', '.')
        .resolves(['path1/metadata.yaml', 'path2/metadata.yaml']);
      const latestRelease = undefined;
      const release = await strategy.buildReleasePullRequest({
        commits: COMMITS,
        latestRelease,
      });
      const updates = release!.updates;
      assertHasUpdate(updates, 'path1/readme.md', ReadMe);
      assertHasUpdate(updates, 'path2/readme.md', ReadMe);
      assertHasUpdate(updates, 'README.md', ReadMe);
      assertHasUpdate(updates, 'path3/README.md', ReadMe);
      assertHasUpdate(updates, 'path1/versions.tf', ModuleVersion);
      assertHasUpdate(updates, 'path2/versions.tf', ModuleVersion);
      assertHasUpdate(updates, 'path1/versions.tf.tmpl', ModuleVersion);
      assertHasUpdate(updates, 'path2/versions.tf.tmpl', ModuleVersion);
      assertHasUpdate(updates, 'path1/metadata.yaml', MetadataVersion);
      assertHasUpdate(updates, 'path2/metadata.yaml', MetadataVersion);
    });
  });
});
