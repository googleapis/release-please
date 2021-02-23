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

import {GitHubFileContents, GitHub} from '../../src/github';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as crypto from 'crypto';
import {SinonSandbox} from 'sinon';

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
  };
}

export interface StubFiles {
  sandbox: SinonSandbox;
  github: GitHub;

  // "master" TODO update all test code to use "main"
  defaultBranch?: string;

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
  const defaultBranch = options.defaultBranch ?? 'master';
  const flatten = options.flatten ?? true;
  const stub = sandbox.stub(github, 'getFileContentsOnBranch');
  for (const file of files) {
    let fixtureFile = file;
    if (flatten) {
      const parts = file.split('/');
      fixtureFile = parts[parts.length - 1];
    }
    stub
      .withArgs(file, defaultBranch)
      .resolves(buildGitHubFileContent(fixturePath, fixtureFile));
  }
  for (const [file, content] of inlineFiles) {
    stub.withArgs(file, defaultBranch).resolves(buildGitHubFileRaw(content));
  }
  stub.rejects(Object.assign(Error('not found'), {status: 404}));
}
