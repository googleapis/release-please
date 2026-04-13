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

const oldContent = `image: gcr.io/my-special-project/language-generator:v1.2.5
libraries:
  - id: google-cloud-storage-v1
    version: 1.15.0
    last_generated_commit: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
  - id: google-cloud-vision-v1
    version: 2.1.0
`;

describe('LibrarianYamlUpdater', () => {
  it('updates librarian.yaml version based on versionsMap', () => {
    const versionsMap = new Map<string, Version>();
    versionsMap.set('google-cloud-storage-v1', Version.parse('1.16.0'));
    
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'), // Unused
      versionsMap,
    });
    const newContent = updater.updateContent(oldContent);

    expect(newContent).to.include('id: google-cloud-storage-v1\n    version: 1.16.0');
    expect(newContent).to.include('id: google-cloud-vision-v1\n    version: 2.1.0');
  });

  it('returns original content if versionsMap is missing', () => {
    const updater = new LibrarianYamlUpdater({
      version: Version.parse('1.0.0'),
    });
    const newContent = updater.updateContent(oldContent);
    expect(newContent).to.equal(oldContent);
  });
});
