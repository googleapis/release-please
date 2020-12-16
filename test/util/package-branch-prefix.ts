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

import {packageBranchPrefix} from '../../src/util/package-branch-prefix';
import {describe, it} from 'mocha';
import {expect} from 'chai';

describe('packageBranchPrefix', () => {
  const inputs = [
    // for 'node' releaseType, npm style package names get '@scope/' removed
    {releaseType: 'node', packageName: '@foo/bar', branchPrefix: 'bar'},
    {releaseType: 'node', packageName: '@foo-baz/bar', branchPrefix: 'bar'},
    // currently anything else goes untouched
    {releaseType: 'node', packageName: 'foo/bar', branchPrefix: 'foo/bar'},
    {releaseType: 'node', packageName: 'foobar', branchPrefix: 'foobar'},
    {releaseType: 'node', packageName: '', branchPrefix: ''},
    {releaseType: 'python', packageName: 'foo/bar', branchPrefix: 'foo/bar'},
    {releaseType: 'python', packageName: 'foobar', branchPrefix: 'foobar'},
    {releaseType: 'python', packageName: '', branchPrefix: ''},
    {releaseType: undefined, packageName: 'foo/bar', branchPrefix: 'foo/bar'},
    {releaseType: undefined, packageName: 'foobar', branchPrefix: 'foobar'},
    {releaseType: undefined, packageName: '', branchPrefix: ''},
  ];
  inputs.forEach(input => {
    const {releaseType, packageName, branchPrefix} = input;
    it(`maps packageName(${packageName}) to branchPrefix(${branchPrefix}) for releaseType(${releaseType})`, async () => {
      expect(packageBranchPrefix(packageName, releaseType)).to.equal(
        branchPrefix
      );
    });
  });
});
