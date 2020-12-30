// Copyright 2020 Google LLC
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

import {readFileSync} from 'fs';
import {resolve} from 'path';

/*
 * Given an object of chnages expected to be made by code-suggester API,
 * stringify content in such a way that it works well for snapshots:
 */
export function stringifyExpectedChanges(expected: [string, object][]): string {
  let stringified = '';
  for (const update of expected) {
    stringified = `${stringified}\nfilename: ${update[0]}`;
    const obj = update[1] as {[key: string]: string};
    stringified = `${stringified}\n${obj.content}`;
  }
  return stringified.replace(
    /[0-9]{4}-[0-9]{2}-[0-9]{2}/g,
    '1983-10-10' // use a fake date, so that we don't break daily.
  );
}

/*
 * Reads a plain-old-JavaScript object, stored in fixtures directory.
 * these are used to represent responses from the methods in the github.ts
 * wrapper for GitHub API calls:
 */
export function readPOJO(name: string): object {
  const content = readFileSync(
    resolve('./test/fixtures/pojos', `${name}.json`),
    'utf8'
  );
  return JSON.parse(content);
}
