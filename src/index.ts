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

import {OctokitAPIs} from './github';

export {ReleaseCandidate, ReleasePR, ReleasePROptions} from './release-pr';

// Configuration options shared by Release PRs and
// GitHub releases:
export interface SharedOptions {
  label?: string;
  repoUrl: string;
  path?: string;
  packageName?: string;
  monorepoTags?: boolean;
  token?: string;
  apiUrl: string;
  octokitAPIs?: OctokitAPIs;
}

export {factory} from './factory';
export {getReleaserNames, getReleasers} from './releasers';
export {GitHubRelease, GitHubReleaseOptions} from './github-release';
export {JavaYoshi} from './releasers/java-yoshi';
export {Ruby} from './releasers/ruby';
