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

export * as Errors from './errors';
export {Manifest} from './manifest';
export type {ReleaserConfig, ManifestOptions, PluginType} from './manifest';
export type {Commit, ConventionalCommit} from './commit';
export type {Strategy} from './strategy';
export type {BaseStrategyOptions, BuildUpdatesOptions} from './strategies/base';
export type {ReleaseBuilder, ReleaseType} from './factory';
export {getReleaserTypes, registerReleaseType} from './factory';
export type {
  ChangelogNotesBuilder,
  ChangelogNotesFactoryOptions,
  ChangelogNotesType,
} from './factories/changelog-notes-factory';
export {
  getChangelogTypes,
  registerChangelogNotes,
} from './factories/changelog-notes-factory';
export type {
  PluginBuilder,
  PluginFactoryOptions,
  getPluginTypes,
  registerPlugin,
} from './factories/plugin-factory';
export type {
  VersioningStrategyBuilder,
  VersioningStrategyFactoryOptions,
  VersioningStrategyType,
} from './factories/versioning-strategy-factory';
export {
  getVersioningStrategyTypes,
  registerVersioningStrategy,
} from './factories/versioning-strategy-factory';
export type {
  BuildNotesOptions,
  ChangelogNotes,
  ChangelogSection,
} from './changelog-notes';
export type {Logger} from './util/logger';
export {setLogger} from './util/logger';
export {GitHub} from './github';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export import configSchema = require('../schemas/config.json');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export import manifestSchema = require('../schemas/manifest.json');
