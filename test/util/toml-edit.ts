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
import {replaceTomlValue} from '../../src/updaters/toml-edit';

describe('toml-edit', () => {
  it('replaces a double-quoted string', () => {
    const input = '[package]\nversion = "0.1.0"';
    const output = replaceTomlValue(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('[package]\nversion = "0.2.0"');
  });

  it('replaces a double-quoted string with escapes', () => {
    const input = '[package]\nversion = "0.1\\t.0"';
    const output = replaceTomlValue(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('[package]\nversion = "0.2.0"');
  });

  it('replaces a single-quoted string', () => {
    const input = "[package]\nversion = '0.1.0'";
    const output = replaceTomlValue(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('[package]\nversion = "0.2.0"');
  });

  it('replaces a multiline string', () => {
    const input = '[package]\nversion = """\n0.1.0"""';
    const output = replaceTomlValue(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('[package]\nversion = "0.2.0"');
  });

  it('replaces a boolean', () => {
    const input = '[package]\nversion = false';
    const output = replaceTomlValue(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('[package]\nversion = "0.2.0"');
  });

  it('replaces when path uses dotted syntax', () => {
    const input = 'package.version = "0.1.0"';
    const output = replaceTomlValue(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('package.version = "0.2.0"');
  });

  it('replaces when path uses dotted syntax with quoted keys (1)', () => {
    const input = 'package."version" = "0.1.0"';
    const output = replaceTomlValue(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('package."version" = "0.2.0"');
  });

  it('replaces when path uses dotted syntax with quoted keys (2)', () => {
    const input = '"package".version = "0.1.0"';
    const output = replaceTomlValue(input, ['package', 'version'], '0.2.0');
    expect(output).to.equal('"package".version = "0.2.0"');
  });

  it('replaces deep paths', () => {
    const input = [
      '[first-key]',
      '# comment',
      'second-key = { third-key = false } # comment',
    ].join('\n');
    const output = replaceTomlValue(
      input,
      ['first-key', 'second-key', 'third-key'],
      '0.2.0'
    );
    expect(output).to.equal(
      [
        '[first-key]',
        '# comment',
        'second-key = { third-key = "0.2.0" } # comment',
      ].join('\n')
    );
  });

  it('throws if path is empty', () => {
    const input = '[package]\nversion = "0.1.0"';
    expect(() => {
      replaceTomlValue(input, [], '0.2.0');
    }).to.throw();
  });

  it('throws if path does not exist', () => {
    const input = '[package]\nversion = "0.1.0"';
    expect(() => {
      replaceTomlValue(input, ['package', 'variety'], '0.2.0');
    }).to.throw();
  });

  it('throws if path does not lead to a value', () => {
    const input = '[package.version]\nwoops = true';
    expect(() => {
      replaceTomlValue(input, ['package', 'version'], '0.2.0');
    }).to.throw();
  });
});
