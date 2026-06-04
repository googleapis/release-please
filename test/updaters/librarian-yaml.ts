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
import {LibrarianYamlUpdater} from '../../src/updaters/librarian-yaml';
import {Version} from '../../src/version';

const goContent = `language: go
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

const goContentUpdated = `language: go
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

const pythonContent = `language: python
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

const pythonContentUpdatedStorage = `language: python
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

const pythonContentUpdatedHandwritten = `language: python
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

const javaContent = `language: java
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  java:
    libraries_bom_version: 26.79.0
libraries:
  - name: google-cloud-java
    version: 1.84.0
    skip_generate: true
  - name: shopping-css
    version: 0.58.0
    apis:
      - path: google/shopping/css/v1
    java:
      released_version: 0.57.0
      api_description_override: The CSS API is used to manage your CSS and control your CSS Products portfolio
      non_cloud_api: true
      artifact_id: google-shopping-css
      group_id: com.google.shopping
      name_pretty_override: CSS API
      java_apis:
        - additional_protos:
            - google/cloud/common_resources.proto
          path: google/shopping/css/v1
      product_documentation_override: https://developers.google.com/comparison-shopping-services/api
  - name: secretmanager
    version: 2.1.0
    java:
      released_version: 2.0.0
      api_description_override: allows you to encrypt, store, manage, and audit infrastructure and application-level secrets.
`;

const javaContentUpdated = `language: java
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  java:
    libraries_bom_version: 26.79.0
libraries:
  - name: google-cloud-java
    version: 1.85.0
    skip_generate: true
    java:
      released_version: 1.85.0
  - name: shopping-css
    version: 0.59.0
    apis:
      - path: google/shopping/css/v1
    java:
      released_version: 0.59.0
      api_description_override: The CSS API is used to manage your CSS and control your CSS Products portfolio
      non_cloud_api: true
      artifact_id: google-shopping-css
      group_id: com.google.shopping
      name_pretty_override: CSS API
      java_apis:
        - additional_protos:
            - google/cloud/common_resources.proto
          path: google/shopping/css/v1
      product_documentation_override: https://developers.google.com/comparison-shopping-services/api
  - name: secretmanager
    version: 2.2.0
    java:
      released_version: 2.2.0
      api_description_override: allows you to encrypt, store, manage, and audit infrastructure and application-level secrets.
`;

const snapshotUpdatedContent = `language: java
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  java:
    libraries_bom_version: 26.79.0
libraries:
  - name: google-cloud-java
    version: 1.85.0-SNAPSHOT
    skip_generate: true
  - name: shopping-css
    version: 0.59.0-SNAPSHOT
    apis:
      - path: google/shopping/css/v1
    java:
      released_version: 0.57.0
      api_description_override: The CSS API is used to manage your CSS and control your CSS Products portfolio
      non_cloud_api: true
      artifact_id: google-shopping-css
      group_id: com.google.shopping
      name_pretty_override: CSS API
      java_apis:
        - additional_protos:
            - google/cloud/common_resources.proto
          path: google/shopping/css/v1
      product_documentation_override: https://developers.google.com/comparison-shopping-services/api
  - name: secretmanager
    version: 2.2.0-SNAPSHOT
    java:
      released_version: 2.0.0
      api_description_override: allows you to encrypt, store, manage, and audit infrastructure and application-level secrets.
