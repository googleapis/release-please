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
import {LibrarianYamlUpdater} from '../../src/updaters/python/librarian-yaml';
import {Version} from '../../src/version';

const oldContent = `language: python
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  output: packages
libraries:
  - name: google-cloud-storage
    version: 1.42.0
    apis:
      - path: google/storage/v2
    copyright_year: "2026"
  - name: google-cloud-pubsub
    version: 2.9.0
    apis:
      - path: google/pubsub/v1
    copyright_year: "2026"
    keep:
      - .gitignore
  - name: handwritten-lib
    output: handwritten/handwritten-lib
    version: 0.1.0
`;

const updatedStorageContent = `language: python
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  output: packages
libraries:
  - name: google-cloud-storage
    version: 1.43.0
    apis:
      - path: google/storage/v2
    copyright_year: "2026"
  - name: google-cloud-pubsub
    version: 2.9.0
    apis:
      - path: google/pubsub/v1
    copyright_year: "2026"
    keep:
      - .gitignore
  - name: handwritten-lib
    output: handwritten/handwritten-lib
    version: 0.1.0
`;

const updatedHandwrittenContent = `language: python
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  output: packages
libraries:
  - name: google-cloud-storage
    version: 1.42.0
    apis:
      - path: google/storage/v2
    copyright_year: "2026"
  - name: google-cloud-pubsub
    version: 2.9.0
    apis:
      - path: google/pubsub/v1
    copyright_year: "2026"
    keep:
      - .gitignore
  - name: handwritten-lib
    output: handwritten/handwritten-lib
    version: 0.2.0
`;

describe('PythonLibrarianYamlUpdater', () => {
  it('updates librarian.yaml with implicit output directory', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.43.0'),
      packagePath: 'packages/google-cloud-storage',
    });
    const newContent = updater.updateContent(oldContent);
    expect(newContent).to.eq(updatedStorageContent);
  });

  it('updates librarian.yaml with explicit output directory', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('0.2.0'),
      packagePath: 'handwritten/handwritten-lib',
    });
    const newContent = updater.updateContent(oldContent);
    expect(newContent).to.eq(updatedHandwrittenContent);
  });

  it('returns original content if no libraries match the path', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'),
      packagePath: 'packages/non-existent',
    });
    const newContent = updater.updateContent(oldContent);
    expect(newContent).to.equal(oldContent);
  });
});
