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

import * as semver from 'semver';

export type BumpType = 'major' | 'minor' | 'patch' | 'snapshot' | 'lts';

export function maxBumpType(bumpTypes: BumpType[]): BumpType {
  if (bumpTypes.some(bumpType => bumpType === 'major')) {
    return 'major';
  }
  if (bumpTypes.some(bumpType => bumpType === 'minor')) {
    return 'minor';
  }
  return 'patch';
}

export function fromSemverReleaseType(releaseType: semver.ReleaseType) {
  switch (releaseType) {
    case 'major':
    case 'minor':
    case 'patch':
      return releaseType;
    default:
      throw Error(`unsupported release type ${releaseType}`);
  }
}
