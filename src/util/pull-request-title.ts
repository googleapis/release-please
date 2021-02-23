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

// cannot import from '..' - transpiled code references to RELEASE_PLEASE
// at the script level are undefined, they are only defined inside function
// or instance methods/properties.

const DEFAULT_PATTERN = /^chore(\((?<branch>[\w-.]+)\))?: release ?(?<component>[\w-.]*)? v?(?<version>[0-9].*)$/;
export class PullRequestTitle {
  component?: string;
  targetBranch?: string;
  version: string;

  private constructor(opts: {
    version: string;
    component?: string;
    targetBranch?: string;
  }) {
    this.version = opts.version;
    this.component = opts.component;
    this.targetBranch = opts.targetBranch;
  }

  static parse(title: string): PullRequestTitle | undefined {
    const match = title.match(DEFAULT_PATTERN);
    if (match?.groups) {
      return new PullRequestTitle({
        version: match.groups['version'],
        component: match.groups['component'],
        targetBranch: match.groups['branch'],
      });
    }
    return undefined;
  }

  static create(_title: string): PullRequestTitle | undefined {
    return undefined;
  }

  static ofComponentVersion(
    component: string,
    version: string
  ): PullRequestTitle {
    return new PullRequestTitle({version, component});
  }
  static ofVersion(version: string): PullRequestTitle {
    return new PullRequestTitle({version});
  }
  static ofTargetBranchVersion(
    targetBranch: string,
    version: string
  ): PullRequestTitle {
    return new PullRequestTitle({version, targetBranch});
  }
  static ofComponentTargetBranchVersion(
    component: string,
    targetBranch: string,
    version: string
  ): PullRequestTitle {
    return new PullRequestTitle({version, component, targetBranch});
  }

  getTargetBranch(): string | undefined {
    return this.targetBranch;
  }
  getComponent(): string | undefined {
    return this.component;
  }
  getVersion(): string | undefined {
    return this.version;
  }
  toString(): string {
    const scope = this.targetBranch ? `(${this.targetBranch})` : '';
    const component = this.component ? ` ${this.component}` : '';
    return `chore${scope}: release${component} ${this.version}`;
  }
}
