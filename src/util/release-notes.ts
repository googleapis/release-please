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

export function extractReleaseNotes(
  changelogContents: string,
  version: string
): string {
  version = version.replace(/^v/, '');
  const latestRe = new RegExp(
    `## v?\\[?${version}[^\\n]*\\n(.*?)(\\n##\\s|\\n### \\[?[0-9]+\\.|($(?![\r\n])))`,
    'ms'
  );
  const match = changelogContents.match(latestRe);
  if (!match) {
    throw Error('could not find changelog entry corresponding to release PR');
  }
  return match[1];
}
