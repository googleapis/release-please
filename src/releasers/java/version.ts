// Copyright 2020 Google LLC
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

import {BumpType} from './bump_type';

const VERSION_REGEX = /(\d+)\.(\d+)\.(\d+)(-\w+)?(-SNAPSHOT)?/;
export class Version {
  major: number;
  minor: number;
  patch: number;
  extra: string;
  snapshot: boolean;

  constructor(
    major: number,
    minor: number,
    patch: number,
    extra: string,
    snapshot: boolean
  ) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.extra = extra;
    this.snapshot = snapshot;
  }

  static parse(version: string): Version {
    const match = version.match(VERSION_REGEX);
    if (!match) {
      throw Error(`unable to parse version string: ${version}`);
    }
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    let extra = '';
    let snapshot = false;
    if (match[5]) {
      extra = match[4];
      snapshot = match[5] === '-SNAPSHOT';
    } else if (match[4]) {
      if (match[4] === '-SNAPSHOT') {
        snapshot = true;
      } else {
        extra = match[4];
      }
    }
    return new Version(major, minor, patch, extra, snapshot);
  }

  bump(bumpType: BumpType): Version {
    switch (bumpType) {
      case 'major':
        this.major += 1;
        this.minor = 0;
        this.patch = 0;
        this.snapshot = false;
        break;
      case 'minor':
        this.minor += 1;
        this.patch = 0;
        this.snapshot = false;
        break;
      case 'patch':
        this.patch += 1;
        this.snapshot = false;
        break;
      case 'snapshot':
        this.patch += 1;
        this.snapshot = true;
        break;
      default:
        throw Error(`unsupported bump type: ${bumpType}`);
    }
    return this;
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}${this.extra}${
      this.snapshot ? '-SNAPSHOT' : ''
    }`;
  }
}
