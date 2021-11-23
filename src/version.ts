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

const VERSION_REGEX =
  /(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<preRelease>[^+]+))?(\+(?<build>.*))?/;

export class Version {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
  build?: string;

  constructor(
    major: number,
    minor: number,
    patch: number,
    preRelease?: string,
    build?: string
  ) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.preRelease = preRelease;
    this.build = build;
  }

  static parse(versionString: string): Version {
    const match = versionString.match(VERSION_REGEX);
    if (!match?.groups) {
      throw Error(`unable to parse version string: ${versionString}`);
    }
    const major = Number(match.groups.major);
    const minor = Number(match.groups.minor);
    const patch = Number(match.groups.patch);
    const preRelease = match.groups.preRelease;
    const build = match.groups.build;
    return new Version(major, minor, patch, preRelease, build);
  }

  toString(): string {
    const preReleasePart = this.preRelease ? `-${this.preRelease}` : '';
    const buildPart = this.build ? `+${this.build}` : '';
    return `${this.major}.${this.minor}.${this.patch}${preReleasePart}${buildPart}`;
  }
}

export type VersionsMap = Map<string, Version>;
