// Copyright 2019 Google LLC
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

// Factory shared by GitHub Action and CLI for creating Release PRs
// and GitHub Releases:

import {ReleasePR, ReleasePROptions} from './release-pr';
import {RubyReleasePROptions} from './releasers/ruby';
import {
  GitHubReleaseOptions,
  GitHubRelease,
  ReleaseResponse,
} from './github-release';
import {getReleasers} from './releasers';

function runCommand(
  command: string,
  options: GitHubReleaseOptions | ReleasePROptions
): Promise<number | undefined | ReleaseResponse> {
  if (isGitHubRelease(command, options)) {
    return factory.run(githubRelease(options));
  } else {
    return factory.run(releasePR(options));
  }
}

function isGitHubRelease(
  command: string,
  options: GitHubReleaseOptions | ReleasePROptions
): options is GitHubReleaseOptions {
  return command === 'github-release' && typeof options === 'object';
}

function run(runnable: ReleasePR | GitHubRelease) {
  return runnable.run();
}

function githubRelease(options: GitHubReleaseOptions): GitHubRelease {
  return new GitHubRelease(options);
}

function releasePR(options: ReleasePROptions): ReleasePR {
  const releaseOptions: ReleasePROptions | RubyReleasePROptions = options;
  return new (factory.releasePRClass(options.releaseType))(releaseOptions);
}
export function releasePRClass(releaseType: string): typeof ReleasePR {
  const releasers = getReleasers();
  const releaser = releasers[releaseType];
  if (!releaser) {
    throw Error('unknown release type');
  }
  return releaser;
}

export const factory = {
  githubRelease,
  releasePR,
  releasePRClass,
  run,
  runCommand,
};
