"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReleaserTypes = exports.unregisterReleaseType = exports.registerReleaseType = exports.buildStrategy = void 0;
const go_1 = require("./strategies/go");
const go_yoshi_1 = require("./strategies/go-yoshi");
const java_yoshi_1 = require("./strategies/java-yoshi");
const java_yoshi_mono_repo_1 = require("./strategies/java-yoshi-mono-repo");
const krm_blueprint_1 = require("./strategies/krm-blueprint");
const ocaml_1 = require("./strategies/ocaml");
const php_1 = require("./strategies/php");
const php_yoshi_1 = require("./strategies/php-yoshi");
const python_1 = require("./strategies/python");
const ruby_1 = require("./strategies/ruby");
const ruby_yoshi_1 = require("./strategies/ruby-yoshi");
const rust_1 = require("./strategies/rust");
const sfdx_1 = require("./strategies/sfdx");
const simple_1 = require("./strategies/simple");
const terraform_module_1 = require("./strategies/terraform-module");
const helm_1 = require("./strategies/helm");
const elixir_1 = require("./strategies/elixir");
const dart_1 = require("./strategies/dart");
const node_1 = require("./strategies/node");
const expo_1 = require("./strategies/expo");
const always_bump_patch_1 = require("./versioning-strategies/always-bump-patch");
const service_pack_1 = require("./versioning-strategies/service-pack");
const dependency_manifest_1 = require("./versioning-strategies/dependency-manifest");
const dotnet_yoshi_1 = require("./strategies/dotnet-yoshi");
const java_1 = require("./strategies/java");
const maven_1 = require("./strategies/maven");
const versioning_strategy_factory_1 = require("./factories/versioning-strategy-factory");
const changelog_notes_factory_1 = require("./factories/changelog-notes-factory");
const errors_1 = require("./errors");
__exportStar(require("./factories/changelog-notes-factory"), exports);
__exportStar(require("./factories/plugin-factory"), exports);
__exportStar(require("./factories/versioning-strategy-factory"), exports);
const releasers = {
    'dotnet-yoshi': options => new dotnet_yoshi_1.DotnetYoshi(options),
    go: options => new go_1.Go(options),
    'go-yoshi': options => new go_yoshi_1.GoYoshi(options),
    java: options => new java_1.Java(options),
    maven: options => new maven_1.Maven(options),
    'java-yoshi': options => new java_yoshi_1.JavaYoshi(options),
    'java-yoshi-mono-repo': options => new java_yoshi_mono_repo_1.JavaYoshiMonoRepo(options),
    'java-backport': options => new java_yoshi_1.JavaYoshi({
        ...options,
        versioningStrategy: new always_bump_patch_1.AlwaysBumpPatch(),
    }),
    'java-bom': options => new java_yoshi_1.JavaYoshi({
        ...options,
        versioningStrategy: new dependency_manifest_1.DependencyManifest({
            bumpMinorPreMajor: options.bumpMinorPreMajor,
            bumpPatchForMinorPreMajor: options.bumpPatchForMinorPreMajor,
        }),
    }),
    'java-lts': options => new java_yoshi_1.JavaYoshi({
        ...options,
        versioningStrategy: new service_pack_1.ServicePackVersioningStrategy(),
    }),
    'krm-blueprint': options => new krm_blueprint_1.KRMBlueprint(options),
    node: options => new node_1.Node(options),
    expo: options => new expo_1.Expo(options),
    ocaml: options => new ocaml_1.OCaml(options),
    php: options => new php_1.PHP(options),
    'php-yoshi': options => new php_yoshi_1.PHPYoshi(options),
    python: options => new python_1.Python(options),
    ruby: options => new ruby_1.Ruby(options),
    'ruby-yoshi': options => new ruby_yoshi_1.RubyYoshi(options),
    rust: options => new rust_1.Rust(options),
    salesforce: options => new sfdx_1.Sfdx(options),
    sfdx: options => new sfdx_1.Sfdx(options),
    simple: options => new simple_1.Simple(options),
    'terraform-module': options => new terraform_module_1.TerraformModule(options),
    helm: options => new helm_1.Helm(options),
    elixir: options => new elixir_1.Elixir(options),
    dart: options => new dart_1.Dart(options),
};
async function buildStrategy(options) {
    var _a;
    const targetBranch = (_a = options.targetBranch) !== null && _a !== void 0 ? _a : options.github.repository.defaultBranch;
    const versioningStrategy = (0, versioning_strategy_factory_1.buildVersioningStrategy)({
        github: options.github,
        type: options.versioning,
        bumpMinorPreMajor: options.bumpMinorPreMajor,
        bumpPatchForMinorPreMajor: options.bumpPatchForMinorPreMajor,
    });
    const changelogNotes = (0, changelog_notes_factory_1.buildChangelogNotes)({
        type: options.changelogType || 'default',
        github: options.github,
        changelogSections: options.changelogSections,
    });
    const strategyOptions = {
        skipGitHubRelease: options.skipGithubRelease,
        ...options,
        targetBranch,
        versioningStrategy,
        changelogNotes,
    };
    const builder = releasers[options.releaseType];
    if (builder) {
        return builder(strategyOptions);
    }
    throw new errors_1.ConfigurationError(`Unknown release type: ${options.releaseType}`, 'core', `${options.github.repository.owner}/${options.github.repository.repo}`);
}
exports.buildStrategy = buildStrategy;
function registerReleaseType(name, strategyBuilder) {
    releasers[name] = strategyBuilder;
}
exports.registerReleaseType = registerReleaseType;
function unregisterReleaseType(name) {
    delete releasers[name];
}
exports.unregisterReleaseType = unregisterReleaseType;
function getReleaserTypes() {
    return Object.keys(releasers).sort();
}
exports.getReleaserTypes = getReleaserTypes;
//# sourceMappingURL=factory.js.map