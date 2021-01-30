#!/usr/bin/env node

// Copyright 2019 Google LLC
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

import chalk = require('chalk');
import {coerceOption} from '../util/coerce-option';
import {GitHubReleaseOptions} from '../github-release';
import {ReleasePROptions} from '../release-pr';
import {factory} from '../factory';
import {getReleaserNames} from '../releasers';
import * as yargs from 'yargs';

interface ErrorObject {
  body?: object;
  status?: number;
  message: string;
  stack: string;
}

interface YargsOptions {
  describe: string;
  choices?: string[];
  demand?: boolean;
  type?: string;
  default?: string | boolean;
}

interface YargsOptionsBuilder {
  option(opt: string, options: YargsOptions): YargsOptionsBuilder;
}

export const parser = yargs
  .command(
    'release-pr',
    'create or update a PR representing the next release',
    (yargs: YargsOptionsBuilder) => {
      yargs
        .option('version-file', {
          describe: 'path to version file to update, e.g., version.rb',
        })
        .option('last-package-version', {
          describe: 'last version # that package was released as',
        })
        .option('fork', {
          describe: 'should the PR be created from a fork',
          type: 'boolean',
          default: false,
        })
        .option('snapshot', {
          describe: 'is it a snapshot (or pre-release) being generated?',
          type: 'boolean',
          default: false,
        })
        .option('default-branch', {
          describe: 'default branch to open release PR against',
          type: 'string',
        })
        .option('monorepo-tags', {
          describe: 'include library name in tags and release branches',
          type: 'boolean',
          default: false,
        });
    },
    (argv: ReleasePROptions) => {
      factory.runCommand('release-pr', argv).catch(handleError);
    }
  )
  .command(
    'github-release',
    'create a GitHub release from a release PR',
    (yargs: YargsOptionsBuilder) => {
      yargs
        .option('changelog-path', {
          default: 'CHANGELOG.md',
          describe: 'where can the CHANGELOG be found in the project?',
        })
        .option('draft', {
          describe:
            'mark release as a draft. no tag is created but tag_name and ' +
            'target_commitish are associated with the release for future ' +
            'tag creation upon "un-drafting" the release.',
          type: 'boolean',
          default: false,
        });
    },
    (argv: GitHubReleaseOptions) => {
      factory.runCommand('github-release', argv).catch(handleError);
    }
  )
  .middleware(_argv => {
    const argv = _argv as GitHubReleaseOptions;
    // allow secrets to be loaded from file path
    // rather than being passed directly to the bin.
    if (argv.token) argv.token = coerceOption(argv.token);
    if (argv.apiUrl) argv.apiUrl = coerceOption(argv.apiUrl);
  })
  .option('token', {describe: 'GitHub token with repo write permissions'})
  .option('release-as', {
    describe: 'override the semantically determined release version',
    type: 'string',
  })
  .option('release-type', {
    describe: 'what type of repo is a release being created for?',
    choices: getReleaserNames(),
    default: 'node',
  })
  .option('bump-minor-pre-major', {
    describe:
      'should we bump the semver minor prior to the first major release',
    default: false,
    type: 'boolean',
  })
  .option('api-url', {
    describe: 'URL to use when making API requests',
    default: 'https://api.github.com',
    type: 'string',
  })
  .option('debug', {
    describe: 'print verbose errors (use only for local debugging).',
    default: false,
    type: 'boolean',
  })
  .option('default-branch', {
    describe: '',
    type: 'string',
  })
  .option('label', {
    default: 'autorelease: pending',
    describe: 'label to remove from release PR',
  })
  .option('repo-url', {
    describe: 'GitHub URL to generate release for',
    demand: true,
  })
  .option('path', {
    describe: 'release from path other than root directory',
    type: 'string',
  })
  .option('package-name', {
    describe: 'name of package release is being minted for',
  })
  .option('monorepo-tags', {
    describe: 'include library name in tags and release branches',
    type: 'boolean',
    default: false,
  })
  .demandCommand(1)
  .strict(true);

// Only run parser if executed with node bin, this allows
// for the parser to be easily tested:
let argv: yargs.Arguments;
if (require.main === module) {
  argv = parser.parse();
}

// The errors returned by octokit currently contain the
// request object, this contains information we don't want to
// leak. For this reason, we capture exceptions and print
// a less verbose error message (run with --debug to output
// the request object, don't do this in CI/CD).
function handleError(err: ErrorObject) {
  let status = '';
  const command = argv?._?.length ? argv._[0] : '';
  if (err.status) {
    status = '' + err.status;
  }
  console.error(
    chalk.red(
      `command ${command} failed${status ? ` with status ${status}` : ''}`
    )
  );
  if (argv?.debug) {
    console.error('---------');
    console.error(err.stack);
  }
  process.exitCode = 1;
}

process.on('unhandledRejection', err => {
  handleError(err as ErrorObject);
});

process.on('uncaughtException', err => {
  handleError(err as ErrorObject);
});
