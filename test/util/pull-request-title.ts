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

import {
  generateMatchPattern,
  PullRequestTitle,
} from '../../src/util/pull-request-title';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {Version} from '../../src/version';
import {MANIFEST_PULL_REQUEST_TITLE_PATTERN} from '../../src/manifest';

describe('PullRequestTitle', () => {
  describe('parse', () => {
    describe('autorelease branch name', () => {
      it('parses a versioned branch name', () => {
        const name = 'chore: release 1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(name);
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.be.undefined;
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
        expect(pullRequestTitle?.toString()).to.eql(name);
      });
      it('parses a versioned branch name with v', () => {
        const name = 'chore: release v1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(name);
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.be.undefined;
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
      });
      it('parses a versioned branch name with component', () => {
        const name = 'chore: release storage v1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(name);
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.eql('storage');
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
      });
    });

    it('parses a target branch', () => {
      const name = 'chore(main): release v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(name);
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.be.undefined;
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
    });

    it('parses a target branch and component', () => {
      const name = 'chore(main): release storage v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(name);
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.eql('storage');
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
    });

    it('parses a target branch and component with a slash', () => {
      const name = 'chore(main): release some/title-test 0.0.1';
      const pullRequestTitle = PullRequestTitle.parse(name);
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.eql('some/title-test');
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql('0.0.1');
    });

    it('fails to parse', () => {
      const pullRequestTitle = PullRequestTitle.parse('release-foo');
      expect(pullRequestTitle).to.be.undefined;
    });
  });
  describe('ofVersion', () => {
    it('builds the autorelease versioned branch name', () => {
      const pullRequestTitle = PullRequestTitle.ofVersion(
        Version.parse('1.2.3')
      );
      expect(pullRequestTitle.toString()).to.eql('chore: release 1.2.3');
    });
  });
  describe('ofComponentVersion', () => {
    it('builds the autorelease versioned branch name with component', () => {
      const pullRequestTitle = PullRequestTitle.ofComponentVersion(
        'storage',
        Version.parse('1.2.3')
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore: release storage 1.2.3'
      );
    });
  });
  describe('ofTargetBranch', () => {
    it('builds branchname with only target branch', () => {
      const pullRequestTitle = PullRequestTitle.ofTargetBranch('main');
      expect(pullRequestTitle.toString()).to.eql('chore(main): release');
    });
  });
  describe('ofTargetBranchVersion', () => {
    it('builds branchname with target branch and version', () => {
      const pullRequestTitle = PullRequestTitle.ofTargetBranchVersion(
        'main',
        Version.parse('1.2.3')
      );
      expect(pullRequestTitle.toString()).to.eql('chore(main): release 1.2.3');
    });
  });
  describe('ofComponentTargetBranch', () => {
    it('builds branchname with target branch and component', () => {
      const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
        'foo',
        'main',
        Version.parse('1.2.3')
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore(main): release foo 1.2.3'
      );
    });
  });
  describe('generateMatchPattern', () => {
    it('return matchPattern with default Pattern', () => {
      const matchPattern = generateMatchPattern();
      expect(matchPattern).to.eql(
        /^chore(\((?<branch>[\w-./]+)\))?: release ?(?<component>@?[\w-./]*)? v?(?<version>[0-9].*)$/
      );
    });
  });
});

