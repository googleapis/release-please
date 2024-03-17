// Copyright 2024 Google LLC
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
import {resolveRef} from '../../src/util/apply-extends';

describe('resolveRef()', () => {
  it('parses local (same repo) ref', () => {
    expect(resolveRef('./some-config.json', 'main')).to.eq('some-config.json');
  });
  it('parses renovate-like ref', () => {
    expect(resolveRef('github>foo/bar', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/main/release-please-config.json'
    );
    expect(resolveRef('github>foo/bar#beta', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/beta/release-please-config.json'
    );
    expect(resolveRef('github>foo/bar:config', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/main/config.json'
    );
    expect(resolveRef('github>foo/bar:config.yaml', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/main/config.yaml'
    );
    expect(
      resolveRef('github>foo/bar:some/nested/config.yaml#alpha', 'main')
    ).to.eq(
      'https://raw.githubusercontent.com/foo/bar/alpha/some/nested/config.yaml'
    );
  });
  it('parses github ref', () => {
    expect(resolveRef('foo/bar', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/main/release-please-config.json'
    );
    expect(resolveRef('foo/bar@beta', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/beta/release-please-config.json'
    );
    expect(resolveRef('foo/bar/config', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/main/config.json'
    );
    expect(resolveRef('foo/bar:config', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/main/config.json'
    );
    expect(resolveRef('foo/bar:config.yaml', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/main/config.yaml'
    );
    expect(resolveRef('foo/bar:some/nested/config.yaml@alpha', 'main')).to.eq(
      'https://raw.githubusercontent.com/foo/bar/alpha/some/nested/config.yaml'
    );
  });
  it('throws error otherwise', () => {
    expect(() => resolveRef('broken-ref', 'main')).to.throw(
      "config: unsupported 'extends' argument: broken-ref"
    );
  });
});
