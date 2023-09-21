// Copyright 2020 Google LLC
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

import {readFileSync, readdirSync, statSync} from 'fs';
import {resolve, posix} from 'path';
import * as crypto from 'crypto';
import * as sinon from 'sinon';
import * as snapshot from 'snap-shot-it';
import {
  Commit,
  ConventionalCommit,
  parseConventionalCommits,
} from '../src/commit';
import {GitHub, GitHubTag, GitHubRelease} from '../src/github';
import {Update} from '../src/update';
import {expect} from 'chai';
import {CandidateReleasePullRequest} from '../src/manifest';
import {Version} from '../src/version';
import {PullRequestTitle} from '../src/util/pull-request-title';
import {PullRequestBody, ReleaseData} from '../src/util/pull-request-body';
import {BranchName} from '../src/util/branch-name';
import {ReleaseType} from '../src/factory';
import {
  GitHubFileContents,
  DEFAULT_FILE_MODE,
} from '@google-automations/git-file-utils';
import {CompositeUpdater} from '../src/updaters/composite';
import {PullRequestOverflowHandler} from '../src/util/pull-request-overflow-handler';
import {ReleasePullRequest} from '../src/release-pull-request';
import {PullRequest} from '../src/pull-request';

export function safeSnapshot(content: string) {
  snapshot(dateSafe(newLine(content)));
}

export function dateSafe(content: string): string {
  return content.replace(
    /[0-9]{4}-[0-9]{2}-[0-9]{2}/g,
    '1983-10-10' // use a fake date, so that we don't break daily.
  );
}

function newLine(content: string): string {
  return content.replace(/\r\n/g, '\n');
}
/*
 * Given an object of changes expected to be made by code-suggester API,
 * stringify content in such a way that it works well for snapshots:
 */
export function stringifyExpectedChanges(expected: [string, object][]): string {
  let stringified = '';
  for (const update of expected) {
    stringified = `${stringified}\nfilename: ${update[0]}`;
    const obj = update[1] as {[key: string]: string};
    stringified = `${stringified}\n${newLine(obj.content)}`;
  }
  return dateSafe(stringified);
}

/*
 * Reads a plain-old-JavaScript object, stored in fixtures directory.
 * these are used to represent responses from the methods in the github.ts
 * wrapper for GitHub API calls:
 */
export function readPOJO(name: string): object {
  const content = readFileSync(
    resolve('./test/fixtures/pojos', `${name}.json`),
    'utf8'
  );
  return JSON.parse(content);
}

export function buildMockConventionalCommit(
  message: string,
  files: string[] = []
): ConventionalCommit[] {
  return parseConventionalCommits([
    {
      // Ensure SHA is same on Windows with replace:
      sha: crypto
        .createHash('md5')
        .update(message.replace(/\r\n/g, '\n'))
        .digest('hex'),
      message,
      files: files,
    },
  ]);
}

export function buildMockCommit(message: string, files: string[] = []): Commit {
  return {
    // Ensure SHA is same on Windows with replace:
    sha: crypto
      .createHash('md5')
      .update(message.replace(/\r\n/g, '\n'))
      .digest('hex'),
    message,
    files: files,
  };
}

export function buildGitHubFileContent(
  fixturesPath: string,
  fixture: string
): GitHubFileContents {
  return buildGitHubFileRaw(
    readFileSync(resolve(fixturesPath, fixture), 'utf8').replace(/\r\n/g, '\n')
  );
}

export function buildGitHubFileRaw(content: string): GitHubFileContents {
  return {
    content: Buffer.from(content, 'utf8').toString('base64'),
    parsedContent: content,
    // fake a consistent sha
    sha: crypto.createHash('md5').update(content).digest('hex'),
    mode: DEFAULT_FILE_MODE,
  };
}

export interface StubFiles {
  sandbox: sinon.SinonSandbox;
  github: GitHub;

  // "main"
  targetBranch?: string;

