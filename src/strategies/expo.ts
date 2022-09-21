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

import {BuildUpdatesOptions} from './base';
import {Node} from './node';
import {Update} from '../update';
import {AppJson} from '../updaters/expo/app-json';
import {Version} from '../version';

/**
 * Strategy for building Expo based React Native projects. This strategy extends
 * the Node strategy to additionally update the `app.json` file of a project.
 */
export class Expo extends Node {
  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const version = options.newVersion;
    const updates = await super.buildUpdates(options);
    const expoSDKVersion = await this.getExpoSDKVersion();

    updates.push({
      path: this.addPath('app.json'),
      createIfMissing: false,
      updater: new AppJson({version, expoSDKVersion}),
    });

    return updates;
  }

  /**
   * Determine the Expo SDK version by parsing the package.json dependencies.
   */
  async getExpoSDKVersion(): Promise<Version> {
    const pkgJsonContents = await this.getPkgJsonContents();
    const pkg = JSON.parse(pkgJsonContents.parsedContent);
    return Version.parse(
      pkg.dependencies?.expo ||
        pkg.devDependencies?.expo ||
        pkg.peerDependencies?.expo ||
        pkg.optionalDependencies?.expo ||
        '0.0.0'
    );
  }
}
