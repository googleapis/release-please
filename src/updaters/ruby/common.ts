// Copyright 2022 Google LLC
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

import {Version} from '../../version';

// Ruby gem semver strings using `.` seperator for prereleases rather then `-`
// See https://guides.rubygems.org/patterns/

export const RUBY_VERSION_REGEX = /((\d+).(\d)+.(\d+)(.\w+.*)?)/g;

/**
 * Stringify a version to a ruby compatible version string
 *
 * @param version The version to stringify
 * @param useDotPrePreleaseSeperator Use a `.` seperator for prereleases rather then `-`
 * @returns a ruby compatible version string
 */
export function stringifyRubyVersion(
  version: Version,
  useDotPrePreleaseSeperator = false
) {
  if (!useDotPrePreleaseSeperator) {
    return version.toString();
  }

  return `${version.major}.${version.minor}.${version.patch}${
    version.preRelease ? `.${version.preRelease}` : ''
  }`;
}

/**
 * This function mimics Gem::Version parsing of version semver strings
 *
 * @param versionString The version string to resolve
 * @returns A Gem::Version compatible version string
 */
export function resolveRubyGemfileLockVersion(versionString: string) {
  // Replace `-` with `.pre.` as per ruby gem parsing
  // See https://github.com/rubygems/rubygems/blob/master/lib/rubygems/version.rb#L229
  return versionString.replace(/-/g, '.pre.');
}
