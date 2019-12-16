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
import * as figures from 'figures';

export enum CheckpointType {
  Success = 'success',
  Failure = 'failure',
}

export function checkpoint(msg: string, type: CheckpointType) {
  const prefix =
    type === CheckpointType.Success
      ? chalk.green(figures.tick)
      : chalk.red(figures.cross);
  if (process.env.ENVIRONMENT !== 'test') {
    console.info(`${prefix} ${msg}`);
  }
}
