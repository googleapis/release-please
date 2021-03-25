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

import {OctokitAPIs, GitHub} from './github';
import {ReleaseType} from './releasers';
import {ReleasePR} from './release-pr';
import {ChangelogSection} from './conventional-commits';
import {Checkpoint} from './util/checkpoint';

export {ReleaseCandidate, ReleasePR} from './release-pr';

// Used by GitHub: Factory and Constructor
interface GitHubOptions {
  defaultBranch?: string;
  fork?: boolean;
  token?: string;
  apiUrl?: string;
  octokitAPIs?: OctokitAPIs;
}

// Used by GitHubRelease: Factory and Constructor
export interface GitHubReleaseOptions {
  draft?: boolean;
}

// Used by ReleasePR: Factory and Constructor
export interface ReleasePROptions {
  path?: string;
  packageName?: string;
  bumpMinorPreMajor?: boolean;
  releaseAs?: string;
  snapshot?: boolean;
  monorepoTags?: boolean;
  changelogSections?: ChangelogSection[];
  changelogPath?: string;
  // only for Ruby: TODO replace with generic bootstrap option
  lastPackageVersion?: string;
  // for Ruby: TODO refactor to find version.rb like Python finds version.py
  // and then remove this property
  versionFile?: string;
  pullRequestTitlePattern?: string;
}

// GitHub Constructor options
export interface GitHubConstructorOptions extends GitHubOptions {
  owner: string;
  repo: string;
}

// Used by GitHubRelease and ReleasePR Constructor
interface ReleaserConstructorOptions {
  github: GitHub;
}

interface ManifestOptions {
  configFile?: string;
  manifestFile?: string;
}

export interface ManifestConstructorOptions
  extends ReleaserConstructorOptions,
    ManifestOptions {
  checkpoint?: Checkpoint;
}

export interface ManifestFactoryOptions
  extends GitHubFactoryOptions,
    ManifestOptions {}

// ReleasePR Constructor options
export interface ReleasePRConstructorOptions
  extends ReleasePROptions,
    ReleaserConstructorOptions {
  labels?: string[];
}

// GitHubRelease Constructor options
export interface GitHubReleaseConstructorOptions
  extends GitHubReleaseOptions,
    ReleaserConstructorOptions {
  releasePR: ReleasePR;
}

// Used by everyone, Factory only. Convenience to offer shorthand way of
// specifying the repo and owner. Implementation parses the repoUrl and passes
// the resulting {owner,repo} to the GitHub constructor
interface FactoryOptions {
  repoUrl: string;
}

// GitHub factory/builder options
export interface GitHubFactoryOptions extends GitHubOptions, FactoryOptions {}

// ReleasePR and GitHubRelease Factory
interface ReleaserFactory {
  releaseType?: ReleaseType;
}

// ReleasePR factory/builder options
export interface ReleasePRFactoryOptions
  extends ReleasePROptions,
    GitHubFactoryOptions,
    ReleaserFactory {
  label?: string;
}

// GitHubRelease factory/builder options
export interface GitHubReleaseFactoryOptions
  extends GitHubReleaseOptions,
    ReleasePROptions,
    ReleasePRFactoryOptions,
    GitHubFactoryOptions {}

export {factory} from './factory';
export {getReleaserTypes, getReleasers} from './releasers';
export {GitHubRelease} from './github-release';
export {JavaYoshi} from './releasers/java-yoshi';
export {Ruby} from './releasers/ruby';
