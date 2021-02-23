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
import {GitHubRelease, GitHubReleaseResponse} from './github-release';
import {ReleaseType, getReleasers} from './releasers';
import {GitHub, GitHubTag} from './github';
import {
  ReleasePRFactoryOptions,
  GitHubReleaseFactoryOptions,
  GitHubFactoryOptions,
} from '.';
import {DEFAULT_LABELS} from './constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');

// types defining methods available to call on instances
export type ReleasePRMethod = 'run' | 'latestTag';
export type GitHubReleaseMethod = 'run';
export type Method = ReleasePRMethod | GitHubReleaseMethod;

// types defining cli commands and their options
export type ReleasePRCommands = 'release-pr' | 'latest-tag';
export type GitHubReleaseCommands = 'github-release';
type Command = ReleasePRCommands | GitHubReleaseCommands;
type IsReleasePRCmd = {
  command: Command;
  options: ReleasePRFactoryOptions;
};
type IsGitHubReleaseCmd = {
  command: Command;
  options: GitHubReleaseFactoryOptions;
};

// shorthand aliases for instance/method call return types
export type ReleasePRRunResult = Promise<number | GitHubTag | undefined>;
export type GitHubReleaseRunResult = Promise<GitHubReleaseResponse | undefined>;
export type RunResult = ReleasePRRunResult | GitHubReleaseRunResult;

function isGitHubReleaseCmd(
  cmdOpts: IsReleasePRCmd | IsGitHubReleaseCmd
): cmdOpts is IsGitHubReleaseCmd {
  const {command, options} = cmdOpts;
  return command === 'github-release' && typeof options === 'object';
}

function isReleasePRCmd(
  cmdOpts: IsReleasePRCmd | IsGitHubReleaseCmd
): cmdOpts is IsReleasePRCmd {
  const {command, options} = cmdOpts;
  return (
    (command === 'release-pr' || command === 'latest-tag') &&
    typeof options === 'object'
  );
}

function runCommand(
  command: ReleasePRCommands,
  options: ReleasePRFactoryOptions
): ReleasePRRunResult;
function runCommand(
  command: GitHubReleaseCommands,
  options: GitHubReleaseFactoryOptions
): GitHubReleaseRunResult;
function runCommand(
  command: Command,
  options: GitHubReleaseFactoryOptions | ReleasePRFactoryOptions
): RunResult {
  let result: RunResult;
  const cmdOpts = {command, options};
  if (isGitHubReleaseCmd(cmdOpts)) {
    result = factory.call(githubRelease(cmdOpts.options), 'run');
  } else if (isReleasePRCmd(cmdOpts)) {
    let method: ReleasePRMethod = 'run';
    if (command === 'latest-tag') {
      method = 'latestTag';
    }
    result = factory.call(releasePR(cmdOpts.options), method);
  } else {
    throw new Error(
      `Invalid command(${command}) with options(${JSON.stringify(options)})`
    );
  }
  return result;
}

function call(instance: ReleasePR, method: ReleasePRMethod): ReleasePRRunResult;
function call(
  instance: GitHubRelease,
  method: GitHubReleaseMethod
): GitHubReleaseRunResult;
function call(instance: ReleasePR | GitHubRelease, method: Method): RunResult {
  if (!(method in instance)) {
    throw new Error(
      `No such method(${method}) on ${instance.constructor.name}`
    );
  }
  let result: RunResult;
  if (instance instanceof ReleasePR) {
    result = instance[method as ReleasePRMethod]();
  } else if (instance instanceof GitHubRelease) {
    result = instance[method as GitHubReleaseMethod]();
  } else {
    throw new Error('Unknown instance.');
  }
  return result;
}

function getLabels(label?: string): string[] {
  return label ? label.split(',') : DEFAULT_LABELS;
}

function getGitHubFactoryOpts(
  options: GitHubReleaseFactoryOptions
): [GitHubFactoryOptions, Partial<GitHubReleaseFactoryOptions>];
function getGitHubFactoryOpts(
  options: ReleasePRFactoryOptions
): [GitHubFactoryOptions, Partial<ReleasePRFactoryOptions>];
function getGitHubFactoryOpts(
  options: GitHubReleaseFactoryOptions | ReleasePRFactoryOptions
): [
  GitHubFactoryOptions,
  Partial<ReleasePRFactoryOptions | GitHubReleaseFactoryOptions>
] {
  const {
    repoUrl,
    defaultBranch,
    fork,
    token,
    apiUrl,
    octokitAPIs,
    ...remaining
  } = options;
  return [
    {
      repoUrl,
      defaultBranch,
      fork,
      token,
      apiUrl,
      octokitAPIs,
    },
    remaining,
  ];
}

function githubRelease(options: GitHubReleaseFactoryOptions): GitHubRelease {
  const [GHFactoryOptions, GHRAndRPFactoryOptions] = getGitHubFactoryOpts(
    options
  );
  const github = gitHubInstance(GHFactoryOptions);
  const {
    releaseType,
    label,
    path,
    packageName,
    bumpMinorPreMajor,
    releaseAs,
    snapshot,
    monorepoTags,
    changelogSections,
    changelogPath,
    lastPackageVersion,
    versionFile,
    ...GHRFactoryOptions
  } = GHRAndRPFactoryOptions;
  const labels = getLabels(label);
  const releasePR = new (releasePRClass(releaseType))({
    github,
    labels,
    path,
    packageName,
    bumpMinorPreMajor,
    releaseAs,
    snapshot,
    monorepoTags,
    changelogSections,
    changelogPath,
    lastPackageVersion,
    versionFile,
  });
  return new GitHubRelease({github, releasePR, ...GHRFactoryOptions});
}

function releasePR(options: ReleasePRFactoryOptions): ReleasePR {
  const [GHFactoryOptions, RPFactoryOptions] = getGitHubFactoryOpts(options);
  const github = gitHubInstance(GHFactoryOptions);

  const {releaseType, label, ...RPConstructorOptions} = RPFactoryOptions;
  const labels = getLabels(label);
  return new (factory.releasePRClass(releaseType))({
    github,
    labels,
    ...RPConstructorOptions,
  });
}

function gitHubInstance(options: GitHubFactoryOptions) {
  const {repoUrl, ...remaining} = options;
  const [owner, repo] = parseGithubRepoUrl(repoUrl);
  return new GitHub({
    owner,
    repo,
    ...remaining,
  });
}

function releasePRClass(releaseType?: ReleaseType): typeof ReleasePR {
  const releasers = getReleasers();
  const releaser = releaseType ? releasers[releaseType] : ReleasePR;
  return releaser;
}

export const factory = {
  gitHubInstance,
  githubRelease,
  releasePR,
  releasePRClass,
  call,
  runCommand,
};