  // Example1: test/updaters/fixtures/python
  // Example2: test/fixtures/releaser/repo
  fixturePath: string;

  // list of files in the mocked repo relative to the repo root. These should
  // have corresponding fixture files to use as stubbed content.
  // Example1: ["setup.py, "src/foolib/version.py"]
  // Example2: ["python/setup.py", "python/src/foolib/version.py"]
  files: string[];

  // If true, the fixture files are assumed to exist directly beneath
  // Example (following Example1 above)
  // - test/updaters/fixtures/python/setup.py
  // - test/updaters/fixtures/python/version.py
  //
  // if false, the fixture files are assumed to exist under fixturePath *with*
  // their relative path prefix.
  // Example (following Example2 above)
  // - test/fixtures/releaser/repo/python/setup.py
  // - test/fixtures/releaser/python/src/foolib/version.py
  flatten?: boolean;

  // Inline content for files to stub.
  // Example: [
  //  ['pkg1/package.json', '{"version":"1.2.3","name":"@foo/pkg1"}']
  //  ['py/setup.py', 'version = "3.2.1"\nname = "pylib"']
  // ]
  inlineFiles?: [string, string][];
}

export function stubFilesFromFixtures(options: StubFiles) {
  const {fixturePath, sandbox, github, files} = options;
  const inlineFiles = options.inlineFiles ?? [];
  const overlap = inlineFiles.filter(f => files.includes(f[0]));
  if (overlap.length > 0) {
    throw new Error(
      'Overlap between files and inlineFiles: ' + JSON.stringify(overlap)
    );
  }
  const targetBranch = options.targetBranch ?? 'main';
  const flatten = options.flatten ?? true;
  const stub = sandbox.stub(github, 'getFileContentsOnBranch');
  for (const file of files) {
    let fixtureFile = file;
    if (flatten) {
      const parts = file.split('/');
      fixtureFile = parts[parts.length - 1];
    }
    stub
      .withArgs(file, targetBranch)
      .resolves(buildGitHubFileContent(fixturePath, fixtureFile));
  }
  for (const [file, content] of inlineFiles) {
    stub.withArgs(file, targetBranch).resolves(buildGitHubFileRaw(content));
  }
  stub.rejects(Object.assign(Error('not found'), {status: 404}));
}

// get list of files in a directory
export function getFilesInDir(
  directory: string,
  fileList: string[] = []
): string[] {
  const items = readdirSync(directory);
  for (const item of items) {
    const stat = statSync(posix.join(directory, item));
    if (stat.isDirectory())
      fileList = getFilesInDir(posix.join(directory, item), fileList);
    else fileList.push(posix.join(directory, item));
  }
  return fileList;
}

