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

import { readFileSync, statSync, Stats } from 'fs';

// if an option looks like a file path, assume it's a
// path to a key and load it.
export function coerceOption(option: string): string {
  if (option.match(/[\\/]/)) {
    try {
      const stat: Stats = statSync(option);
      if (stat.isDirectory()) return option;
      else return readFileSync(option, 'utf8').trim();
    } catch (err) {
      // simply fallback to returning the original option.
    }
  }
  return option;
}
