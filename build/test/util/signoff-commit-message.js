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
const signoff_commit_message_1 = require("../../src/util/signoff-commit-message");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
(0, mocha_1.describe)('signoffCommitMessage', () => {
    (0, mocha_1.it)('appends a signoff to the commit message with signoff user', () => {
        const commitMessage = 'chore: release 1.2.3';
        const messageWithSignoff = 'chore: release 1.2.3\n\nSigned-off-by: Alice <alice@example.com>';
        (0, chai_1.expect)((0, signoff_commit_message_1.signoffCommitMessage)(commitMessage, 'Alice <alice@example.com>')).to.eql(messageWithSignoff);
    });
    (0, mocha_1.it)('throws an error if the signoff user is not in a valid format', () => {
        const commitMessage = 'chore: release 1.2.3';
        (0, chai_1.expect)(() => (0, signoff_commit_message_1.signoffCommitMessage)(commitMessage, 'Alice')).to.throw("The format of 'Alice' is not a valid email address with display name");
    });
});
//# sourceMappingURL=signoff-commit-message.js.map