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

/**
 * Stub files on github with fixtures.
 *
 * @param fixturePath - Parent dir of fixture files. Fixture files must be
 *  direct children (no sub folders).
 * @param sandbox - created in test file.
 * @param gh - GitHub instance's `getFileContentsOnBranch` to stub
 * @param files - list of mock/repo/full/path/filename.ext. The stub file is
 *   then read from fixturePath/filename.ext.
 * @param defaultBranch - branch arg to `getFileContentsOnBranch`
 */
export function stubFilesFromFixtures(
  fixturePath: string,
  sandbox: SinonSandbox,
  gh: GitHub,
  files: string[],
  defaultBranch = 'master'
) {
  const stub = sandbox.stub(gh, 'getFileContentsOnBranch');
  for (const file of files) {
    const parts = file.split('/');
    const name = parts[parts.length - 1];
    stub
      .withArgs(file, defaultBranch)
      .resolves(buildGitHubFileContent(fixturePath, name));
  }
  stub.rejects(Object.assign(Error('not found'), {status: 404}));
}
