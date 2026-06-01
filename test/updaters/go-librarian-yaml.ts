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
import {LibrarianYamlUpdater} from '../../src/updaters/go/librarian-yaml';
import {Version} from '../../src/version';

const oldContent = `language: go
libraries:
  - name: accessapproval
    version: 1.13.0
    apis:
      - path: google/cloud/accessapproval/v1
  - name: accesscontextmanager
    version: 1.14.0
    apis:
      - path: google/identity/accesscontextmanager/v1
  - name: advisorynotifications
    version: 1.10.0
`;

const updatedAccessApprovalContent = `language: go
libraries:
  - name: accessapproval
    version: 1.14.0
    apis:
      - path: google/cloud/accessapproval/v1
  - name: accesscontextmanager
    version: 1.14.0
    apis:
      - path: google/identity/accesscontextmanager/v1
  - name: advisorynotifications
    version: 1.10.0
`;

describe('GoLibrarianYamlUpdater', () => {
  it('updates librarian.yaml with matching library name', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.14.0'),
      packagePath: 'accessapproval',
    });
    const newContent = updater.updateContent(oldContent);
    expect(newContent).to.eq(updatedAccessApprovalContent);
  });

  it('returns original content if no libraries match the path', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'),
      packagePath: 'non-existent',
    });
    const newContent = updater.updateContent(oldContent);
    expect(newContent).to.equal(oldContent);
  });

  it('throws an error if the librarian.yaml is malformed (e.g., uses tabs for block indentation)', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'),
      packagePath: 'accessapproval',
    });
    // Block collections in YAML strictly forbid tab indentation and throw a parsing error
    const malformedYaml = `language: go
libraries:
\t- name: accessapproval
`;
    expect(() => updater.updateContent(malformedYaml)).to.throw(
      /cannot be parsed/
    );
  });

  it('returns original content if the libraries key is missing', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'),
      packagePath: 'accessapproval',
    });
    const yamlWithoutLibraries = `language: go
some-other-key: value
`;
    const newContent = updater.updateContent(yamlWithoutLibraries);
    expect(newContent).to.equal(yamlWithoutLibraries);
  });

  it('returns original content if the libraries key is not a sequence', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'),
      packagePath: 'accessapproval',
    });
    const yamlWithNonSeqLibraries = `language: go
libraries: not-a-sequence-string
`;
    const newContent = updater.updateContent(yamlWithNonSeqLibraries);
    expect(newContent).to.equal(yamlWithNonSeqLibraries);
  });

  it('skips elements in libraries list that are not maps', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.20.0'),
      packagePath: 'accessapproval',
    });
    const inputYaml = `language: go
libraries:
  - "not-a-map-scalar"
  - name: accessapproval
    version: 1.19.0
`;
    const expectedYaml = `language: go
libraries:
  - "not-a-map-scalar"
  - name: accessapproval
    version: 1.20.0
`;
    const outputYaml = updater.updateContent(inputYaml);
    expect(outputYaml).to.equal(expectedYaml);
  });
});
