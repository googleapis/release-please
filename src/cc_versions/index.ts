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

import {alwaysPatch} from './always_patch';
import {ConventionalChangelogCommit} from '@conventional-commits/parser';
import {BumpSuggestion} from '../conventional-commits';

export type CCVersionBumper = (
  commits: ConventionalChangelogCommit[],
  preMajor: boolean
) => BumpSuggestion;

export type CCVersion = 'always-patch';

type CCVersions = Record<CCVersion, CCVersionBumper>;

const ccVersions: CCVersions = {
  'always-patch': alwaysPatch,
};

export function getCCVersions(): readonly CCVersion[] {
  const names: CCVersion[] = [];
  for (const ccVersion of Object.keys(ccVersions)) {
    names.push(ccVersion as CCVersion);
  }
  return names;
}

export function getCCVersion(ccVersion: CCVersion): CCVersionBumper {
  return ccVersions[ccVersion];
}
