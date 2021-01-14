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

import {expect} from 'chai';
import {describe, it} from 'mocha';
import {replaceTomlString} from '../../src/updaters/rust/toml-edit';

describe('toml-edit', () => {
  it('replaces a string', () => {
    const input = '[package]\nversion = "0.1.0"';
    const output = replaceTomlString(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('[package]\nversion = "0.2.0"');
  });

  it('throws if path is empty', () => {
    const input = '[package]\nversion = "0.1.0"';
    expect(() => {
      replaceTomlString(input, [], '0.2.0');
    }).to.throw();
  });

  it('throws if path does not exist', () => {
    const input = '[package]\nversion = "0.1.0"';
    expect(() => {
      replaceTomlString(input, ['package', 'variety'], '0.2.0');
    }).to.throw();
  });

  it('throws if path does not lead to a string', () => {
    const input = '[package]\nversion = false';
    expect(() => {
      replaceTomlString(input, ['package', 'version'], '0.2.0');
    }).to.throw();
  });

  it('throws if result is not valid TOML', () => {
    const input = '[package]\nversion = "0.1.0"';
    expect(() => {
      replaceTomlString(input, ['package', 'version'], 'woops"unterminated');
    }).to.throw();
  });
});
