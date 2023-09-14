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

import {Update} from './update';
import {Version} from './version';
import {PullRequestBody} from './util/pull-request-body';
import {PullRequestTitle} from './util/pull-request-title';

export interface ReleasePullRequest {
  readonly title: PullRequestTitle;
  readonly body: PullRequestBody;
  labels: string[];
  readonly headRefName: string;
  readonly version?: Version;
  readonly previousVersion?: Version;
  readonly draft: boolean;
  readonly group?: string;
  updates: Update[];
}
