"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppJson = void 0;
const json_stringify_1 = require("../../util/json-stringify");
const logger_1 = require("../../util/logger");
const default_1 = require("../default");
/**
 * This updates a React Natve Expo project app.json file's main, ios and android
 * versions. All values except the `android.versionCode` are standard semver
 * version numbers. For the `android.versionCode`, the semver number is used as
 * the basis for the `versionCode`.
 */
class AppJson extends default_1.DefaultUpdater {
    constructor(options) {
        super(options);
        this.expoSDKVersion = options.expoSDKVersion;
    }
    /**
     * Given initial file contents, return updated contents.
     */
    updateContent(content, logger = logger_1.logger) {
        var _a, _b;
        const parsed = JSON.parse(content);
        logger.info(`updating Expo version from ${parsed.expo.version} to ${this.version}`);
        parsed.expo.version = this.version.toString();
        if ((_a = parsed.expo.ios) === null || _a === void 0 ? void 0 : _a.buildNumber) {
            logger.info(`updating iOS version from ${parsed.expo.ios.buildNumber} to ${this.version}`);
            parsed.expo.ios.buildNumber = this.version.toString();
        }
        if ((_b = parsed.expo.android) === null || _b === void 0 ? void 0 : _b.versionCode) {
            // Android versionCode
            // https://developer.android.com/studio/publish/versioning#appversioning
            let expoMajorVersion = 0;
            try {
                expoMajorVersion = this.expoSDKVersion.major;
            }
            catch (e) {
                // Rethrow with a nice error message.
                throw new Error('Unable to determine the Expo SDK version for this project. Make sure that the expo package is installed for your project.');
            }
            // Implements the `versionCode` strategy described by Maxi Rosson
            // @see https://medium.com/@maxirosson/versioning-android-apps-d6ec171cfd82
            const versionCode = expoMajorVersion * 10000000 +
                this.version.major * 10000 +
                this.version.minor * 100 +
                this.version.patch;
            logger.info(`updating Android version from ${parsed.expo.android.versionCode} to ${versionCode}`);
            parsed.expo.android.versionCode = versionCode;
        }
        return (0, json_stringify_1.jsonStringify)(parsed, content);
    }
}
exports.AppJson = AppJson;
//# sourceMappingURL=app-json.js.map