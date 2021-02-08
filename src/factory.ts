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

import {ReleasePR} from './release-pr';
import {GitHubRelease, ReleaseResponse} from './github-release';
import {ReleaseType, getReleasers} from './releasers';
import {GitHub} from './github';
import {
  ReleasePRFactoryOptions,
  GitHubReleaseFactoryOptions,
  GitHubFactoryOptions,
} from '.';
import {DEFAULT_LABELS} from './constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');

function runCommand(
  command: string,
  options: GitHubReleaseFactoryOptions | ReleasePRFactoryOptions
): Promise<number | undefined | ReleaseResponse> {
  if (isGitHubRelease(command, options)) {
    return factory.run(githubRelease(options));
  } else {
    return factory.run(releasePR(options));
  }
}

function isGitHubRelease(
  command: string,
  options: GitHubReleaseFactoryOptions | ReleasePRFactoryOptions
): options is GitHubReleaseFactoryOptions {
  return command === 'github-release' && typeof options === 'object';
}

function run(runnable: ReleasePR | GitHubRelease) {
  return runnable.run();
}

function getLabels(label?: string): string[] {
  return label ? label.split(',') : DEFAULT_LABELS;
}

function githubRelease(options: GitHubReleaseFactoryOptions): GitHubRelease {
  const {
    label,
    repoUrl,
    defaultBranch,
    token,
    apiUrl,
    octokitAPIs,
    releaseType,
    path,
    packageName,
    bumpMinorPreMajor,
    releaseAs,
    snapshot,
    monorepoTags,
    fork,
    changelogSections,
    lastPackageVersion,
    versionFile,
    ...remaining
  } = options;

  const github = gitHubInstance({
    repoUrl,
    defaultBranch,
    token,
    apiUrl,
    octokitAPIs,
  });

  const labels = getLabels(label);
  const prClass = releaseType ? releasePRClass(releaseType) : ReleasePR;
  const releasePR = new prClass({
    github,
    labels,
    path,
    packageName,
    bumpMinorPreMajor,
    releaseAs,
    snapshot,
    monorepoTags,
    fork,
    changelogSections,
    lastPackageVersion,
    versionFile,
  });

  return new GitHubRelease({github, releasePR, ...remaining});
}

function releasePR(options: ReleasePRFactoryOptions): ReleasePR {
  const {
    repoUrl,
    defaultBranch,
    token,
    apiUrl,
    octokitAPIs,
    releaseType,
    label,
    ...remaining
  } = options;
  const github = gitHubInstance({
    repoUrl,
    defaultBranch,
    token,
    apiUrl,
    octokitAPIs,
  });

  const labels = getLabels(label);
  return new (factory.releasePRClass(releaseType))({
    github,
    labels,
    ...remaining,
  });
}

export function gitHubInstance(options: GitHubFactoryOptions) {
  const [owner, repo] = parseGithubRepoUrl(options.repoUrl);
  return new GitHub({
    owner,
    repo,
    defaultBranch: options.defaultBranch,
    token: options.token,
    apiUrl: options.apiUrl,
    octokitAPIs: options.octokitAPIs,
  });
}

export function releasePRClass(releaseType: ReleaseType): typeof ReleasePR {
  const releasers = getReleasers();
  const releaser = releasers[releaseType];
  if (!releaser) {
    throw Error('unknown release type');
  }
  return releaser;
}

export const factory = {
  gitHubInstance,
  githubRelease,
  releasePR,
  releasePRClass,
  run,
  runCommand,
};
