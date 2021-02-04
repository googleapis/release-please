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

import {GitHubFileContents} from '../../src/github';
import {Commit} from '../../src/graphql-to-commits';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as crypto from 'crypto';

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

export function buildMockCommit(message: string): Commit {
  return {
    sha: crypto.createHash('md5').update(message).digest('hex'),
    message,
    files: [],
  };
}
