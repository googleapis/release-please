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

import {Strategy} from './strategy';
import {Go} from './strategies/go';
import {GoYoshi} from './strategies/go-yoshi';
import {JavaYoshi} from './strategies/java-yoshi';
import {JavaYoshiMonoRepo} from './strategies/java-yoshi-mono-repo';
import {KRMBlueprint} from './strategies/krm-blueprint';
import {OCaml} from './strategies/ocaml';
import {PHP} from './strategies/php';
import {PHPYoshi} from './strategies/php-yoshi';
import {Python} from './strategies/python';
import {Ruby} from './strategies/ruby';
import {Rust} from './strategies/rust';
import {Sfdx} from './strategies/sfdx';
import {Simple} from './strategies/simple';
import {TerraformModule} from './strategies/terraform-module';
import {Helm} from './strategies/helm';
import {Elixir} from './strategies/elixir';
import {Dart} from './strategies/dart';
import {Node} from './strategies/node';
import {Expo} from './strategies/expo';
import {GitHub} from './github';
import {ReleaserConfig} from './manifest';
import {AlwaysBumpPatch} from './versioning-strategies/always-bump-patch';
import {ServicePackVersioningStrategy} from './versioning-strategies/service-pack';
import {DependencyManifest} from './versioning-strategies/dependency-manifest';
import {BaseStrategyOptions} from './strategies/base';
import {DotnetYoshi} from './strategies/dotnet-yoshi';
import {Java} from './strategies/java';
import {Maven} from './strategies/maven';
import {buildVersioningStrategy} from './factories/versioning-strategy-factory';
import {buildChangelogNotes} from './factories/changelog-notes-factory';
import {ConfigurationError} from './errors';

export * from './factories/changelog-notes-factory';
export * from './factories/plugin-factory';
export * from './factories/versioning-strategy-factory';

// Factory shared by GitHub Action and CLI for creating Release PRs
// and GitHub Releases:
// add any new releasers you create to this type as well as the `releasers`
// object below.

export type ReleaseType = string;
export type ReleaseBuilder = (options: BaseStrategyOptions) => Strategy;

export interface StrategyFactoryOptions extends ReleaserConfig {
  github: GitHub;
  path?: string;
  targetBranch?: string;
  changesBranch?: string;
}

const releasers: Record<string, ReleaseBuilder> = {
  'dotnet-yoshi': options => new DotnetYoshi(options),
  go: options => new Go(options),
  'go-yoshi': options => new GoYoshi(options),
  java: options => new Java(options),
  maven: options => new Maven(options),
  'java-yoshi': options => new JavaYoshi(options),
  'java-yoshi-mono-repo': options => new JavaYoshiMonoRepo(options),
  'java-backport': options =>
    new JavaYoshi({
      ...options,
      versioningStrategy: new AlwaysBumpPatch(),
    }),
  'java-bom': options =>
    new JavaYoshi({
      ...options,
      versioningStrategy: new DependencyManifest({
        bumpMinorPreMajor: options.bumpMinorPreMajor,
        bumpPatchForMinorPreMajor: options.bumpPatchForMinorPreMajor,
      }),
    }),
  'java-lts': options =>
    new JavaYoshi({
      ...options,
      versioningStrategy: new ServicePackVersioningStrategy(),
    }),
  'krm-blueprint': options => new KRMBlueprint(options),
  node: options => new Node(options),
  expo: options => new Expo(options),
  ocaml: options => new OCaml(options),
  php: options => new PHP(options),
  'php-yoshi': options => new PHPYoshi(options),
  python: options => new Python(options),
  ruby: options => new Ruby(options),
  rust: options => new Rust(options),
  salesforce: options => new Sfdx(options),
  sfdx: options => new Sfdx(options),
  simple: options => new Simple(options),
  'terraform-module': options => new TerraformModule(options),
  helm: options => new Helm(options),
  elixir: options => new Elixir(options),
  dart: options => new Dart(options),
};

export async function buildStrategy(
  options: StrategyFactoryOptions
): Promise<Strategy> {
  const targetBranch =
    options.targetBranch ?? options.github.repository.defaultBranch;
  const changesBranch = options.changesBranch || targetBranch;
  const versioningStrategy = buildVersioningStrategy({
    github: options.github,
    type: options.versioning,
    bumpMinorPreMajor: options.bumpMinorPreMajor,
    bumpPatchForMinorPreMajor: options.bumpPatchForMinorPreMajor,
  });
  const changelogNotes = buildChangelogNotes({
    type: options.changelogType || 'default',
    github: options.github,
    changelogSections: options.changelogSections,
  });
  const strategyOptions: BaseStrategyOptions = {
    skipGitHubRelease: options.skipGithubRelease, // Note the case difference in GitHub
    ...options,
    targetBranch,
    changesBranch,
    versioningStrategy,
    changelogNotes,
  };

  const builder = releasers[options.releaseType];
  if (builder) {
    return builder(strategyOptions);
  }
  throw new ConfigurationError(
    `Unknown release type: ${options.releaseType}`,
    'core',
    `${options.github.repository.owner}/${options.github.repository.repo}`
  );
}

export function registerReleaseType(
  name: string,
  strategyBuilder: ReleaseBuilder
) {
  releasers[name] = strategyBuilder;
}

export function unregisterReleaseType(name: string) {
  delete releasers[name];
}

export function getReleaserTypes(): readonly ReleaseType[] {
  return Object.keys(releasers).sort();
}
