"use strict";
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

// only perform the action if issue title matches, and comment was
// made by user with write access to repo.
// TODO: check that user has write access.

const partialIssueTitle = 'proposal for next release';
const event = require(process.env.GITHUB_EVENT_PATH);
console.info(JSON.stringify(event, null, 2));

if (issue.title.indexOf(partialIssueTitle) !== -1) {
  process.exit(0);
} else {
  console.info(`issue title did not contain ${partialIssueTitle}`)
  process.exit(1);
}

