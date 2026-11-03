// Copyright 2026 Google LLC
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

/**
 * Loaders for the ESM-only dependencies of this CommonJS package.
 *
 * `conventional-changelog-writer` and
 * `conventional-changelog-conventionalcommits` publish an `import`-only
 * `exports` map, so `require()` cannot resolve them and they have to be
 * loaded with a dynamic `import()`.
 *
 * This file is compiled a second time by `tsconfig.esm.json`, which uses
 * `module: node16` so that TypeScript keeps the `import()` calls instead of
 * downleveling them to `require()`. The specifiers are kept literal so that
 * bundlers (release-please-action builds this package with `ncc`) can still
 * find and bundle the modules.
 */
const esmModules = {
  'conventional-changelog-writer': () =>
    import('conventional-changelog-writer'),
  'conventional-changelog-conventionalcommits': () =>
    import('conventional-changelog-conventionalcommits'),
};

/** Specifier of an ESM-only dependency of this package. */
export type EsmModuleSpecifier = keyof typeof esmModules;

/**
 * Imports one of this package's ESM-only dependencies.
 *
 * @param specifier module specifier to import
 * @returns the module namespace object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function importEsm<T = any>(specifier: EsmModuleSpecifier): Promise<T> {
  return esmModules[specifier]() as Promise<T>;
}
