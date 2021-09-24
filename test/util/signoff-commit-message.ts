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

import {signoffCommitMessage} from '../../src/util/signoff-commit-message';
import {describe, it} from 'mocha';
import {expect} from 'chai';

describe('signoffCommitMessage', () => {
  it('appends a signoff to the commit message with signoff user', () => {
    const commitMessage = 'chore: release 1.2.3';
    const messageWithSignoff =
      'chore: release 1.2.3\n\nSigned-off-by: Alice <alice@example.com>';

    expect(
      signoffCommitMessage(commitMessage, 'Alice <alice@example.com>')
    ).to.eql(messageWithSignoff);
  });

  it('throws an error if the signoff user is not in a valid format', () => {
    const commitMessage = 'chore: release 1.2.3';

    expect(() => signoffCommitMessage(commitMessage, 'Alice')).to.throw(
      "The format of 'Alice' is not a valid email address with display name"
    );
  });
});
