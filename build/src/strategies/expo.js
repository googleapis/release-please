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
exports.Expo = void 0;
const node_1 = require("./node");
const app_json_1 = require("../updaters/expo/app-json");
const version_1 = require("../version");
/**
 * Strategy for building Expo based React Native projects. This strategy extends
 * the Node strategy to additionally update the `app.json` file of a project.
 */
class Expo extends node_1.Node {
    async buildUpdates(options) {
        const version = options.newVersion;
        const updates = await super.buildUpdates(options);
        const expoSDKVersion = await this.getExpoSDKVersion();
        updates.push({
            path: this.addPath('app.json'),
            createIfMissing: false,
            updater: new app_json_1.AppJson({ version, expoSDKVersion }),
        });
        return updates;
    }
    /**
     * Determine the Expo SDK version by parsing the package.json dependencies.
     */
    async getExpoSDKVersion() {
        var _a, _b, _c, _d;
        const pkgJsonContents = await this.getPkgJsonContents();
        const pkg = JSON.parse(pkgJsonContents.parsedContent);
        return version_1.Version.parse(((_a = pkg.dependencies) === null || _a === void 0 ? void 0 : _a.expo) ||
            ((_b = pkg.devDependencies) === null || _b === void 0 ? void 0 : _b.expo) ||
            ((_c = pkg.peerDependencies) === null || _c === void 0 ? void 0 : _c.expo) ||
            ((_d = pkg.optionalDependencies) === null || _d === void 0 ? void 0 : _d.expo) ||
            '0.0.0');
    }
}
exports.Expo = Expo;
//# sourceMappingURL=expo.js.map