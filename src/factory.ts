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

import {Strategy, StrategyOptions} from './strategy';
import {Go} from './strategies/go';
import {GoYoshi} from './strategies/go-yoshi';
import {JavaYoshi} from './strategies/java-yoshi';
import {KRMBlueprint} from './strategies/krm-blueprint';
import {OCaml} from './strategies/ocaml';
import {PHP} from './strategies/php';
import {PHPYoshi} from './strategies/php-yoshi';
import {Python} from './strategies/python';
import {Ruby} from './strategies/ruby';
import {RubyYoshi} from './strategies/ruby-yoshi';
import {Rust} from './strategies/rust';
import {Simple} from './strategies/simple';
import {TerraformModule} from './strategies/terraform-module';
import {Helm} from './strategies/helm';
import {Elixir} from './strategies/elixir';
import {Dart} from './strategies/dart';
import {Node} from './strategies/node';
import {GitHub} from './github';
import {ReleaserConfig, PluginType, RepositoryConfig} from './manifest';
import {DefaultVersioningStrategy} from './versioning-strategies/default';
import {VersioningStrategy} from './versioning-strategy';
import {AlwaysBumpPatch} from './versioning-strategies/always-bump-patch';
import {ServicePackVersioningStrategy} from './versioning-strategies/service-pack';
import {DependencyManifest} from './versioning-strategies/dependency-manifest';
import {ManifestPlugin} from './plugin';
import {NodeWorkspace} from './plugins/node-workspace';
import {CargoWorkspace} from './plugins/cargo-workspace';

// Factory shared by GitHub Action and CLI for creating Release PRs
// and GitHub Releases:
// add any new releasers you create to this type as well as the `releasers`
// object below.
const allReleaseTypes = [
  'dart',
  'elixir',
  'go',
  'go-yoshi',
  'helm',
  'java-backport',
  'java-bom',
  'java-lts',
  'java-yoshi',
  'krm-blueprint',
  'node',
  'ocaml',
  'php',
  'php-yoshi',
  'python',
  'ruby',
  'ruby-yoshi',
  'rust',
  'simple',
  'terraform-module',
] as const;
export type ReleaseType = typeof allReleaseTypes[number];
type ReleaseBuilder = (options: StrategyOptions) => Strategy;
type Releasers = Record<string, ReleaseBuilder>;
const releasers: Releasers = {
  go: options => new Go(options),
  'go-yoshi': options => new GoYoshi(options),
  'krm-blueprint': options => new KRMBlueprint(options),
  node: options => new Node(options),
  ocaml: options => new OCaml(options),
  php: options => new PHP(options),
  'php-yoshi': options => new PHPYoshi(options),
  python: options => new Python(options),
  rust: options => new Rust(options),
  simple: options => new Simple(options),
  'terraform-module': options => new TerraformModule(options),
  helm: options => new Helm(options),
  elixir: options => new Elixir(options),
  dart: options => new Dart(options),
};

export function getReleaserTypes(): readonly ReleaseType[] {
  return allReleaseTypes;
}

export function getVersioningStrategyTypes(): readonly VersioningStrategyType[] {
  return allVersioningTypes;
}

export interface StrategyFactoryOptions extends ReleaserConfig {
  github: GitHub;
  path?: string;
  targetBranch?: string;
}

export async function buildStrategy(
  options: StrategyFactoryOptions
): Promise<Strategy> {
  const targetBranch =
    options.targetBranch ?? options.github.repository.defaultBranch;
  const versioningStrategy = buildVersioningStrategy({
    type: options.versioning,
    bumpMinorPreMajor: options.bumpMinorPreMajor,
    bumpPatchForMinorPreMajor: options.bumpPatchForMinorPreMajor,
  });
  const strategyOptions = {
    github: options.github,
    targetBranch,
    path: options.path,
    bumpMinorPreMajor: options.bumpMinorPreMajor,
    bumpPatchForMinorPreMajor: options.bumpPatchForMinorPreMajor,
    component: options.component,
    packageName: options.packageName,
    changelogPath: options.changelogPath,
    changelogSections: options.changelogSections,
    versioningStrategy,
    skipGitHubRelease: options.skipGithubRelease,
    releaseAs: options.releaseAs,
  };
  switch (options.releaseType) {
    case 'ruby': {
      return new Ruby({
        ...strategyOptions,
        versionFile: options.versionFile,
      });
    }
    case 'ruby-yoshi': {
      return new RubyYoshi({
        ...strategyOptions,
        versionFile: options.versionFile,
      });
    }
    case 'java-yoshi': {
      return new JavaYoshi({
        ...strategyOptions,
        extraFiles: options.extraFiles,
      });
    }
    case 'java-backport': {
      return new JavaYoshi({
        ...strategyOptions,
        extraFiles: options.extraFiles,
        versioningStrategy: new AlwaysBumpPatch(),
      });
    }
    case 'java-bom': {
      return new JavaYoshi({
        ...strategyOptions,
        extraFiles: options.extraFiles,
        versioningStrategy: new DependencyManifest({
          bumpMinorPreMajor: options.bumpMinorPreMajor,
          bumpPatchForMinorPreMajor: options.bumpPatchForMinorPreMajor,
        }),
      });
    }
    case 'java-lts': {
      return new JavaYoshi({
        ...strategyOptions,
        extraFiles: options.extraFiles,
        versioningStrategy: new ServicePackVersioningStrategy(),
      });
    }
    default: {
      const builder = releasers[options.releaseType];
      if (builder) {
        return builder(strategyOptions);
      }
      throw new Error(`Unknown release type: ${options.releaseType}`);
    }
  }
}

const allVersioningTypes = [
  'default',
  'always-bump-patch',
  'service-pack',
] as const;
export type VersioningStrategyType = typeof allVersioningTypes[number];
interface VersioningStrategyFactoryOptions {
  type?: VersioningStrategyType;
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
}
function buildVersioningStrategy(
  options: VersioningStrategyFactoryOptions
): VersioningStrategy {
  switch (options.type) {
    case 'always-bump-patch':
      return new AlwaysBumpPatch(options);
    case 'service-pack':
      return new ServicePackVersioningStrategy(options);
    default:
      return new DefaultVersioningStrategy(options);
  }
}

interface PluginFactoryOptions {
  type: PluginType;
  github: GitHub;
  targetBranch: string;
  repositoryConfig: RepositoryConfig;

  // node options
  alwaysLinkLocal?: boolean;

  // workspace options
  updateAllPackages?: boolean;
}

export function buildPlugin(options: PluginFactoryOptions): ManifestPlugin {
  switch (options.type) {
    case 'cargo-workspace':
      return new CargoWorkspace(
        options.github,
        options.targetBranch,
        options.repositoryConfig,
        options
      );
    case 'node-workspace':
      return new NodeWorkspace(
        options.github,
        options.targetBranch,
        options.repositoryConfig,
        options
      );
    default:
      throw new Error(`Unknown plugin type: ${options.type}`);
  }
}
