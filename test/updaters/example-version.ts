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

import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as snapshot from 'snap-shot-it';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {ExampleVersion} from '../../src/updaters/terraform/example-version';
import {Version} from '../../src/version';

const fixturesPath = './test/updaters/fixtures/terraform-module';

describe('example.tf', () => {
  describe('updateContent', () => {
    it('updates version in example.tf', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './example.tf'),
        'utf8'
      ).replace(/\r\n/g, '\n');
      const version = new ExampleVersion({
        version: Version.parse('2.1.0'),
        moduleName: 'kubernetes-engine',
        provider: 'google',
      });
      const newContent = version.updateContent(oldContent);
      snapshot(newContent);
    });

    it('leaves other third-party modules untouched while updating multiple target module blocks', async () => {
      const content = `
module "enabled_google_apis" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "~> 18.0"
}

module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/beta-public-cluster"
  version = "~> 46.0"
}

module "wi" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/workload-identity"
  version = "~> 46.0"
}
`;
      const version = new ExampleVersion({
        version: Version.parse('47.1.0'),
        moduleName: 'kubernetes-engine',
        provider: 'google',
      });
      const updated = version.updateContent(content);
      expect(updated).to.include('version = "~> 18.0"');
      expect(updated).to.include(
        'source  = "terraform-google-modules/kubernetes-engine/google//modules/beta-public-cluster"\n  version = "~> 47.1"'
      );
      expect(updated).to.include(
        'source  = "terraform-google-modules/kubernetes-engine/google//modules/workload-identity"\n  version = "~> 47.1"'
      );
    });

    it('ignores commented-out module blocks and heredocs', async () => {
      const content = `
# module "commented_out" {
#   source = "terraform-google-modules/kubernetes-engine/google"
#   version = "~> 1.0"
# }

// module "double_slash" {
//   source = "terraform-google-modules/kubernetes-engine/google"
//   version = "~> 1.0"
// }

/*
module "block_comment" {
  source = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 1.0"
}
*/

locals {
  doc = <<-EOF
module "heredoc_sample" {
  source = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 1.0"
}
EOF
}

module "active" {
  source = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 1.0"
}
`;
      const version = new ExampleVersion({
        version: Version.parse('2.3.0'),
        moduleName: 'kubernetes-engine',
        provider: 'google',
      });
      const updated = version.updateContent(content);
      expect(updated).to.include('#   version = "~> 1.0"');
      expect(updated).to.include('//   version = "~> 1.0"');
      expect(updated).to.include('version = "~> 1.0"\n}\n*/');
      expect(updated).to.include('version = "~> 1.0"\n}\nEOF');
      expect(updated).to.include(
        'module "active" {\n  source = "terraform-google-modules/kubernetes-engine/google"\n  version = "~> 2.3"\n}'
      );
    });

    it('handles string interpolations containing quotes and braces', async () => {
      const content = `
locals {
  complex = "\${lookup(var.map, "}")}"
}

module "active" {
  source = "terraform-google-modules/kubernetes-engine/google"
  name = "\${lookup(var.map, "}")}"
  version = "~> 1.0"
}
`;
      const version = new ExampleVersion({
        version: Version.parse('2.0.0'),
        moduleName: 'kubernetes-engine',
        provider: 'google',
      });
      const updated = version.updateContent(content);
      expect(updated).to.include('version = "~> 2.0"');
      expect(updated).to.include('name = "${lookup(var.map, "}")}"');
    });

    it('ignores hyphenated version attributes like x-goog-version and nested map version keys', async () => {
      const content = `
module "active" {
  source = "terraform-google-modules/kubernetes-engine/google"
  x-goog-version = "~> 1.0"
  secret_environment_variables = [
    {
      key = "version"
      version = "~> 1.0"
    }
  ]
  version = "~> 1.0"
}
`;
      const version = new ExampleVersion({
        version: Version.parse('2.0.0'),
        moduleName: 'kubernetes-engine',
        provider: 'google',
      });
      const updated = version.updateContent(content);
      expect(updated).to.include('x-goog-version = "~> 1.0"');
      expect(updated).to.include('version = "~> 1.0"\n    }\n  ]');
      expect(updated).to.include('version = "~> 2.0"\n}');
    });

    it('safely returns content unchanged when moduleName or provider is undefined', async () => {
      const content = `
module "active" {
  source = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 1.0"
}
`;
      const noModule = new ExampleVersion({
        version: Version.parse('2.0.0'),
        provider: 'google',
      });
      expect(noModule.updateContent(content)).to.equal(content);

      const noProvider = new ExampleVersion({
        version: Version.parse('2.0.0'),
        moduleName: 'kubernetes-engine',
      });
      expect(noProvider.updateContent(content)).to.equal(content);

      const neither = new ExampleVersion({
        version: Version.parse('2.0.0'),
      });
      expect(neither.updateContent(content)).to.equal(content);
    });

    it('escapes regex metacharacters in moduleName and provider', async () => {
      const content = `
module "active" {
  source = "terraform-google-modules/my-module.v2/google+beta"
  version = "~> 1.0"
}

module "other" {
  source = "terraform-google-modules/my-modulexv2/google1beta"
  version = "~> 1.0"
}
`;
      const version = new ExampleVersion({
        version: Version.parse('2.0.0'),
        moduleName: 'my-module.v2',
        provider: 'google+beta',
      });
      const updated = version.updateContent(content);
      expect(updated).to.include(
        'source = "terraform-google-modules/my-module.v2/google+beta"\n  version = "~> 2.0"'
      );
      expect(updated).to.include(
        'source = "terraform-google-modules/my-modulexv2/google1beta"\n  version = "~> 1.0"'
      );
    });
  });
});