describe('PullRequestTitle with custom pullRequestTitlePattern with SPACE in component', () => {
  describe('parse', () => {
    describe('autorelease branch name', () => {
      it('parses a versioned branch name', () => {
        const name = 'chore: 🔖 release 1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(
          name,
          'chore${scope}: 🔖 release${component} ${version}'
        );
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.be.undefined;
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
        expect(pullRequestTitle?.toString()).to.eql(name);
      });
      it('parses a versioned branch name with v', () => {
        const name = 'chore: 🔖 release v1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(
          name,
          'chore${scope}: 🔖 release${component} ${version}'
        );
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.be.undefined;
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
      });
      it('parses a versioned branch name with component', () => {
        const name = 'chore: 🔖 release storage v1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(
          name,
          'chore${scope}: 🔖 release${component} ${version}'
        );
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.eql('storage');
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
      });
    });

    it('parses a target branch', () => {
      const name = 'chore(main): 🔖 release v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(
        name,
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.be.undefined;
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
    });

    it('parses a target branch and component', () => {
      const name = 'chore(main): 🔖 release storage v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(
        name,
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.eql('storage');
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
    });

    it('parses a component with @ sign prefix', () => {
      const name = 'chore(main): 🔖 release @example/storage v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(
        name,
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getComponent()).to.eql('@example/storage');
    });

    it('fails to parse', () => {
      const pullRequestTitle = PullRequestTitle.parse(
        'release-foo',
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(pullRequestTitle).to.be.undefined;
    });

    it('parses a manifest title', () => {
      const name = 'chore: release main';
      const pullRequestTitle = PullRequestTitle.parse(
        name,
        MANIFEST_PULL_REQUEST_TITLE_PATTERN
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.be.undefined;
      expect(pullRequestTitle?.getVersion()).to.be.undefined;
    });

    it('parses a complex title and pattern', () => {
      const pullRequestTitle = PullRequestTitle.parse(
        '[HOTFIX] - chore(hotfix/v3.1.0-bug): release 3.1.0-hotfix1 (@example/storage)',
        '[HOTFIX] - chore${scope}: release ${version} (${component})'
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('hotfix/v3.1.0-bug');
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql(
        '3.1.0-hotfix1'
      );
      expect(pullRequestTitle?.getComponent()).to.eql('@example/storage');
    });
  });
  describe('ofVersion', () => {
    it('builds the autorelease versioned branch name', () => {
      const pullRequestTitle = PullRequestTitle.ofVersion(
        Version.parse('1.2.3'),
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(pullRequestTitle.toString()).to.eql('chore: 🔖 release 1.2.3');
    });
  });
  describe('ofComponentVersion', () => {
    it('builds the autorelease versioned branch name with component', () => {
      const pullRequestTitle = PullRequestTitle.ofComponentVersion(
        'storage',
        Version.parse('1.2.3'),
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore: 🔖 release storage 1.2.3'
      );
    });
  });
  describe('ofTargetBranch', () => {
    it('builds branchname with only target branch', () => {
      const pullRequestTitle = PullRequestTitle.ofTargetBranchVersion(
        'main',
        Version.parse('1.2.3'),
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore(main): 🔖 release 1.2.3'
      );
    });
  });
  describe('ofComponentTargetBranch', () => {
    it('builds branchname with target branch and component', () => {
      const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
        'foo',
        'main',
        Version.parse('1.2.3'),
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore(main): 🔖 release foo 1.2.3'
      );
    });
  });
  describe('generateMatchPattern', () => {
    it('return matchPattern with custom Pattern', () => {
      const matchPattern = generateMatchPattern(
        'chore${scope}: 🔖 release${component} ${version}'
      );
      expect(matchPattern).to.eql(
        /^chore(\((?<branch>[\w-./]+)\))?: 🔖 release ?(?<component>@?[\w-./]*)? v?(?<version>[0-9].*)$/
      );
    });

    // it('throw Error with custom Pattern missing ${scope}', () => {
    //   expect(() =>
    //     generateMatchPattern('chore: 🔖 release${component} ${version}')
    //   ).to.throw("pullRequestTitlePattern miss the part of '${scope}'");
    // });

    // it('throw Error with custom Pattern missing ${component}', () => {
    //   expect(() =>
    //     generateMatchPattern('chore${scope}: 🔖 release ${version}')
    //   ).to.throw("pullRequestTitlePattern miss the part of '${component}'");
    // });

    // it('throw Error with custom Pattern missing ${version}', () => {
    //   expect(() =>
    //     generateMatchPattern('chore${scope}: 🔖 release${component}')
    //   ).to.throw("pullRequestTitlePattern miss the part of '${version}'");
    // });
  });
});

