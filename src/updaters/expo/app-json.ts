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

import {jsonStringify} from '../../util/json-stringify';
import {logger as defaultLogger, Logger} from '../../util/logger';
import {DefaultUpdater, UpdateOptions} from '../default';
import {Version} from '../../version';

export interface AppJson {
  expo: {
    version: string;
    ios?: {
      buildNumber?: string;
    };
    android?: {
      versionCode?: number;
    };
  };
}

export interface AppJsonOptions extends UpdateOptions {
  expoSDKVersion: Version;
}

/**
 * This updates a React Natve Expo project app.json file's main, ios and android
 * versions. All values except the `android.versionCode` are standard semver
 * version numbers. For the `android.versionCode`, the semver number is used as
 * the basis for the `versionCode`.
 */
export class AppJson extends DefaultUpdater {
  expoSDKVersion: Version;
  constructor(options: AppJsonOptions) {
    super(options);
    this.expoSDKVersion = options.expoSDKVersion;
  }
  /**
   * Given initial file contents, return updated contents.
   */
  updateContent(content: string, logger: Logger = defaultLogger): string {
    const parsed = JSON.parse(content) as AppJson;

    logger.info(
      `updating Expo version from ${parsed.expo.version} to ${this.version}`
    );
    parsed.expo.version = this.version.toString();

    if (parsed.expo.ios?.buildNumber) {
      logger.info(
        `updating iOS version from ${parsed.expo.ios.buildNumber} to ${this.version}`
      );
      parsed.expo.ios.buildNumber = this.version.toString();
    }

    if (parsed.expo.android?.versionCode) {
      // Android versionCode
      // https://developer.android.com/studio/publish/versioning#appversioning
      let expoMajorVersion = 0;
      try {
        expoMajorVersion = this.expoSDKVersion.major;
      } catch (e) {
        // Rethrow with a nice error message.
        throw new Error(
          'Unable to determine the Expo SDK version for this project. Make sure that the expo package is installed for your project.'
        );
      }

      // Implements the `versionCode` strategy described by Maxi Rosson
      // @see https://medium.com/@maxirosson/versioning-android-apps-d6ec171cfd82
      const versionCode =
        expoMajorVersion * 10000000 +
        this.version.major * 10000 +
        this.version.minor * 100 +
        this.version.patch;
      logger.info(
        `updating Android version from ${parsed.expo.android.versionCode} to ${versionCode}`
      );
      parsed.expo.android.versionCode = versionCode;
    }

    return jsonStringify(parsed, content);
  }
}
