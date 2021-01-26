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

type BranchNameType = typeof BranchName;

function getAllResourceNames(): BranchNameType[] {
  return [LegacyReleaseBranchName, ComponentBranchName, DefaultBranchName];
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(branchName: string) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static matches(branchName: string): boolean {
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
}

const LEGACY_PATTERN = /^release-?([\w-.]*)?-(v[0-9].*)$/;
class LegacyReleaseBranchName extends BranchName {
  static matches(branchName: string): boolean {
    return !!branchName.match(LEGACY_PATTERN);
  }
  constructor(branchName: string) {
    super(branchName);
    const match = branchName.match(LEGACY_PATTERN);
    if (match) {
      this.component = match[1];
      this.version = match[2];
    }
  }
}

const DEFAULT_PATTERN = /^release-please\/branches\/([^/]+)$/;
class DefaultBranchName extends BranchName {
  static matches(branchName: string): boolean {
    return !!branchName.match(DEFAULT_PATTERN);
  }
  constructor(branchName: string) {
    super(branchName);
    const match = branchName.match(DEFAULT_PATTERN);
    if (match) {
      this.targetBranch = match[1];
    }
  }
}

const COMPONENT_PATTERN = /^release-please\/branches\/([^/]+)\/components\/([^/]+)$/;
class ComponentBranchName extends BranchName {
  static matches(branchName: string): boolean {
    return !!branchName.match(COMPONENT_PATTERN);
  }
  constructor(branchName: string) {
    super(branchName);
    const match = branchName.match(COMPONENT_PATTERN);
    if (match) {
      this.targetBranch = match[1];
      this.component = match[2];
    }
  }
}
