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

import Package = require('@lerna/package');
import PackageGraph = require('@lerna/package-graph');
import runTopologically = require('@lerna/run-topologically');

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type PathPackages = Record<string, PackageJson>;

// Inspired by https://github.com/lerna/lerna/blob/72414ec1c679cf8a7ae4bfcefce52d50a6120a70/commands/version/index.js#L495
// Expected input is a mapping of 'path/to/dirContainingPkgJson' => JSON.parse(package.json)
// It is also assumed that each package.json version is the new version.
// Each package.json dependency on another package will be updated to "^pkg.latest.version"
export async function updateNodeWorkspacePackagesDependencies(
  packages: PathPackages
): Promise<PathPackages> {
  const lernaPkgs: Package[] = [];
  const newVersions: Record<string, string> = {};
  for (const path in packages) {
    const pkg = packages[path];
    lernaPkgs.push(new Package(pkg, path));
    newVersions[pkg.name] = pkg.version;
  }
  const graph = new PackageGraph(lernaPkgs, 'dependencies');
  const runner = async (pkg: Package): Promise<Package> => {
    const graphPkg = graph.get(pkg.name);
    for (const [depName, resolved] of graphPkg.localDependencies) {
      const depVersion = newVersions[depName];
      if (depVersion && resolved.type !== 'directory') {
        pkg.updateLocalDependency(resolved, depVersion, '^');
      }
    }
    return pkg;
  };
  const updatedPkgs: Package[] = await runTopologically(lernaPkgs, runner, {
    graphType: 'dependencies',
    concurrency: 1,
    rejectCycles: false,
  });
  const ret: PathPackages = {};
  for (const updated of updatedPkgs) {
    ret[updated.location] = updated.toJSON();
  }
  return ret;
}