`;

describe('LibrarianYamlUpdater', () => {
  describe('Error Handling and Validation', () => {
    it('throws an error if the librarian.yaml is malformed (e.g., uses tabs for block indentation)', () => {
      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.0.0'),
        packagePath: 'accessapproval',
      });
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

    it('returns original content if no libraries match the path', () => {
      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.0.0'),
        packagePath: 'non-existent',
      });
      const newContent = updater.updateContent(goContent);
      expect(newContent).to.equal(goContent);
    });
  });

  describe('Single-Version Match Logic (Go/Python/Node style)', () => {
    it('updates by matching library name (Go style)', () => {
      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.14.0'),
        packagePath: 'accessapproval',
      });
      const newContent = updater.updateContent(goContent);
      expect(newContent).to.eq(goContentUpdated);
    });

    it('updates by matching component name (Go style)', () => {
      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.14.0'),
        component: 'accessapproval',
      });
      const newContent = updater.updateContent(goContent);
      expect(newContent).to.eq(goContentUpdated);
    });

    it('updates by matching implicit output directory (Python/Node style)', () => {
      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.43.0'),
        packagePath: 'packages/google-cloud-storage',
      });
      const newContent = updater.updateContent(pythonContent);
      expect(newContent).to.eq(pythonContentUpdatedStorage);
    });

    it('updates by matching explicit output directory (Python/Node style)', () => {
      const updater = new LibrarianYamlUpdater({
        version: Version.parse('0.2.0'),
        packagePath: 'handwritten/handwritten-lib',
      });
      const newContent = updater.updateContent(pythonContent);
      expect(newContent).to.eq(pythonContentUpdatedHandwritten);
    });
  });

  describe('Multi-Version Match Logic (Java style)', () => {
    it('updates versions based on versionsMap', () => {
      const versionsMap = new Map<string, Version>();
      versionsMap.set('google-shopping-css', Version.parse('0.59.0'));
      versionsMap.set('google-cloud-secretmanager', Version.parse('2.2.0'));
      versionsMap.set('google-cloud-java', Version.parse('1.85.0'));

      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.0.0'), // Unused
        versionsMap,
      });
      const newContent = updater.updateContent(javaContent);
      expect(newContent).to.eq(javaContentUpdated);
    });

    it('returns original content if versionsMap is missing', () => {
      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.0.0'),
      });
      const newContent = updater.updateContent(javaContent);
      expect(newContent).to.equal(javaContent);
    });

    it('returns original content if no libraries match versionsMap', () => {
      const versionsMap = new Map<string, Version>();
      versionsMap.set('non-existent', Version.parse('1.0.0'));
      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.0.0'),
        versionsMap,
      });
      const newContent = updater.updateContent(javaContent);
      expect(newContent).to.equal(javaContent);
    });

    it('does not update released_version for SNAPSHOT versions', () => {
      const versionsMap = new Map<string, Version>();
      versionsMap.set('google-shopping-css', Version.parse('0.59.0-SNAPSHOT'));
      versionsMap.set(
        'google-cloud-secretmanager',
        Version.parse('2.2.0-SNAPSHOT')
      );
      versionsMap.set('google-cloud-java', Version.parse('1.85.0-SNAPSHOT'));

      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.0.0'), // Unused
        versionsMap,
      });
      const newContent = updater.updateContent(javaContent);
      expect(newContent).to.eq(snapshotUpdatedContent);
    });

    it('adds released_version if it is missing and new version is not SNAPSHOT', () => {
      const oldContentMissing = `language: java
libraries:
  - name: shopping-css
    version: 0.58.0
    java:
      artifact_id: google-shopping-css
`;
      const expectedContent = `language: java
libraries:
  - name: shopping-css
    version: 0.59.0
    java:
      artifact_id: google-shopping-css
      released_version: 0.59.0
`;
      const versionsMap = new Map<string, Version>();
      versionsMap.set('google-shopping-css', Version.parse('0.59.0'));

      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.0.0'),
        versionsMap,
      });
      const newContent = updater.updateContent(oldContentMissing);
      expect(newContent).to.eq(expectedContent);
    });

    it('creates java section and adds released_version if java section is missing and new version is not SNAPSHOT', () => {
      const oldContentMissingJava = `language: java
libraries:
  - name: shopping-css
    version: 0.58.0
`;
      const expectedContent = `language: java
libraries:
  - name: shopping-css
    version: 0.59.0
    java:
      released_version: 0.59.0
`;
      const versionsMap = new Map<string, Version>();
      versionsMap.set('google-cloud-shopping-css', Version.parse('0.59.0'));

      const updater = new LibrarianYamlUpdater({
        version: Version.parse('1.0.0'),
        versionsMap,
      });
      const newContent = updater.updateContent(oldContentMissingJava);
      expect(newContent).to.eq(expectedContent);
    });
  });
});
