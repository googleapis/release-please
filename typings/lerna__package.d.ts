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
declare module '@lerna/package' {
  import npa = require('npm-package-arg');

  namespace Package {
    interface PackageJson {
      name: string;
      version: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    }

    // unclear why we need this. Possibly related to
    // https://github.com/typescript-eslint/typescript-eslint/issues/1856
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class Package {
      location: string;
      name: string;
      version: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      constructor(
        pkg: Package.PackageJson,
        location: string,
        rootPath?: string
      );

      updateLocalDependency(
        resolved: npa.Result,
        depVersion: string,
        savePrefix: string
      ): void;

      // real interface is `val: any` but we only ever set a string
      set(key: string, val: string): this;
      toJSON(): Package.PackageJson;
    }
  }

  export = Package;
}