// get list of files with a particular prefix in a directory
export function getFilesInDirWithPrefix(directory: string, prefix: string) {
  const allFiles = getFilesInDir(directory);
  return allFiles
    .filter(p => {
      return posix.extname(p) === `.${prefix}`;
    })
    .map(p => posix.relative(directory, p));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function assertHasUpdate(
  updates: Update[],
  path: string,
  clazz?: any
): Update {
  const found = updates.find(update => {
    return update.path === path;
  });
  expect(found, `update for ${path}`).to.not.be.undefined;
  if (clazz) {
    expect(found?.updater).instanceof(
      clazz,
      `expected update to be of class ${clazz}`
    );
  }
  return found!;
}

export function assertHasUpdates(
  updates: Update[],
  path: string,
  ...clazz: any
) {
  if (clazz.length <= 1) {
    return assertHasUpdate(updates, path, clazz[0]);
  }

  const composite = assertHasUpdate(updates, path, CompositeUpdater)
    .updater as CompositeUpdater;
  expect(composite.updaters).to.be.lengthOf(
    clazz.length,
    `expected to find exactly ${clazz.length} updaters`
  );
  for (let i = 0; i < clazz.length; i++) {
    expect(composite.updaters[i]).to.be.instanceof(
      clazz[i],
      `expected updaters[${i}] to be of class ${clazz[i]}`
    );
  }
  return composite;
}

export function assertNoHasUpdate(updates: Update[], path: string) {
  const found = updates.find(update => {
    return update.path === path;
  });
  expect(found, `update for ${path}`).to.be.undefined;
}

export function loadCommitFixtures(name: string): Commit[] {
  const content = readFileSync(
    resolve('./test/fixtures/commits', `${name}.json`),
    'utf8'
  );
  return JSON.parse(content);
}

export function buildCommitFromFixture(name: string): Commit {
  const message = readFileSync(
    resolve('./test/fixtures/commit-messages', `${name}.txt`),
    'utf8'
  );
  return buildMockCommit(message);
}

interface MockCandidatePullRequestOptions {
  component?: string;
  updates?: Update[];
  notes?: string;
  draft?: boolean;
  labels?: string[];
  group?: string;
}
export function buildMockCandidatePullRequest(
  path: string,
  releaseType: ReleaseType,
  versionString: string,
  options: MockCandidatePullRequestOptions = {}
): CandidateReleasePullRequest {
  const version = Version.parse(versionString);
  return {
    path,
    pullRequest: {
      title: PullRequestTitle.ofTargetBranch('main', 'main'),
      body: new PullRequestBody([
        {
          component: options.component,
          version,
          notes:
            options.notes ??
            `Release notes for path: ${path}, releaseType: ${releaseType}`,
        },
      ]),
      updates: options.updates ?? [],
      labels: options.labels ?? [],
      headRefName: BranchName.ofTargetBranch('main', 'main').toString(),
      version,
      draft: options.draft ?? false,
      group: options.group,
      conventionalCommits: [],
    },
    config: {
      releaseType,
    },
  };
}

export function mockCommits(
  sandbox: sinon.SinonSandbox,
  github: GitHub,
  commits: Commit[]
): sinon.SinonStub {
  async function* fakeGenerator() {
    for (const commit of commits) {
      yield commit;
    }
  }
  return sandbox.stub(github, 'mergeCommitIterator').returns(fakeGenerator());
}

export function mockReleases(
  sandbox: sinon.SinonSandbox,
  github: GitHub,
  releases: GitHubRelease[]
): sinon.SinonStub {
  async function* fakeGenerator() {
    for (const release of releases) {
      yield release;
    }
  }
  return sandbox.stub(github, 'releaseIterator').returns(fakeGenerator());
}

export function mockTags(
  sandbox: sinon.SinonSandbox,
  github: GitHub,
  tags: GitHubTag[]
): sinon.SinonStub {
  async function* fakeGenerator() {
    for (const tag of tags) {
      yield tag;
    }
  }
  return sandbox.stub(github, 'tagIterator').returns(fakeGenerator());
}

export function mockPullRequests(
  sandbox: sinon.SinonSandbox,
  github: GitHub,
  pullRequests: PullRequest[]
): sinon.SinonStub {
  async function* fakeGenerator() {
    for (const pullRequest of pullRequests) {
      yield pullRequest;
    }
  }
  return sandbox.stub(github, 'pullRequestIterator').returns(fakeGenerator());
}

export function mockReleaseData(count: number): ReleaseData[] {
  const releaseData: ReleaseData[] = [];
  const version = Version.parse('1.2.3');
  for (let i = 0; i < count; i++) {
    releaseData.push({
      component: `component${i}`,
      version,
      notes: `release notes for component${i}`,
    });
  }
  return releaseData;
}

export class MockPullRequestOverflowHandler
  implements PullRequestOverflowHandler
{
  async handleOverflow(
    pullRequest: ReleasePullRequest,
    _baseBranch: string,
    _maxSize?: number | undefined
  ): Promise<string> {
    return pullRequest.body.toString();
  }
  async parseOverflow(
    pullRequest: PullRequest
  ): Promise<PullRequestBody | undefined> {
    return PullRequestBody.parse(pullRequest.body);
  }
}
