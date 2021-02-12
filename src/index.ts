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
interface GitHubReleaseOptions {
  changelogPath?: string;
  draft?: boolean;
}

// Used by ReleasePR: Factory and Constructor
interface ReleasePROptions {
  path?: string;
  packageName?: string;
  bumpMinorPreMajor?: boolean;
  releaseAs?: string;
  snapshot?: boolean;
  monorepoTags?: boolean;
  changelogSections?: ChangelogSection[];
  // only for Ruby: TODO replace with generic bootstrap option
  lastPackageVersion?: string;
  // for Ruby: TODO refactor to find version.rb like Python finds version.py
  // and then remove this property
  versionFile?: string;
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

// ReleasePR factory/builder options
// `releaseType` is required for the ReleaserPR factory. Using a type alias
// here because the `interface ... extends` syntax produces the following error:
// "An interface can only extend an identifier/qualified-name with optional
// type arguments."
export type ReleasePRFactoryOptions = ReleasePROptions &
  GitHubFactoryOptions & {releaseType: ReleaseType; label?: string};

// GitHubRelease factory/builder options
export interface GitHubReleaseFactoryOptions
  extends GitHubReleaseOptions,
    ReleasePROptions,
    Omit<ReleasePRFactoryOptions, 'releaseType'>,
    GitHubFactoryOptions {
  releaseType?: ReleaseType;
}

export {factory} from './factory';
export {getReleaserTypes, getReleasers} from './releasers';
export {GitHubRelease} from './github-release';
export {JavaYoshi} from './releasers/java-yoshi';
export {Ruby} from './releasers/ruby';
