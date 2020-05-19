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

import {BuildOptions, ReleasePR, ReleasePROptions} from './release-pr';
import releasers from './releasers';

export class ReleasePRFactory {
  static build(releaseType: string, options: BuildOptions): ReleasePR {
    const releaseOptions: ReleasePROptions = {
      ...options,
      ...{releaseType},
    };
    return new (ReleasePRFactory.class(releaseType))(releaseOptions);
  }
  static class(releaseType: string): typeof ReleasePR {
    for (const releaser of releasers) {
      if (releaser.releaserName === releaseType) {
        return releaser;
      }
    }
    throw Error('unknown release type');
  }
}
