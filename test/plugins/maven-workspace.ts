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

import {describe, it, afterEach, beforeEach} from 'mocha';
import * as sinon from 'sinon';
import {MavenWorkspace} from '../../src/plugins/maven-workspace';
import {GitHub} from '../../src/github';
import {ManifestPlugin} from '../../src/plugin';
import {
  CandidateReleasePullRequest,
  DEFAULT_RELEASE_PLEASE_MANIFEST,
} from '../../src/manifest';
import {
  buildMockCandidatePullRequest,
  buildGitHubFileContent,
  stubFilesFromFixtures,
  safeSnapshot,
  assertHasUpdate,
  assertHasUpdates,
} from '../helpers';
import {expect} from 'chai';
import {Update} from '../../src/update';
import {Version} from '../../src/version';
import {PomXml} from '../../src/updaters/java/pom-xml';
import {RawContent} from '../../src/updaters/raw-content';
import {ReleasePleaseManifest} from '../../src/updaters/release-please-manifest';

const sandbox = sinon.createSandbox();
const fixturesPath = './test/fixtures/plugins/maven-workspace';

describe('MavenWorkspace plugin', () => {
  let github: GitHub;
  let plugin: ManifestPlugin;
  beforeEach(async () => {
    github = await GitHub.create({
      owner: 'googleapis',
      repo: 'maven-test-repo',
      defaultBranch: 'main',
    });
    plugin = new MavenWorkspace(
      github,
      'main',
      DEFAULT_RELEASE_PLEASE_MANIFEST,
      {
        bom: {
          releaseType: 'maven',
        },
        maven1: {
          releaseType: 'maven',
        },
        maven2: {
          releaseType: 'maven',
        },
        maven3: {
          releaseType: 'maven',
        },
        maven4: {
          releaseType: 'maven',
        },
      }
    );
  });
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    it('handles a single maven package', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('maven4', 'maven', '4.4.5', {
          component: 'maven4',
          updates: [
            buildMockPackageUpdate('maven4/pom.xml', 'maven4/pom.xml', '4.4.5'),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves([
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ]);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).length(1);
      safeSnapshot(newCandidates[0].pullRequest.body.toString());
      expect(newCandidates[0].pullRequest.body.releaseData).length(1);
    });
    it('appends to existing candidate', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('maven3', 'maven', '3.3.4', {
          component: 'maven3',
          updates: [
            buildMockPackageUpdate('maven3/pom.xml', 'maven3/pom.xml', '3.3.4'),
          ],
        }),
        buildMockCandidatePullRequest('maven4', 'maven', '4.4.5', {
          component: 'maven4',
          updates: [
            buildMockPackageUpdate('maven4/pom.xml', 'maven4/pom.xml', '4.4.5'),
          ],
          notes: '### Dependencies\n\n* Updated foo to v3',
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves([
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ]);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).length(1);
      safeSnapshot(newCandidates[0].pullRequest.body.toString());
      expect(newCandidates[0].pullRequest.body.releaseData).length(2);
    });
    it('appends to existing candidate with special updater', async () => {
      const customUpdater = new RawContent('some content');
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('maven3', 'maven', '3.3.4', {
          component: 'maven3',
          updates: [
            buildMockPackageUpdate('maven3/pom.xml', 'maven3/pom.xml', '3.3.4'),
          ],
        }),
        buildMockCandidatePullRequest('maven4', 'maven', '4.4.5', {
          component: 'maven4',
          updates: [
            {
              path: 'maven4/pom.xml',
              createIfMissing: false,
              cachedFileContents: buildGitHubFileContent(
                fixturesPath,
                'maven4/pom.xml'
              ),
              updater: customUpdater,
            },
          ],
          notes: '### Dependencies\n\n* Updated foo to v3',
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves([
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ]);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).length(1);
      safeSnapshot(newCandidates[0].pullRequest.body.toString());
      expect(newCandidates[0].pullRequest.body.releaseData).length(2);
      assertHasUpdates(
        newCandidates[0].pullRequest.updates,
        'maven4/pom.xml',
        RawContent,
        PomXml
      );
      assertHasUpdates(
        newCandidates[0].pullRequest.updates,
        'maven3/pom.xml',
        PomXml,
        PomXml
      );
    });
    it('walks dependency tree and updates previously untouched packages', async () => {
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('maven1', 'maven', '1.1.2', {
          component: 'maven1',
          updates: [
            buildMockPackageUpdate('maven1/pom.xml', 'maven1/pom.xml', '1.1.2'),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves([
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ]);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).length(1);
      safeSnapshot(newCandidates[0].pullRequest.body.toString());
      expect(newCandidates[0].pullRequest.body.releaseData).length(4);
    });
    it('skips pom files not configured for release', async () => {
      plugin = new MavenWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          bom: {
            releaseType: 'maven',
          },
          maven1: {
            releaseType: 'maven',
          },
          maven2: {
            releaseType: 'maven',
          },
          maven3: {
            releaseType: 'maven',
          },
          maven4: {
            releaseType: 'maven',
          },
        },
        {
          considerAllArtifacts: false,
        }
      );
      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves([
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
          'extra/pom.xml',
        ]);
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('maven1', 'maven', '1.1.2', {
          component: 'maven1',
          updates: [
            buildMockPackageUpdate('maven1/pom.xml', 'maven1/pom.xml', '1.1.2'),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).length(1);
      safeSnapshot(newCandidates[0].pullRequest.body.toString());
      expect(newCandidates[0].pullRequest.body.releaseData).length(4);
    });
    it('can consider all artifacts', async () => {
      plugin = new MavenWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          bom: {
            component: 'my-bom',
            releaseType: 'java-yoshi',
          },
          multi1: {
            component: 'multi1',
            releaseType: 'java-yoshi',
          },
          multi2: {
            component: 'multi2',
            releaseType: 'java-yoshi',
          },
        },
        {
          considerAllArtifacts: true,
        }
      );
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('multi1', 'java-yoshi', '1.1.2', {
          component: 'multi1',
          updates: [
            buildMockPackageUpdate('multi1/pom.xml', 'multi1/pom.xml', '1.1.2'),
            buildMockPackageUpdate(
              'multi1/bom/pom.xml',
              'multi1/bom/pom.xml',
              '1.1.2'
            ),
            buildMockPackageUpdate(
              'multi1/primary/pom.xml',
              'multi1/primary/pom.xml',
              '1.1.2'
            ),
            buildMockPackageUpdate(
              'multi1/sub1/pom.xml',
              'multi1/sub1/pom.xml',
              '2.2.3'
            ),
            buildMockPackageUpdate(
              'multi1/sub2/pom.xml',
              'multi1/sub2/pom.xml',
              '3.3.4'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'bom/pom.xml',
          'multi1/pom.xml',
          'multi1/bom/pom.xml',
          'multi1/primary/pom.xml',
          'multi1/sub1/pom.xml',
          'multi1/sub2/pom.xml',
          'multi2/pom.xml',
          'multi2/bom/pom.xml',
          'multi2/primary/pom.xml',
          'multi2/sub1/pom.xml',
          'multi2/sub2/pom.xml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves([
          'bom/pom.xml',
          'multi1/pom.xml',
          'multi1/bom/pom.xml',
          'multi1/primary/pom.xml',
          'multi1/sub1/pom.xml',
          'multi1/sub2/pom.xml',
          'multi2/pom.xml',
          'multi2/bom/pom.xml',
          'multi2/primary/pom.xml',
          'multi2/sub1/pom.xml',
          'multi2/sub2/pom.xml',
        ]);
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).length(1);
      expect(newCandidates[0].pullRequest.body.releaseData).length(2);
      safeSnapshot(newCandidates[0].pullRequest.body.toString());
      const bomUpdate = assertHasUpdate(
        newCandidates[0].pullRequest.updates,
        'bom/pom.xml',
        PomXml
      );
      safeSnapshot(await renderUpdate(github, 'main', bomUpdate));
    });
    it('skips updating manifest with snapshot versions', async () => {
      plugin = new MavenWorkspace(
        github,
        'main',
        DEFAULT_RELEASE_PLEASE_MANIFEST,
        {
          bom: {
            releaseType: 'maven',
          },
          maven1: {
            releaseType: 'maven',
          },
          maven2: {
            releaseType: 'maven',
          },
          maven3: {
            releaseType: 'maven',
          },
          maven4: {
            releaseType: 'maven',
          },
        }
      );
      sandbox
        .stub(github, 'findFilesByFilenameAndRef')
        .withArgs('pom.xml', 'main')
        .resolves([
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ]);
      const candidates: CandidateReleasePullRequest[] = [
        buildMockCandidatePullRequest('maven1', 'maven', '1.1.2-SNAPSHOT', {
          component: 'maven1',
          updates: [
            buildMockPackageUpdate(
              'maven1/pom.xml',
              'maven1/pom.xml',
              '1.1.2-SNAPSHOT'
            ),
          ],
        }),
        buildMockCandidatePullRequest('maven2', 'maven', '2.2.3-SNAPSHOT', {
          component: 'maven2',
          updates: [
            buildMockPackageUpdate(
              'maven2/pom.xml',
              'maven2/pom.xml',
              '2.2.3-SNAPSHOT'
            ),
          ],
        }),
        buildMockCandidatePullRequest('maven3', 'maven', '3.3.4-SNAPSHOT', {
          component: 'maven3',
          updates: [
            buildMockPackageUpdate(
              'maven3/pom.xml',
              'maven3/pom.xml',
              '3.3.4-SNAPSHOT'
            ),
          ],
        }),
        buildMockCandidatePullRequest('maven4', 'maven', '4.4.5-SNAPSHOT', {
          component: 'maven4',
          updates: [
            buildMockPackageUpdate(
              'maven4/pom.xml',
              'maven4/pom.xml',
              '4.4.5-SNAPSHOT'
            ),
          ],
        }),
      ];
      stubFilesFromFixtures({
        sandbox,
        github,
        fixturePath: fixturesPath,
        files: [
          'maven1/pom.xml',
          'maven2/pom.xml',
          'maven3/pom.xml',
          'maven4/pom.xml',
        ],
        flatten: false,
        targetBranch: 'main',
      });
      const newCandidates = await plugin.run(candidates);
      expect(newCandidates).length(1);
      const update = assertHasUpdate(
        newCandidates[0].pullRequest.updates,
        '.release-please-manifest.json',
        ReleasePleaseManifest
      );
      const updater = update.updater as ReleasePleaseManifest;
      for (const [_, version] of updater.versionsMap!) {
        expect(version.toString()).to.not.include('SNAPSHOT');
      }
    });
  });
});

function buildMockPackageUpdate(
  path: string,
  fixtureName: string,
  newVersionString: string
): Update {
  const cachedFileContents = buildGitHubFileContent(fixturesPath, fixtureName);
  return {
    path,
    createIfMissing: false,
    cachedFileContents,
    updater: new PomXml(Version.parse(newVersionString)),
  };
}

async function renderUpdate(
  github: GitHub,
  branch: string,
  update: Update
): Promise<string> {
  const fileContents =
    update.cachedFileContents ||
    (await github.getFileContentsOnBranch(update.path, branch));
  return update.updater.updateContent(fileContents.parsedContent);
}
