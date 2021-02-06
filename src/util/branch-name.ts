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
import {RELEASE_PLEASE} from '../constants';

type BranchNameType = typeof BranchName;

function getAllResourceNames(): BranchNameType[] {
  return [AutoreleaseBranchName, ComponentBranchName, DefaultBranchName];
}

export class BranchName {
  component?: string;
  targetBranch?: string;
  version?: string;

  static parse(branchName: string): BranchName | undefined {
    const branchNameClass = getAllResourceNames().find(clazz => {
      return clazz.matches(branchName);
    });
    if (!branchNameClass) {
      return undefined;
    }
    return new branchNameClass(branchName);
  }
  static ofComponentVersion(branchPrefix: string, version: string): BranchName {
    return new AutoreleaseBranchName(`release-${branchPrefix}-v${version}`);
  }
  static ofVersion(version: string): BranchName {
    return new AutoreleaseBranchName(`release-v${version}`);
  }
  static ofTargetBranch(targetBranch: string): BranchName {
    return new DefaultBranchName(`${RELEASE_PLEASE}/branches/${targetBranch}`);
  }
  static ofComponentTargetBranch(
    component: string,
    targetBranch: string
  ): BranchName {
    return new ComponentBranchName(
      `${RELEASE_PLEASE}/branches/${targetBranch}/components/${component}`
    );
  }
  constructor(_branchName: string) {}

  static matches(_branchName: string): boolean {
    return false;
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
    return '';
  }
}

const AUTORELEASE_PATTERN = /^release-?(?<component>[\w-.]*)?-v(?<version>[0-9].*)$/;
class AutoreleaseBranchName extends BranchName {
  static matches(branchName: string): boolean {
    return !!branchName.match(AUTORELEASE_PATTERN);
  }
  constructor(branchName: string) {
    super(branchName);
    const match = branchName.match(AUTORELEASE_PATTERN);
    if (match?.groups) {
      this.component = match.groups['component'];
      this.version = match.groups['version'];
    }
  }
  toString(): string {
    if (this.component) {
      return `release-${this.component}-v${this.version}`;
    }
    return `release-v${this.version}`;
  }
}

const DEFAULT_PATTERN = `^${RELEASE_PLEASE}/branches/(?<branch>[^/]+)$`;
class DefaultBranchName extends BranchName {
  static matches(branchName: string): boolean {
    return !!branchName.match(DEFAULT_PATTERN);
  }
  constructor(branchName: string) {
    super(branchName);
    const match = branchName.match(DEFAULT_PATTERN);
    if (match?.groups) {
      this.targetBranch = match.groups['branch'];
    }
  }
  toString(): string {
    return `${RELEASE_PLEASE}/branches/${this.targetBranch}`;
  }
}

const COMPONENT_PATTERN = `^${RELEASE_PLEASE}/branches/(?<branch>[^/]+)/components/(?<component>[^/]+)$`;
class ComponentBranchName extends BranchName {
  static matches(branchName: string): boolean {
    return !!branchName.match(COMPONENT_PATTERN);
  }
  constructor(branchName: string) {
    super(branchName);
    const match = branchName.match(COMPONENT_PATTERN);
    if (match?.groups) {
      this.targetBranch = match.groups['branch'];
      this.component = match.groups['component'];
    }
  }
  toString(): string {
    return `${RELEASE_PLEASE}/branches/${this.targetBranch}/components/${this.component}`;
  }
}
