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
import {LibrarianYamlUpdater} from '../../src/updaters/node/librarian-yaml';
import {Version} from '../../src/version';

const oldContent = `language: nodejs
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  output: packages
libraries:
  - name: google-shopping-css
    version: 0.11.1
    apis:
      - path: google/shopping/css/v1
    copyright_year: "2026"
  - name: google-cloud-secretmanager
    version: 6.1.2
    apis:
      - path: google/cloud/secretmanager/v1
      - path: google/cloud/secretmanager/v1beta2
    copyright_year: "2026"
    keep:
      - .gitignore
  - name: firestore
    output: handwritten/firestore
    version: 8.6.0
`;

const updatedContent = `language: nodejs
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  output: packages
libraries:
  - name: google-shopping-css
    version: 0.12.0
    apis:
      - path: google/shopping/css/v1
    copyright_year: "2026"
  - name: google-cloud-secretmanager
    version: 6.1.2
    apis:
      - path: google/cloud/secretmanager/v1
      - path: google/cloud/secretmanager/v1beta2
    copyright_year: "2026"
    keep:
      - .gitignore
  - name: firestore
    output: handwritten/firestore
    version: 8.7.0
`;

describe('NodeLibrarianYamlUpdater', () => {
  it('updates librarian.yaml version based on versionsMap', () => {
    const versionsMap = new Map<string, Version>();
    versionsMap.set('packages/google-shopping-css', Version.parse('0.12.0'));
    versionsMap.set('handwritten/firestore', Version.parse('8.7.0'));

    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'), // Unused
      versionsMap,
    });
    const newContent = updater.updateContent(oldContent);
    // Compare the content to verify librarian.yaml is not reformatted.
    expect(newContent).to.eq(updatedContent);
  });

  it('returns original content if versionsMap is missing', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'),
    });
    const newContent = updater.updateContent(oldContent);
    expect(newContent).to.equal(oldContent);
  });

  it('returns original content if no libraries match versionsMap', () => {
    const versionsMap = new Map<string, Version>();
    versionsMap.set('non-existent', Version.parse('1.0.0'));
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'),
      versionsMap,
    });
    const newContent = updater.updateContent(oldContent);
    expect(newContent).to.equal(oldContent);
  });
});
