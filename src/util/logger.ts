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

import * as chalk from 'chalk';
import * as figures from 'figures';

const errorPrefix = chalk.red(figures.cross);
const warnPrefix = chalk.yellow(figures.warning);
const infoPrefix = chalk.green(figures.tick);
const debugPrefix = chalk.gray(figures.pointer);
const tracePrefix = chalk.dim.gray(figures.pointerSmall);

/* eslint-disable @typescript-eslint/no-explicit-any */
interface LogFn {
  <T extends object>(obj: T, msg?: string, ...args: any[]): void;
  (msg: string, ...args: any[]): void;
}

export interface Logger {
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
  trace: LogFn;
}

class CheckpointLogger implements Logger {
  error: LogFn = (...args: any[]) => {
    console.error(`${errorPrefix}`, ...args);
  };
  warn: LogFn = (...args: any[]) => {
    console.warn(`${warnPrefix}`, ...args);
  };
  info: LogFn = (...args: any[]) => {
    console.info(`${infoPrefix}`, ...args);
  };
  debug: LogFn = (...args: any[]) => {
    console.debug(`${debugPrefix}`, ...args);
  };
  trace: LogFn = (...args: any[]) => {
    console.trace(`${tracePrefix}`, ...args);
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export let logger = new CheckpointLogger();

export function setLogger(userLogger: Logger) {
  logger = userLogger;
}
