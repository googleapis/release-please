// Copyright 2019 Google LLC
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

import { Commit } from '../graphql-to-commits';

export function indentCommit(commit: Commit): string {
  const reduced: string[] = [];
  commit.message.split(/\r?\n/).forEach((line, i) => {
    if (i !== 0) line = `  ${line}`;
    // to show up in CHANGELOG lines must start with '*'.
    if (/^\s*\*/.test(line) || i === 0) {
      reduced.push(line);
    }
  });
  return reduced.join('\n');
}
