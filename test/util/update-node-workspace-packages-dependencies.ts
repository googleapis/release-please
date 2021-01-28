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

import {
  updateNodeWorkspacePackagesDependencies,
  PathPackages,
} from '../../src/util/update-node-workspace-packages-dependencies';
import {describe, it} from 'mocha';
import {expect} from 'chai';

describe('updateNodeWorkspacePackagesDependencies', () => {
  it('updates package dependencies', async () => {
    function getPackages(updated: boolean): PathPackages {
      return {
        'packages/pkgA': {
          name: '@here/pkgA',
          version: '1.1.1',
          dependencies: {'@there/foo': '^4.1.7'},
        },
        'packages/pkgB': {
          name: '@here/pkgB',
          version: '2.2.2',
          dependencies: {
            '@here/pkgA': `^${updated ? '1.1.1' : '1.1.0'}`,
            someExternal: '^9.2.3',
          },
        },
        'packages/pkgC': {
          name: '@here/pkgC',
          version: '3.3.3',
          dependencies: {
            '@here/pkgB': `^${updated ? '2.2.2' : '2.2.0'}`,
            anotherExternal: '^4.3.1',
          },
        },
        'packages/pkgD': {
          name: 'pkgD',
          version: '4.4.4',
          dependencies: {
            '@here/pkgA': `^${updated ? '1.1.1' : '1.0.0'}`,
            '@here/pkgC': `^${updated ? '3.3.3' : '3.1.2'}`,
            anotherExternal: '^4.3.1',
          },
        },
        'packages/pkgE': {
          name: '@here/pkgE',
          version: '5.5.5',
          dependencies: {
            '@here/pkgA': `^${updated ? '1.1.1' : '1.1.0'}`,
            '@here/pkgB': `^${updated ? '2.2.2' : '2.0.1'}`,
            '@here/pkgC': `^${updated ? '3.3.3' : '3.1.2'}`,
            pkgD: `^${updated ? '4.4.4' : '4.2.0'}`,
            '@something/external': '^6.2.7',
          },
        },
      };
    }
    const actual = await updateNodeWorkspacePackagesDependencies(
      getPackages(false)
    );
    const expected = getPackages(true);
    expect(actual).to.eql(expected);
  });
});
