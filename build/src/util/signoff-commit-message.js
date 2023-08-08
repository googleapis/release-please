"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.signoffCommitMessage = void 0;
// cannot import from '..' - transpiled code references to RELEASE_PLEASE
// at the script level are undefined, they are only defined inside function
// or instance methods/properties.
function isValidSignoffUser(signoffUser) {
    // Parse the name and email address from a string in the following format
    // Display Name <email@address.com>
    const pattern = /^([^<]+)\s*<([^>]+)>$/i;
    // Check we have a match
    const isMatch = new RegExp(pattern).test(signoffUser);
    return isMatch;
}
function signoffCommitMessage(commitMessage, signoffUser) {
    if (!isValidSignoffUser(signoffUser)) {
        throw new Error(`The format of '${signoffUser}' is not a valid email address with display name`);
    }
    return commitMessage + `\n\nSigned-off-by: ${signoffUser}`;
}
exports.signoffCommitMessage = signoffCommitMessage;
//# sourceMappingURL=signoff-commit-message.js.map