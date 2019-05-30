#!/usr/bin/env node

/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import chalk from 'chalk';
import { GitHubRelease, GitHubReleaseOptions } from '../github-release';
import { ReleasePR, ReleasePROptions } from '../release-pr';

const yargs = require('yargs');

interface YargsOptions {
  describe: string;
  demand?: boolean;
  default?: string;
}

interface YargsOptionsBuilder {
  option(opt: string, options: YargsOptions): YargsOptionsBuilder;
}

yargs
  .command(
    'release-pr',
    'create or update a PR representing the next release',
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
          default: 'autorelease: pending,type: process',
          describe: 'label(s) to add to generated PR',
        });
    },
    async (argv: ReleasePROptions) => {
      const rp = new ReleasePR(argv);
      await rp.run();
    }
  )
  .command(
    'github-release',
    'create a GitHub release from a release PR',
    (yargs: YargsOptionsBuilder) => {
      yargs
        .option('repo-url', {
          describe: 'GitHub URL to generate release for',
          demand: true,
        })
        .option('label', {
          default: 'autorelease: pending',
          describe: 'label to remove from release PR',
        });
    },
    async (argv: GitHubReleaseOptions) => {
      const gr = new GitHubRelease(argv);
      await gr.createRelease();
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
    async (argv: ReleasePROptions) => {
      console.info(
        chalk.green(
          '----- put the content below in .github/main.workflow -----'
        )
      );
      console.info(`workflow "Groom Release PR" {
  on = "push"
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
  on = "push"
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
  .option('token', { describe: 'GitHub token with repo write permissions' })
  .option('release-as', {
    describe: 'override the semantically determined release version',
    type: 'string',
  })
  .option('release-type', {
    describe: 'what type of repo is a release being created for?',
    options: ['node', 'php-yoshi'],
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
  .demandCommand(1)
  .strict(true)
  .parse();
