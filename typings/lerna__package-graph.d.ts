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

/**
 * skeleton only representing what we use.
 */
declare module '@lerna/package-graph' {
  import {Package} from '@lerna/package';
  import npa = require('npm-package-arg');

  namespace PackageGraph {
    class PackageGraphNode {
      name: string;
      version: string;
      location: string;
      pkg: Package;
      localDependencies: Map<string, npa.Result>;
      localDependents: Map<string, npa.Result>;
      externalDependencies: Map<string, npa.Result>;
      constructor(pkg: Package);
    }

    // unclear why we need this. Possibly related to
    // https://github.com/typescript-eslint/typescript-eslint/issues/1856
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class PackageGraph extends Map {
      rawPackageList: Package[];
      constructor(
        packages: Package[],
        graphType: 'allDependencies' | 'dependencies'
      );

      get(name: string): PackageGraph.PackageGraphNode;
      addDependents(filteredPackages: Package[]): Package[];
    }
  }

  export = PackageGraph;
}
