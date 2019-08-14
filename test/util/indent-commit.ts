/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { indentCommit } from '../../src/util/indent-commit';

import * as snapshot from 'snap-shot-it';

describe('indentCommit', () => {
  it('handles carriage return', () => {
    snapshot(
      indentCommit({
        message: `feat: my awesome commit message\r
* testing one line\r
* testing second line`,
        sha: 'abc123',
        files: [],
      })
    );
  });

  it('ignores empty lines', () => {
    snapshot(
      indentCommit({
        message: `feat: my awesome commit message
* testing one line

* testing second line`,
        sha: 'abc123',
        files: [],
      })
    );
  });
});
