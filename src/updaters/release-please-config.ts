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

import {jsonStringify} from '../util/json-stringify';
import {Updater} from '../update';
import {
  ReleaserConfig,
  ManifestConfig,
  ReleaserPackageConfig,
} from '../manifest';

const SCHEMA_URL =
  'https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json';

interface ManifestConfigFile extends ManifestConfig {
  $schema?: string;
}

export class ReleasePleaseConfig implements Updater {
  path: string;
  config: ReleaserConfig;
  constructor(path: string, config: ReleaserConfig) {
    this.path = path;
    this.config = config;
  }
  updateContent(content: string): string {
    let parsed: ManifestConfigFile;
    if (content) {
      parsed = JSON.parse(content);
    } else {
      parsed = {packages: {}};
    }
    parsed['$schema'] = parsed['$schema'] ?? SCHEMA_URL;
    parsed.packages[this.path] = releaserConfigToJsonConfig(this.config);
    if (content) {
      return jsonStringify(parsed, content);
    } else {
      return JSON.stringify(parsed, null, 2);
    }
  }
}

function releaserConfigToJsonConfig(
  config: ReleaserConfig
): ReleaserPackageConfig {
  const jsonConfig: ReleaserPackageConfig = {
    'package-name': config.packageName,
    component: config.component,
    'changelog-path': config.changelogPath,
    'release-type': config.releaseType,
    'bump-minor-pre-major': config.bumpMinorPreMajor,
    'bump-patch-for-minor-pre-major': config.bumpPatchForMinorPreMajor,
    'changelog-sections': config.changelogSections,
    'release-as': config.releaseAs,
    'skip-github-release': config.skipGithubRelease,
    draft: config.draft,
    prerelease: config.prerelease,
    'draft-pull-request': config.draftPullRequest,
    label: config.labels?.join(','),
    'release-label': config.releaseLabels?.join(','),
    'prerelease-label': config.prereleaseLabels?.join(','),
    'include-component-in-tag': config.includeComponentInTag,
    'include-v-in-tag': config.includeVInTag,
    'changelog-type': config.changelogType,
    'changelog-host': config.changelogHost,
    'pull-request-title-pattern': config.pullRequestTitlePattern,
    'pull-request-header': config.pullRequestHeader,
    'separate-pull-requests': config.separatePullRequests,
    'tag-separator': config.tagSeparator,
    'extra-files': config.extraFiles,
    'version-file': config.versionFile,
    'snapshot-label': config.snapshotLabels?.join(','), // Java-only
  };
  return jsonConfig;
}
