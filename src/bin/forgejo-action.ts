// Copyright 2026 Google LLC
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

// Entry point of the Forgejo Actions composite action (see action.yml).
// Mirrors googleapis/release-please-action, backed by the Forgejo Scm.

import * as fs from 'fs';
import * as crypto from 'crypto';
import {Forgejo, FORGEJO_API_PATH} from '../forgejo';
import {Manifest, CreatedRelease} from '../manifest';
import {PullRequest} from '../pull-request';
import {logger} from '../util/logger';

const DEFAULT_CONFIG_FILE = 'release-please-config.json';
const DEFAULT_MANIFEST_FILE = '.release-please-manifest.json';

type Env = Record<string, string | undefined>;

export interface ActionInputs {
  token: string;
  repoUrl: string;
  apiUrl: string;
  releaseType?: string;
  path?: string;
  targetBranch?: string;
  configFile: string;
  manifestFile: string;
  skipGitHubRelease?: boolean;
  skipGitHubPullRequest?: boolean;
  skipLabeling?: boolean;
  includeComponentInTag?: boolean;
  changelogHost?: string;
  versioningStrategy?: string;
  releaseAs?: string;
  wipPrefix?: string;
}

/**
 * Read an input the way `@actions/core` does, but also accept `_` instead
 * of `-` (composite actions pass inputs as explicitly mapped env vars).
 */
function getInput(env: Env, name: string): string {
  const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  return (env[key] ?? env[key.replace(/-/g, '_')] ?? '').trim();
}

function getOptionalInput(env: Env, name: string): string | undefined {
  return getInput(env, name) || undefined;
}

function getOptionalBooleanInput(env: Env, name: string): boolean | undefined {
  const value = getInput(env, name);
  if (!value) {
    return undefined;
  }
  if (['true', 'True', 'TRUE'].includes(value)) {
    return true;
  }
  if (['false', 'False', 'FALSE'].includes(value)) {
    return false;
  }
  throw new TypeError(
    `Input does not meet YAML 1.2 "Core Schema" specification: ${name}`
  );
}

export function parseInputs(env: Env): ActionInputs {
  const token = getInput(env, 'token');
  if (!token) {
    throw new Error('Input required and not supplied: token');
  }
  const serverUrl = env.GITHUB_SERVER_URL?.replace(/\/+$/, '');
  const apiUrl =
    getInput(env, 'api-url') ||
    env.GITHUB_API_URL ||
    (serverUrl ? `${serverUrl}${FORGEJO_API_PATH}` : '');
  if (!apiUrl) {
    throw new Error('Input required and not supplied: api-url');
  }
  return {
    token,
    repoUrl: getInput(env, 'repo-url') || env.GITHUB_REPOSITORY || '',
    apiUrl,
    releaseType: getOptionalInput(env, 'release-type'),
    path: getOptionalInput(env, 'path'),
    targetBranch: getOptionalInput(env, 'target-branch'),
    configFile: getInput(env, 'config-file') || DEFAULT_CONFIG_FILE,
    manifestFile: getInput(env, 'manifest-file') || DEFAULT_MANIFEST_FILE,
    skipGitHubRelease: getOptionalBooleanInput(env, 'skip-github-release'),
    skipGitHubPullRequest: getOptionalBooleanInput(
      env,
      'skip-github-pull-request'
    ),
    skipLabeling: getOptionalBooleanInput(env, 'skip-labeling'),
    includeComponentInTag: getOptionalBooleanInput(
      env,
      'include-component-in-tag'
    ),
    changelogHost: getOptionalInput(env, 'changelog-host'),
    versioningStrategy: getOptionalInput(env, 'versioning-strategy'),
    releaseAs: getOptionalInput(env, 'release-as'),
    wipPrefix: getOptionalInput(env, 'wip-prefix'),
  };
}

async function loadOrBuildManifest(
  forgejo: Forgejo,
  inputs: ActionInputs
): Promise<Manifest> {
  const targetBranch = inputs.targetBranch || forgejo.repository.defaultBranch;
  if (inputs.releaseType) {
    logger.debug('Building manifest from config');
    return Manifest.fromConfig(
      forgejo,
      targetBranch,
      {
        releaseType: inputs.releaseType,
        includeComponentInTag: inputs.includeComponentInTag,
        changelogHost: inputs.changelogHost,
        versioning: inputs.versioningStrategy,
        releaseAs: inputs.releaseAs,
      },
      {
        skipLabeling: inputs.skipLabeling,
      },
      inputs.path
    );
  }
  logger.debug('Loading manifest from config file');
  const manifest = await Manifest.fromManifest(
    forgejo,
    targetBranch,
    inputs.configFile,
    inputs.manifestFile,
    inputs.skipLabeling ? {skipLabeling: inputs.skipLabeling} : {}
  );
  // Without an explicit changelog host the Forgejo web URL is used.
  if (inputs.changelogHost) {
    for (const path in manifest.repositoryConfig) {
      manifest.repositoryConfig[path].changelogHost = inputs.changelogHost;
    }
  }
  return manifest;
}

