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

const DEFAULT_PR_TITLE_PATTERN =
  'chore${scope}: release${component} ${version}';
export function generateMatchPattern(PRTitlePattern?: string): RegExp {
  if (PRTitlePattern && PRTitlePattern.search(/\$\{scope\}/) === -1)
    throw Error("PRTitlePattern miss the part of '${scope}'");
  if (PRTitlePattern && PRTitlePattern.search(/\$\{component\}/) === -1)
    throw Error("PRTitlePattern miss the part of '${component}'");
  if (PRTitlePattern && PRTitlePattern.search(/\$\{version\}/) === -1)
    throw Error("PRTitlePattern miss the part of '${version}'");
  return new RegExp(
    `^${(PRTitlePattern || DEFAULT_PR_TITLE_PATTERN)
      .replace('${scope}', '(\\((?<branch>[\\w-.]+)\\))?')
      .replace('${component}', ' ?(?<component>[\\w-.]*)?')
      .replace('${version}', 'v?(?<version>[0-9].*)')}$`
  );
}

export class PullRequestTitle {
  component?: string;
  targetBranch?: string;
  version: string;
  PRTitlePattern: string;
  matchPattern: RegExp;

  private constructor(opts: {
    version: string;
    component?: string;
    targetBranch?: string;
    PRTitlePattern?: string;
  }) {
    this.version = opts.version;
    this.component = opts.component;
    this.targetBranch = opts.targetBranch;
    this.PRTitlePattern = opts.PRTitlePattern || DEFAULT_PR_TITLE_PATTERN;
    this.matchPattern = generateMatchPattern(this.PRTitlePattern);
  }

  static parse(
    title: string,
    PRTitlePattern?: string
  ): PullRequestTitle | undefined {
    const matchPattern = generateMatchPattern(PRTitlePattern);
    const match = title.match(matchPattern);
    if (match?.groups) {
      return new PullRequestTitle({
        version: match.groups['version'],
        component: match.groups['component'],
        targetBranch: match.groups['branch'],
        PRTitlePattern: PRTitlePattern,
      });
    }
    return undefined;
  }

  static ofComponentVersion(
    component: string,
    version: string,
    PRTitlePattern?: string
  ): PullRequestTitle {
    return new PullRequestTitle({version, component, PRTitlePattern});
  }
  static ofVersion(version: string, PRTitlePattern?: string): PullRequestTitle {
    return new PullRequestTitle({version, PRTitlePattern});
  }
  static ofTargetBranchVersion(
    targetBranch: string,
    version: string,
    PRTitlePattern?: string
  ): PullRequestTitle {
    return new PullRequestTitle({version, targetBranch, PRTitlePattern});
  }
  static ofComponentTargetBranchVersion(
    component: string,
    targetBranch: string,
    version: string,
    PRTitlePattern?: string
  ): PullRequestTitle {
    return new PullRequestTitle({
      version,
      component,
      targetBranch,
      PRTitlePattern,
    });
  }

  getTargetBranch(): string | undefined {
    return this.targetBranch;
  }
  getComponent(): string | undefined {
    return this.component;
  }
  getVersion(): string {
    return this.version;
  }

  toString(): string {
    const scope = this.targetBranch ? `(${this.targetBranch})` : '';
    const component = this.component ? ` ${this.component}` : '';
    return this.PRTitlePattern.replace('${scope}', scope)
      .replace('${component}', component)
      .replace('${version}', this.getVersion());
  }
}
