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

import {
  BuildOptions,
  ReleaseType,
  ReleasePR,
  ReleasePROptions,
} from './release-pr';
import { Ruby, RubyReleasePROptions } from './releasers/ruby';
import { JavaAuthYoshi } from './releasers/java-auth-yoshi';
import { Node } from './releasers/node';
import { PHPYoshi } from './releasers/php-yoshi';
import { Python } from './releasers/python';
import { RubyYoshi } from './releasers/ruby-yoshi';
import { JavaYoshi } from './releasers/java-yoshi';

export class ReleasePRFactory {
  static build(releaseType: ReleaseType, options: BuildOptions): ReleasePR {
    const releaseOptions: ReleasePROptions = {
      ...options,
      ...{ releaseType },
    };
    switch (releaseType) {
      case ReleaseType.Node:
        return new Node(releaseOptions);
      case ReleaseType.PHPYoshi:
        return new PHPYoshi(releaseOptions);
      case ReleaseType.JavaAuthYoshi:
        // TODO: coerce this to the generic Java release
        return new JavaAuthYoshi(releaseOptions);
      case ReleaseType.JavaYoshi:
        return new JavaYoshi(releaseOptions);
      case ReleaseType.Python:
        return new Python(releaseOptions);
      case ReleaseType.Ruby:
        return new Ruby(releaseOptions as RubyReleasePROptions);
      case ReleaseType.RubyYoshi:
        return new RubyYoshi(releaseOptions);
      default:
        throw Error('unknown release type');
    }
  }
}
