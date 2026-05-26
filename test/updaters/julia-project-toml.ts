// Copyright 2026 Google LLC
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
import {Version} from '../../src/version';
import {
  ProjectToml,
  parseProjectToml,
} from '../../src/updaters/julia/project-toml';

const PROJECT_TOML = `name = "ExampleJuliaPkg"
uuid = "12345678-1234-1234-1234-123456789abc"
version = "0.3.4"

[compat]
julia = "1.10"
`;

describe('ProjectToml', () => {
  describe('parseProjectToml', () => {
    it('parses package name and version', async () => {
      expect(parseProjectToml(PROJECT_TOML)).to.deep.equal({
        name: 'ExampleJuliaPkg',
        version: '0.3.4',
      });
    });
  });

  describe('updateContent', () => {
    it('updates the version and preserves surrounding content', async () => {
      const updater = new ProjectToml({version: Version.parse('0.4.0')});
      const updated = updater.updateContent(PROJECT_TOML);

      expect(updated).to.contain('name = "ExampleJuliaPkg"');
      expect(updated).to.contain(
        'uuid = "12345678-1234-1234-1234-123456789abc"'
      );
      expect(updated).to.contain('version = "0.4.0"');
      expect(updated).to.contain('[compat]');
      expect(updated).to.contain('julia = "1.10"');
    });
  });
});
