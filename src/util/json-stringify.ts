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

import detectIndent = require('detect-indent');

export function jsonStringify(
  parsed: object,
  content: string,
  replacer?: (string | number)[]
): string {
  return `${content.slice(0, content.indexOf('{'))}${JSON.stringify(
    parsed,
    replacer,
    detectIndent(content.trim()).indent
  )}${content.slice(content.lastIndexOf('}') + 1)}`;
}
