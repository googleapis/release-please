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
declare module '@lerna/collect-updates' {
  import PackageGraph = require('@lerna/package-graph');
  import {PackageGraphNode} from '@lerna/package-graph';

  namespace collectUpdates {
    interface CollectPackagesParams {
      // default: () => true
      isCandidate?: (node: PackageGraphNode, name: string) => boolean;
      // default: undefined
      onInclude?: (name: string) => void;
      // default: undefined
      excludeDependents?: boolean;
    }

    function collectPackages(
      packages: Map<string, PackageGraphNode> | typeof PackageGraph,
      params?: CollectPackagesParams
    ): PackageGraphNode[];
  }

  export = collectUpdates;
}
