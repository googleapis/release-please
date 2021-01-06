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

import {GitHubRelease, GitHubReleaseOptions} from './github-release';
import {ReleasePRFactory} from './release-pr-factory';
import {ReleasePROptions} from './release-pr';

type Commands = 'github-release' | 'release-pr';

interface MappedOptions {
  changelogTypes?: string;
}

type Options = (GitHubReleaseOptions | ReleasePROptions) & MappedOptions;

export default async function main(
  options: Options,
  command?: Commands,
  onReleaseCreated?: Function
) {
  if (!command || command === 'github-release') {
    const gr = new GitHubRelease(options as GitHubReleaseOptions);
    const releaseCreated = await gr.createRelease();
    if (releaseCreated && onReleaseCreated) {
      onReleaseCreated(releaseCreated);
    }
  }
  if (!command || command === 'release-pr') {
    const opts = options as ReleasePROptions;
    if (options.changelogTypes) {
      opts.changelogSections = JSON.parse(options.changelogTypes);
    }
    const release = ReleasePRFactory.buildStatic(opts.releaseType, opts);
    await release.run();
  }
}
