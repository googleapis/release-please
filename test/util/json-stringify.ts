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
import {jsonStringify} from '../../src/util/json-stringify';

describe('json-stringify', () => {
  it('should respect the indentation (1/3)', () => {
    const input = JSON.stringify(
      {name: 'release-please', version: '1.2.3'},
      undefined,
      2
    );
    expect(jsonStringify(JSON.parse(input), input)).to.equal(input);
  });

  it('should respect the indentation (2/3)', () => {
    const input = JSON.stringify(
      {name: 'release-please', version: '1.2.3'},
      undefined,
      '\t'
    );
    expect(jsonStringify(JSON.parse(input), input)).to.equal(input);
  });

  it('should respect the indentation (3/3)', () => {
    const input = JSON.stringify({name: 'release-please', version: '1.2.3'});
    expect(jsonStringify(JSON.parse(input), input)).to.equal(input);
  });

  it('it should look like the original content as much as possible', () => {
    const input = `            \n\r${JSON.stringify(
      {name: 'release-please', version: '1.2.3'},
      undefined,
      3
    )}    \r            \n`;
    expect(jsonStringify(JSON.parse(input), input)).to.equal(input);
  });
});
