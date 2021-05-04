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

import {logger} from './logger';

export enum CheckpointType {
  Success = 'success',
  Failure = 'failure',
}

export type Checkpoint = (msg: string, type: CheckpointType) => void;
export const checkpoint: Checkpoint = function (
  msg: string,
  type: CheckpointType
) {
  if (process.env.ENVIRONMENT !== 'test') {
    if (type === CheckpointType.Success) {
      logger.info(msg);
    } else {
      logger.error(msg);
    }
  }
};
