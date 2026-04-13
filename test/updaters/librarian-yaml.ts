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
import {LibrarianYamlUpdater} from '../../src/updaters/java/librarian-yaml';
import {Version} from '../../src/version';

const oldContent = `language: java
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  java:
    libraries_bom_version: 26.79.0
libraries:
  - name: shopping-css
    version: 0.58.0
    apis:
      - path: google/shopping/css/v1
    java:
      api_description_override: The CSS API is used to manage your CSS and control your CSS Products portfolio
      non_cloud_api: true
      distribution_name_override: com.google.shopping:google-shopping-css
      name_pretty_override: CSS API
      java_apis:
        - additional_protos:
            - google/cloud/common_resources.proto
          path: google/shopping/css/v1
      product_documentation_override: https://developers.google.com/comparison-shopping-services/api
  - name: secretmanager
    version: 2.1.0
    java:
      api_description_override: allows you to encrypt, store, manage, and audit infrastructure and application-level secrets.
`;

const updatedContent = `language: java
sources:
  googleapis:
    commit: cd090841ab172574e740c214c99df00aef9c0dee
    sha256: 08e4b7744dc23b6e3320a3f1d05db9f40853aaf1089d06bfb8d79044b7a66f21
default:
  java:
    libraries_bom_version: 26.79.0
libraries:
  - name: shopping-css
    version: 0.59.0
    apis:
      - path: google/shopping/css/v1
    java:
      api_description_override: The CSS API is used to manage your CSS and control your CSS Products portfolio
      non_cloud_api: true
      distribution_name_override: com.google.shopping:google-shopping-css
      name_pretty_override: CSS API
      java_apis:
        - additional_protos:
            - google/cloud/common_resources.proto
          path: google/shopping/css/v1
      product_documentation_override: https://developers.google.com/comparison-shopping-services/api
  - name: secretmanager
    version: 2.2.0
    java:
      api_description_override: allows you to encrypt, store, manage, and audit infrastructure and application-level secrets.
`;

describe('LibrarianYamlUpdater', () => {
  it('updates librarian.yaml version based on versionsMap', () => {
    const versionsMap = new Map<string, Version>();
    versionsMap.set('google-shopping-css', Version.parse('0.59.0'));
    versionsMap.set('google-cloud-secretmanager', Version.parse('2.2.0'));

    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'), // Unused
      versionsMap,
    });
    const newContent = updater.updateContent(oldContent);

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
