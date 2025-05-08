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

import {logger as defaultLogger, Logger} from './logger';
import {Version} from '../version';

// cannot import from '..' - transpiled code references to RELEASE_PLEASE
// at the script level are undefined, they are only defined inside function
// or instance methods/properties.

const DEFAULT_PR_TITLE_PATTERN =
  'chore${scope}: release${component} ${version}';
const COMPONENT_NO_SPACE = false;

export function generateMatchPattern(
  pullRequestTitlePattern?: string,
  componentNoSpace?: boolean,
  logger: Logger = defaultLogger
): RegExp {
  if (
    pullRequestTitlePattern &&
    pullRequestTitlePattern.search(/\$\{scope\}/) === -1
  )
    logger.warn("pullRequestTitlePattern miss the part of '${scope}'");
  if (
    pullRequestTitlePattern &&
    pullRequestTitlePattern.search(/\$\{component\}/) === -1
  )
    logger.warn("pullRequestTitlePattern miss the part of '${component}'");
  if (
    pullRequestTitlePattern &&
    pullRequestTitlePattern.search(/\$\{version\}/) === -1
  )
    logger.warn("pullRequestTitlePattern miss the part of '${version}'");
  return new RegExp(
    `^${(pullRequestTitlePattern || DEFAULT_PR_TITLE_PATTERN)
      .replace('[', '\\[') // TODO: handle all regex escaping
      .replace(']', '\\]')
      .replace('(', '\\(')
      .replace(')', '\\)')
      .replace('${scope}', '(\\((?<branch>[\\w-./]+)\\))?')
      .replace(
        '${component}',
        componentNoSpace === true
          ? '?(?<component>@?[\\w-./]*)?'
          : ' ?(?<component>@?[\\w-./]*)?'
      )
      .replace('${version}', 'v?(?<version>[0-9].*)')
      .replace('${branch}', '(?<branch>[\\w-./]+)?')}$`
  );
}

export class PullRequestTitle {
  component?: string;
  targetBranch?: string;
  version?: Version;
  pullRequestTitlePattern: string;
  matchPattern: RegExp;
  componentNoSpace?: boolean;

  private constructor(opts: {
    version?: Version;
    component?: string;
    targetBranch?: string;
    pullRequestTitlePattern?: string;
    componentNoSpace?: boolean;
    logger?: Logger;
  }) {
    this.version = opts.version;
    this.component = opts.component;
    this.targetBranch = opts.targetBranch;
    this.pullRequestTitlePattern =
      opts.pullRequestTitlePattern || DEFAULT_PR_TITLE_PATTERN;
    this.componentNoSpace = opts.componentNoSpace || COMPONENT_NO_SPACE;
    this.matchPattern = generateMatchPattern(
      this.pullRequestTitlePattern,
      this.componentNoSpace,
      opts.logger
    );
  }

  static parse(
    title: string,
    pullRequestTitlePattern?: string,
    componentNoSpace?: boolean,
    logger: Logger = defaultLogger
  ): PullRequestTitle | undefined {
    const matchPattern = generateMatchPattern(
      pullRequestTitlePattern,
      componentNoSpace,
      logger
    );
    const match = title.match(matchPattern);
    if (match?.groups) {
      return new PullRequestTitle({
        version: match.groups['version']
          ? Version.parse(match.groups['version'])
          : undefined,
        component: match.groups['component'],
        targetBranch: match.groups['branch'],
        pullRequestTitlePattern,
        componentNoSpace,
        logger,
      });
    }
    return undefined;
  }

  static ofComponentVersion(
    component: string,
    version: Version,
    pullRequestTitlePattern?: string,
    componentNoSpace?: boolean
  ): PullRequestTitle {
    return new PullRequestTitle({
      version,
      component,
      pullRequestTitlePattern,
      componentNoSpace,
    });
  }
  static ofVersion(
    version: Version,
    pullRequestTitlePattern?: string,
    componentNoSpace?: boolean
  ): PullRequestTitle {
    return new PullRequestTitle({
      version,
      pullRequestTitlePattern,
      componentNoSpace,
    });
  }
  static ofTargetBranchVersion(
    targetBranch: string,
    version: Version,
    pullRequestTitlePattern?: string,
    componentNoSpace?: boolean
  ): PullRequestTitle {
    return new PullRequestTitle({
      version,
      targetBranch,
      pullRequestTitlePattern,
      componentNoSpace,
    });
  }
  static ofComponentTargetBranchVersion(
    component?: string,
    targetBranch?: string,
    version?: Version,
    pullRequestTitlePattern?: string,
    componentNoSpace?: boolean
  ): PullRequestTitle {
    return new PullRequestTitle({
      version,
      component,
      targetBranch,
      pullRequestTitlePattern,
      componentNoSpace,
    });
  }
  static ofTargetBranch(
    targetBranch: string,
    pullRequestTitlePattern?: string,
    componentNoSpace?: boolean
  ): PullRequestTitle {
    return new PullRequestTitle({
      targetBranch,
      pullRequestTitlePattern,
      componentNoSpace,
    });
  }

  getTargetBranch(): string | undefined {
    return this.targetBranch;
  }
  getComponent(): string | undefined {
    return this.component;
  }
  getVersion(): Version | undefined {
    return this.version;
  }

  toString(): string {
    const scope = this.targetBranch ? `(${this.targetBranch})` : '';
    const component =
      this.componentNoSpace === true
        ? this.component
          ? `${this.component}`
          : ''
        : this.component
        ? ` ${this.component}`
        : '';
    const version = this.version ?? '';
    if (this.componentNoSpace === true && !component) {
      console.log(
        '`component` is empty. Removing component from title pattern..'
      );
      this.pullRequestTitlePattern = this.pullRequestTitlePattern.replace(
        '${component} ',
        ''
      );
    }

    return this.pullRequestTitlePattern
      .replace('${scope}', scope)
      .replace('${component}', component)
      .replace('${version}', version.toString())
      .replace('${branch}', this.targetBranch || '')
      .trim();
  }
}
