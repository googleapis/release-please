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
  ManifestFactoryOptions,
  ReleasePRFactoryOptions,
  GitHubReleaseFactoryOptions,
  GitHubFactoryOptions,
} from '.';
import {DEFAULT_LABELS} from './constants';
import {ManifestGitHubReleaseResult, Manifest} from './manifest';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');

// types defining methods available to call on instances
export type ManifestMethod = 'pullRequest' | 'githubRelease';
export type ReleasePRMethod = 'run' | 'latestTag';
export type GitHubReleaseMethod = 'run';
export type Method = ManifestMethod | ReleasePRMethod | GitHubReleaseMethod;

// types defining cli commands and their options
export type ManifestCommand = 'manifest-pr' | 'manifest-release';
export type ReleasePRCommand = 'release-pr' | 'latest-tag';
export type GitHubReleaseCommand = 'github-release';
type Command = ManifestCommand | ReleasePRCommand | GitHubReleaseCommand;
type IsManifestCmd = {
  command: ManifestCommand;
  options: ManifestFactoryOptions;
};
type IsReleasePRCmd = {
  command: ReleasePRCommand;
  options: ReleasePRFactoryOptions;
};
type IsGitHubReleaseCmd = {
  command: GitHubReleaseCommand;
  options: GitHubReleaseFactoryOptions;
};

// shorthand aliases for instance/method call return types
export type ManifestCallResult = Promise<
  number | undefined | ManifestGitHubReleaseResult
>;
export type ReleasePRCallResult = Promise<number | GitHubTag | undefined>;
export type GitHubReleaseCallResult = Promise<
  GitHubReleaseResponse | undefined
>;
export type CallResult =
  | ManifestCallResult
  | ReleasePRCallResult
  | GitHubReleaseCallResult;

function isManifestCmd(
  cmdOpts: IsManifestCmd | IsReleasePRCmd | IsGitHubReleaseCmd
): cmdOpts is IsManifestCmd {
  const {command, options} = cmdOpts;
  return (
    (command === 'manifest-pr' || command === 'manifest-release') &&
    typeof options === 'object'
  );
}

function isGitHubReleaseCmd(
  cmdOpts: IsManifestCmd | IsReleasePRCmd | IsGitHubReleaseCmd
): cmdOpts is IsGitHubReleaseCmd {
  const {command, options} = cmdOpts;
  return command === 'github-release' && typeof options === 'object';
}

function isReleasePRCmd(
  cmdOpts: IsManifestCmd | IsReleasePRCmd | IsGitHubReleaseCmd
): cmdOpts is IsReleasePRCmd {
  const {command, options} = cmdOpts;
  return (
    (command === 'release-pr' || command === 'latest-tag') &&
    typeof options === 'object'
  );
}

function runCommand(
  command: ManifestCommand,
  options: ManifestFactoryOptions
): ManifestCallResult;
function runCommand(
  command: ReleasePRCommand,
  options: ReleasePRFactoryOptions
): ReleasePRCallResult;
function runCommand(
  command: GitHubReleaseCommand,
  options: GitHubReleaseFactoryOptions
): GitHubReleaseCallResult;
function runCommand(
  command: Command,
  options:
    | ManifestFactoryOptions
    | GitHubReleaseFactoryOptions
    | ReleasePRFactoryOptions
): CallResult {
  const errMsg = `Invalid command(${command}) with options(${JSON.stringify(
    options
  )})`;
  let result: CallResult;
  const cmdOpts = {command, options};
  if (isManifestCmd(cmdOpts)) {
    const m = manifest(cmdOpts.options);
    if (cmdOpts.command === 'manifest-pr') {
      result = factory.call(m, 'pullRequest');
    } else if (cmdOpts.command === 'manifest-release') {
      result = factory.call(m, 'githubRelease');
    } else {
      throw new Error(errMsg);
    }
  } else if (isGitHubReleaseCmd(cmdOpts)) {
    result = factory.call(githubRelease(cmdOpts.options), 'run');
  } else if (isReleasePRCmd(cmdOpts)) {
    const releasePr = releasePR(cmdOpts.options);
    if (cmdOpts.command === 'release-pr') {
      result = factory.call(releasePr, 'run');
    } else if (cmdOpts.command === 'latest-tag') {
      result = factory.call(releasePr, 'latestTag');
    } else {
      throw new Error(errMsg);
    }
  } else {
    throw new Error(errMsg);
  }
  return result;
}

function call(instance: Manifest, method: ManifestMethod): ManifestCallResult;
function call(
  instance: ReleasePR,
  method: ReleasePRMethod
): ReleasePRCallResult;
function call(
  instance: GitHubRelease,
  method: GitHubReleaseMethod
): GitHubReleaseCallResult;
function call(
  instance: Manifest | ReleasePR | GitHubRelease,
  method: Method
): CallResult {
  if (!(method in instance)) {
    throw new Error(
      `No such method(${method}) on ${instance.constructor.name}`
    );
  }
  let result: CallResult;
  if (instance instanceof Manifest) {
    result = instance[method as ManifestMethod]();
  } else if (instance instanceof ReleasePR) {
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

function manifest(options: ManifestFactoryOptions): Manifest {
  const [GHFactoryOptions, ManifestFactoryOptions] =
    getGitHubFactoryOpts(options);
  const github = gitHubInstance(GHFactoryOptions);
  return new Manifest({github, ...ManifestFactoryOptions});
}

function githubRelease(options: GitHubReleaseFactoryOptions): GitHubRelease {
  const [GHFactoryOptions, GHRAndRPFactoryOptions] =
    getGitHubFactoryOpts(options);
  const github = gitHubInstance(GHFactoryOptions);
  const {
    releaseType,
    label,
    path,
    packageName,
    bumpMinorPreMajor,
    bumpPatchForMinorPreMajor,
    versionBumpStrategy,
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
    bumpPatchForMinorPreMajor,
    versionBumpStrategy,
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
  manifest,
  releasePR,
  releasePRClass,
  call,
  runCommand,
};