/**
 * Collects step outputs and writes them to the `$GITHUB_OUTPUT` file.
 */
export class ActionOutputs {
  readonly values: Record<string, string> = {};

  set(key: string, value: unknown) {
    this.values[key] =
      typeof value === 'string' ? value : JSON.stringify(value ?? '');
  }

  write(outputFile: string | undefined) {
    const lines: string[] = [];
    for (const [key, value] of Object.entries(this.values)) {
      const delimiter = `ghadelimiter_${crypto.randomUUID()}`;
      lines.push(`${key}<<${delimiter}`, value, delimiter);
      logger.info(`output ${key}=${value}`);
    }
    if (outputFile) {
      fs.appendFileSync(outputFile, lines.join('\n') + '\n', {
        encoding: 'utf8',
      });
    } else {
      logger.warn('GITHUB_OUTPUT is not set, outputs are only logged');
    }
  }
}

function setPathOutput(
  outputs: ActionOutputs,
  path: string,
  key: string,
  value: unknown
) {
  // Composite actions only expose declared outputs, so only the root
  // path gets individual outputs. All releases are available in `releases`.
  if (path === '.') {
    outputs.set(key, value);
  }
}

const RELEASE_OUTPUT_KEYS: Record<string, string> = {
  tagName: 'tag_name',
  uploadUrl: 'upload_url',
  notes: 'body',
  url: 'html_url',
  prNumber: 'pr_number',
};

export function outputReleases(
  outputs: ActionOutputs,
  releases: (CreatedRelease | undefined)[]
) {
  const created = releases.filter(
    (release): release is CreatedRelease => release !== undefined
  );
  const pathsReleased: string[] = [];
  outputs.set('releases_created', created.length > 0);
  for (const release of created) {
    const path = release.path || '.';
    pathsReleased.push(path);
    setPathOutput(outputs, path, 'release_created', true);
    for (const [rawKey, value] of Object.entries(release)) {
      setPathOutput(
        outputs,
        path,
        RELEASE_OUTPUT_KEYS[rawKey] ?? rawKey,
        value
      );
    }
  }
  outputs.set('paths_released', pathsReleased);
  outputs.set(
    'releases',
    created.map(release => {
      const renamed: Record<string, unknown> = {};
      for (const [rawKey, value] of Object.entries(release)) {
        renamed[RELEASE_OUTPUT_KEYS[rawKey] ?? rawKey] = value;
      }
      return renamed;
    })
  );
}

export function outputPullRequests(
  outputs: ActionOutputs,
  pullRequests: (PullRequest | undefined)[]
) {
  const created = pullRequests.filter(
    (pullRequest): pullRequest is PullRequest => pullRequest !== undefined
  );
  outputs.set('prs_created', created.length > 0);
  if (created.length) {
    outputs.set('pr', created[0]);
    outputs.set('prs', created);
  }
}

export async function main(env: Env = process.env) {
  const inputs = parseInputs(env);
  const [owner, repo] = inputs.repoUrl.split('/');
  if (!owner || !repo) {
    throw new Error(
      `Invalid repo-url, expected <owner>/<repo>: ${inputs.repoUrl}`
    );
  }
  const forgejo = await Forgejo.create({
    owner,
    repo,
    apiUrl: inputs.apiUrl,
    token: inputs.token,
    defaultBranch: inputs.targetBranch,
    workInProgressPrefix: inputs.wipPrefix,
  });
  const outputs = new ActionOutputs();
  try {
    if (!inputs.skipGitHubRelease) {
      const manifest = await loadOrBuildManifest(forgejo, inputs);
      logger.debug('Creating releases');
      outputReleases(outputs, await manifest.createReleases());
    }
    if (!inputs.skipGitHubPullRequest) {
      const manifest = await loadOrBuildManifest(forgejo, inputs);
      logger.debug('Creating pull requests');
      outputPullRequests(outputs, await manifest.createPullRequests());
    }
  } finally {
    outputs.write(env.GITHUB_OUTPUT);
  }
}

if (require.main === module) {
  main().catch(err => {
    logger.error(`release-please failed: ${err.message}`);
    process.exitCode = 1;
  });
}
