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
import {RubyReleasePROptions} from './releasers/ruby';
import {getReleasers} from './releasers';

import {Node} from './releasers/node';
import {Python} from './releasers/python';
import {Ruby} from './releasers/ruby';
import {Simple} from './releasers/simple';
import {TerraformModule} from './releasers/terraform-module';

export class ReleasePRFactory {
  static build(releaseType: string, options: BuildOptions): ReleasePR {
    const releaseOptions: ReleasePROptions | RubyReleasePROptions = {
      ...options,
      ...{releaseType},
    };
    return new (ReleasePRFactory.class(releaseType))(releaseOptions);
  }
  // Return a ReleasePR class, based on the release type, e.g., node, python:
  static class(releaseType: string): typeof ReleasePR {
    const releasers = getReleasers();
    const releaser = releasers[releaseType];
    if (!releaser) {
      throw Error('unknown release type');
    }
    return releaser;
  }
  // For the benefit of WebPack, we provide a static factory for a subset
  // of the releasers available in the release please GitHub action:
  static buildStatic(releaseType: string, options: BuildOptions) {
    const releaseOptions: ReleasePROptions = {
      ...options,
      ...{releaseType},
    };
    switch (releaseType) {
      case 'node':
        return new Node(releaseOptions);
      case 'python':
        return new Python(releaseOptions);
      case 'ruby':
        return new Ruby(releaseOptions as RubyReleasePROptions);
      case 'simple':
        return new Simple(releaseOptions);
      case 'terraform-module':
        return new TerraformModule(releaseOptions);
      default:
        throw Error('unknown release type');
    }
  }
}
