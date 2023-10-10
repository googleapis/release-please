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

export class CheckpointLogger implements Logger {
  private includeDebug: boolean;
  private includeTrace: boolean;
  constructor(includeDebug = false, includeTrace = false) {
    this.includeDebug = includeDebug;
    this.includeTrace = includeTrace;
  }
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
    if (this.includeDebug) console.debug(`${debugPrefix}`, ...args);
  };
  trace: LogFn = (...args: any[]) => {
    if (this.includeTrace) console.debug(`${tracePrefix}`, ...args);
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export let logger: Logger =
  process.env['LOG_LEVEL'] === 'trace'
    ? new CheckpointLogger(true, true)
    : ['info', 'error', 'warn'].includes(process.env['LOG_LEVEL'] || '')
    ? new CheckpointLogger()
    : // default to debug logs
      new CheckpointLogger(true);

export function setLogger(userLogger: Logger) {
  logger = userLogger;
}
