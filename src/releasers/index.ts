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

import {ReleasePR} from '../release-pr';

import {GoYoshi} from './go-yoshi';
import {JavaAuthYoshi} from './java-auth-yoshi';
import {JavaBom} from './java-bom';
import {JavaYoshi} from './java-yoshi';
import {Node} from './node';
import {PHPYoshi} from './php-yoshi';
import {Python} from './python';
import {RubyYoshi} from './ruby-yoshi';
import {Ruby} from './ruby';
import {Simple} from './simple';
import {TerraformModule} from './terraform-module';

// TODO: add any new releasers you create to this list:
export function getReleasers(): {[key: string]: typeof ReleasePR} {
  const releasers = {
    go: GoYoshi, // TODO(codyoss): refactor this into a more generic go strategy.
    'go-yoshi': GoYoshi,
    'java-auth-yoshi': JavaAuthYoshi,
    'java-bom': JavaBom,
    'java-yoshi': JavaYoshi,
    node: Node,
    'php-yoshi': PHPYoshi,
    python: Python,
    'ruby-yoshi': RubyYoshi,
    ruby: Ruby,
    simple: Simple,
    'terraform-module': TerraformModule,
  };
  return releasers;
}

export function getReleaserNames(): string[] {
  const releasers = getReleasers();
  return Object.keys(releasers).map(key => {
    const releaser = releasers[key];
    return releaser.releaserName;
  });
}
