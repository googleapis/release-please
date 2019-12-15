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
import { coerceOption } from '../util/coerce-option';
import { GitHubRelease, GitHubReleaseOptions } from '../github-release';
import { ReleasePROptions } from '../release-pr';
import { ReleasePRFactory } from '../release-pr-factory';

const yargs = require('yargs');

interface ErrorObject {
  body?: object;
  status?: number;
  message: string;
  stack: string;
}

interface YargsOptions {
  describe: string;
  demand?: boolean;
  type?: string;
  default?: string | boolean;
}

interface YargsOptionsBuilder {
  option(opt: string, options: YargsOptions): YargsOptionsBuilder;
}

const argv = yargs
  .command(
    'release-pr',
    'create or update a PR representing the next release',
    (yargs: YargsOptionsBuilder) => {
      yargs
        .option('package-name', {
          describe: 'name of package release is being minted for',
          demand: true,
        })
        .option('version-file', {
          describe: 'path to version file to update, e.g., version.rb',
        })
        .option('last-package-version', {
          describe: 'last version # that package was released as',
        })
        .option('repo-url', {
          describe: 'GitHub URL to generate release for',
          demand: true,
        })
        .option('label', {
          describe: 'label(s) to add to generated PR',
        })
        .option('snapshot', {
          describe: 'is it a snapshot (or pre-release) being generated?',
          type: 'boolean',
          default: false,
        });
    },
    (argv: ReleasePROptions) => {
      const rp = ReleasePRFactory.build(argv.releaseType, argv);
      rp.run().catch(handleError);
    }
  )
  .command(
    'github-release',
    'create a GitHub release from a release PR',
    (yargs: YargsOptionsBuilder) => {
      yargs
        .option('package-name', {
          describe: 'name of package release is being minted for',
          demand: true,
        })
        .option('repo-url', {
          describe: 'GitHub URL to generate release for',
          demand: true,
        })
        .option('label', {
          default: 'autorelease: pending',
          describe: 'label to remove from release PR',
        });
    },
    (argv: GitHubReleaseOptions) => {
      const gr = new GitHubRelease(argv);
      gr.createRelease().catch(handleError);
    }
  )
  .command(
    'generate-action',
    'outputs the release-please stanzas that should be added to main.workflow',
    (yargs: YargsOptionsBuilder) => {
      yargs.option('package-name', {
        describe: 'name of package releases will be created for',
        demand: true,
      });
    },
    (argv: ReleasePROptions) => {
      console.error(
        chalk.green(
          '----- put the content below in .github/main.workflow -----'
        )
      );
      console.info(`workflow "Groom Release PR" {
  on = "pull_request"
  resolves = ["release-pr"]
}

action "release-pr" {
  uses = "googleapis/release-please/.github/action/release-please@master"
  env = {
    PACKAGE_NAME = "${argv.packageName}"
    RELEASE_PLEASE_COMMAND = "release-pr"
  }
  secrets = ["GITHUB_TOKEN"]
}

workflow "GitHub Release" {
  on = "pull_request"
  resolves = ["github-release"]
}

action "github-release" {
  uses = "googleapis/release-please/.github/action/release-please@master"
  env = {
    PACKAGE_NAME = "${argv.packageName}"
    RELEASE_PLEASE_COMMAND = "github-release"
  }
  secrets = ["GITHUB_TOKEN"]
}
        `);
    }
  )
  .middleware((argv: GitHubReleaseOptions) => {
    // allow secrets to be loaded from file path
    // rather than being passed directly to the bin.
    if (argv.token) argv.token = coerceOption(argv.token);
    if (argv.apiUrl) argv.apiUrl = coerceOption(argv.apiUrl);
    if (argv.proxyKey) argv.proxyKey = coerceOption(argv.proxyKey);
  })
  .option('token', { describe: 'GitHub token with repo write permissions' })
  .option('release-as', {
    describe: 'override the semantically determined release version',
    type: 'string',
  })
  .option('release-type', {
    describe: 'what type of repo is a release being created for?',
    choices: [
      'node',
      'php-yoshi',
      'java-auth-yoshi',
      'java-yoshi',
      'python',
      'ruby',
      'ruby-yoshi',
    ],
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
  .option('proxy-key', {
    describe: 'key used by some GitHub proxies',
    type: 'string',
  })
  .option('debug', {
    describe: 'print verbose errors (use only for local debugging).',
    default: false,
    type: 'boolean',
  })
  .demandCommand(1)
  .strict(true)
  .parse();

// The errors returned by octokit currently contain the
// request object, this contains information we don't want to
// leak. For this reason, we capture exceptions and print
// a less verbose error message (run with --debug to output
// the request object, don't do this in CI/CD).
function handleError(err: ErrorObject) {
  let status = '';
  const command = argv._.length === 0 ? '' : argv._[0];
  if (err.status) {
    status = '' + err.status;
  }
  console.error(
    chalk.red(
      `command ${command} failed${status ? ` with status ${status}` : ''}`
    )
  );
  if (argv.debug) {
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