describe('PullRequestTitle with custom pullRequestTitlePattern without SPACE in component', () => {
  describe('parse', () => {
    describe('autorelease branch name', () => {
      it('parses a versioned branch name', () => {
        const name = 'chore: 🔖 release 1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(
          name,
          'chore${scope}: 🔖 release ${component} ${version}',
          true
        );
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.be.undefined;
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
        expect(pullRequestTitle?.toString()).to.eql(name);
      });
      it('parses a versioned branch name with v', () => {
        const name = 'chore: 🔖 release v1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(
          name,
          'chore${scope}: 🔖 release ${component} ${version}',
          true
        );
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.be.undefined;
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
      });
      it('parses a versioned branch name with component', () => {
        const name = 'chore: 🔖 release storage v1.2.3';
        const pullRequestTitle = PullRequestTitle.parse(
          name,
          'chore${scope}: 🔖 release ${component} ${version}',
          true
        );
        expect(pullRequestTitle).to.not.be.undefined;
        expect(pullRequestTitle?.getTargetBranch()).to.be.undefined;
        expect(pullRequestTitle?.getComponent()).to.eql('storage');
        expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
      });
    });

    it('parses a target branch', () => {
      const name = 'chore(main): 🔖 release v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(
        name,
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.be.undefined;
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
    });
    it('parses a target branch and component', () => {
      const name = 'chore(main): 🔖 release storage v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(
        name,
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.eql('storage');
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql('1.2.3');
    });
    it('parses a component with @ sign prefix', () => {
      const name = 'chore(main): 🔖 release @example/storage v1.2.3';
      const pullRequestTitle = PullRequestTitle.parse(
        name,
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getComponent()).to.eql('@example/storage');
    });
    it('fails to parse', () => {
      const pullRequestTitle = PullRequestTitle.parse(
        'release-foo',
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(pullRequestTitle).to.be.undefined;
    });
    it('parses a manifest title', () => {
      const name = 'chore: release main';
      const pullRequestTitle = PullRequestTitle.parse(
        name,
        MANIFEST_PULL_REQUEST_TITLE_PATTERN,
        true
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('main');
      expect(pullRequestTitle?.getComponent()).to.be.undefined;
      expect(pullRequestTitle?.getVersion()).to.be.undefined;
    });
    it('parses a complex title and pattern', () => {
      const pullRequestTitle = PullRequestTitle.parse(
        '[HOTFIX] - chore(hotfix/v3.1.0-bug): release 3.1.0-hotfix1 (@example/storage)',
        '[HOTFIX] - chore${scope}: release ${version} (${component})',
        true
      );
      expect(pullRequestTitle).to.not.be.undefined;
      expect(pullRequestTitle?.getTargetBranch()).to.eql('hotfix/v3.1.0-bug');
      expect(pullRequestTitle?.getVersion()?.toString()).to.eql(
        '3.1.0-hotfix1'
      );
      expect(pullRequestTitle?.getComponent()).to.eql('@example/storage');
    });
  });

  describe('ofVersion', () => {
    it('builds the autorelease versioned branch name', () => {
      const pullRequestTitle = PullRequestTitle.ofVersion(
        Version.parse('1.2.3'),
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(pullRequestTitle.toString()).to.eql('chore: 🔖 release 1.2.3');
    });
  });

  describe('ofComponentVersion', () => {
    it('builds the autorelease versioned branch name with component', () => {
      const pullRequestTitle = PullRequestTitle.ofComponentVersion(
        'storage',
        Version.parse('1.2.3'),
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore: 🔖 release storage 1.2.3'
      );
    });
  });

  describe('ofTargetBranch', () => {
    it('builds branch name with only target branch', () => {
      const pullRequestTitle = PullRequestTitle.ofTargetBranchVersion(
        'main',
        Version.parse('1.2.3'),
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore(main): 🔖 release 1.2.3'
      );
    });
  });

  describe('ofComponentTargetBranch', () => {
    it('builds branch name with target branch and component', () => {
      const pullRequestTitle = PullRequestTitle.ofComponentTargetBranchVersion(
        'foo',
        'main',
        Version.parse('1.2.3'),
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(pullRequestTitle.toString()).to.eql(
        'chore(main): 🔖 release foo 1.2.3'
      );
    });
  });

  describe('generateMatchPattern', () => {
    it('return matchPattern with custom Pattern', () => {
      const matchPattern = generateMatchPattern(
        'chore${scope}: 🔖 release ${component} ${version}',
        true
      );
      expect(matchPattern).to.eql(
        /^chore(\((?<branch>[\w-./]+)\))?: 🔖 release ?(?<component>@?[\w-./]*)? v?(?<version>[0-9].*)$/
      );
    });
  });
});
