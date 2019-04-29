#!/usr/bin/env; node;

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

import {MintRelease, MintReleaseOptions} from '../mint-release';

const yargs = require('yargs');

yargs
    .command(
        'mint-release', 'mint a new release for a repo', () => {},
        async (argv: MintReleaseOptions) => {
          const mr = new MintRelease(argv);
          await mr.run();
        })
    .option(
        'token', {describe: 'GitHub repo token', default: process.env.GH_TOKEN})
    .option('package-name', {
      describe: 'name of package release is being minted for',
      required: true
    })
    .option(
        'repo-url',
        {describe: 'GitHub URL to generate release for', required: true})
    .option('release-type', {
      describe: 'what type of repo is a release being created for?',
      options: ['node'],
      default: 'node'
    })
    .demandCommand(1)
    .strict(true)
    .parse();
