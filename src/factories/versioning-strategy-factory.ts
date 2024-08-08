// Copyright 2022 Google LLC
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

import {VersioningStrategy} from '../versioning-strategy';
import {DefaultVersioningStrategy} from '../versioning-strategies/default';
import {AlwaysBumpPatch} from '../versioning-strategies/always-bump-patch';
import {AlwaysBumpMinor} from '../versioning-strategies/always-bump-minor';
import {AlwaysBumpMajor} from '../versioning-strategies/always-bump-major';
import {ServicePackVersioningStrategy} from '../versioning-strategies/service-pack';
import {GitHub} from '../github';
import {ConfigurationError} from '../errors';
import {PrereleaseVersioningStrategy} from '../versioning-strategies/prerelease';

export type VersioningStrategyType = string;

export interface VersioningStrategyFactoryOptions {
  type?: VersioningStrategyType;
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
  prereleaseType?: string;
  prerelease?: boolean;
  github: GitHub;
}

export type VersioningStrategyBuilder = (
  options: VersioningStrategyFactoryOptions
) => VersioningStrategy;

const versioningTypes: Record<string, VersioningStrategyBuilder> = {
  default: options => new DefaultVersioningStrategy(options),
  'always-bump-patch': options => new AlwaysBumpPatch(options),
  'always-bump-minor': options => new AlwaysBumpMinor(options),
  'always-bump-major': options => new AlwaysBumpMajor(options),
  'service-pack': options => new ServicePackVersioningStrategy(options),
  prerelease: options => new PrereleaseVersioningStrategy(options),
};

export function buildVersioningStrategy(
  options: VersioningStrategyFactoryOptions
): VersioningStrategy {
  const builder = versioningTypes[options.type || 'default'];
  if (builder) {
    return builder(options);
  }
  throw new ConfigurationError(
    `Unknown versioning strategy type: ${options.type}`,
    'core',
    `${options.github.repository.owner}/${options.github.repository.repo}`
  );
}

export function registerVersioningStrategy(
  name: string,
  versioningStrategyBuilder: VersioningStrategyBuilder
) {
  versioningTypes[name] = versioningStrategyBuilder;
}

export function unregisterVersioningStrategy(name: string) {
  delete versioningTypes[name];
}

export function getVersioningStrategyTypes(): readonly VersioningStrategyType[] {
  return Object.keys(versioningTypes).sort();
}
