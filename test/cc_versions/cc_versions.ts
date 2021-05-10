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

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {alwaysPatch} from '../../src/cc_versions/always_patch';
import {getCCVersion, getCCVersions} from '../../src/cc_versions';

describe('getCCVerion', () => {
  it('gets alwaysPatch', () => {
    const whatBump = getCCVersion('always-patch');
    expect(whatBump).to.eql(alwaysPatch);
  });
  it('gets names', () => {
    const names = getCCVersions();
    expect(names).to.include('always-patch');
  });
});
