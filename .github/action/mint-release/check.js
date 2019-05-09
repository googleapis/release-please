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

const event = require(process.env.GITHUB_EVENT_PATH);
const fetch = require('node-fetch');

// only users in ORGS_ACL may create releases.
const ORGS_ACL = process.env.ORGS_ACL.split(',')

// releases can only be created if issue has PARTIALS_ISSUE_TITLE.
const PARTIALS_ISSUE_TITLE = 'proposal for next release';

if (event.action === 'created' && event.issue.title.indexOf(PARTIALS_ISSUE_TITLE) !== -1) {
  console.info(`comment created on issue containing: ${PARTIALS_ISSUE_TITLE}`);
  // ensure the user was in one of our supported organizations:
  fetch(event.sender.organizations_url)
    .then(res => res.json())
    .then(orgs => {
      for (let i = 0, org; (org = orgs[i]) !== undefined; i++) {
        if (ORGS_ACL.indexOf(org.login) !== -1) {
          console.info(`${process.env.GITHUB_ACTOR} was in ${org.login} creating release`);
          process.exit(0);
        }
      }
      console.error(`${process.env.GITHUB_ACTOR} not found in ${ORGS_ACL}`);
      process.exit(1);
    })
    .catch((err) => {
      console.error(err.stack);
      process.exit(1);
    });
} else {
  console.info(`issue title did not contain: ${PARTIALS_ISSUE_TITLE}`)
  process.exit(1);
}
