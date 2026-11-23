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
import {Version} from '../../src/version';
import {renderTemplate} from '../../src/util/template-renderer';

describe('template-renderer', () => {
  describe('renderTemplate', () => {
    it('should render {{version}}', () => {
      const version = new Version(1, 2, 3);
      const result = renderTemplate('{{version}}', version);
      expect(result).to.equal('1.2.3');
    });

    it('should render {{major}}, {{minor}}, {{patch}}', () => {
      const version = new Version(1, 2, 3);
      const result = renderTemplate('{{major}}.{{minor}}.{{patch}}', version);
      expect(result).to.equal('1.2.3');
    });

    it('should render with prerelease', () => {
      const version = new Version(1, 2, 3, 'beta.1');
      const result = renderTemplate('{{version}}-{{prerelease}}', version);
      expect(result).to.equal('1.2.3-beta.1-beta.1');
    });

    it('should render {{prerelease}} as empty when not present', () => {
      const version = new Version(1, 2, 3);
      const result = renderTemplate('v{{version}}-{{prerelease}}', version);
      expect(result).to.equal('v1.2.3-');
    });

    it('should render {{component}}', () => {
      const version = new Version(1, 2, 3);
      const result = renderTemplate(
        'ghcr.io/org/{{component}}:{{version}}',
        version,
        'my-app'
      );
      expect(result).to.equal('ghcr.io/org/my-app:1.2.3');
    });

    it('should render complex template', () => {
      const version = new Version(2, 5, 10, 'rc.1');
      const result = renderTemplate(
        'v{{major}}.{{minor}} ({{version}})',
        version,
        'app'
      );
      expect(result).to.equal('v2.5 (2.5.10-rc.1)');
    });

    it('should handle template with no variables', () => {
      const version = new Version(1, 2, 3);
      const result = renderTemplate('constant-string', version);
      expect(result).to.equal('constant-string');
    });

    it('should replace all occurrences of variables', () => {
      const version = new Version(1, 2, 3);
      const result = renderTemplate('{{major}}.{{major}}.{{major}}', version);
      expect(result).to.equal('1.1.1');
    });
  });
});
