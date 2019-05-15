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

import * as snapshot from 'snap-shot-it';

import {CandidateIssue} from '../src/candidate-issue';

const fixturesPath = './test/fixtures';

describe('CandidateIssue', () => {
  describe('bodyTemplate', () => {
    it('generates body for issue', () => {
      const body = CandidateIssue.bodyTemplate(
          'Features:\n* deps: upgrade foo\n', '@foo/bar');
      snapshot(body);
    });
  });

  describe('bodySansFooter', () => {
    it('returns the body with the footer removed', () => {
      const body = CandidateIssue.bodyTemplate(
        'Features:\n* deps: upgrade foo\n', '@foo/bar');
      snapshot(CandidateIssue.bodySansFooter(body));
    })
  })
});
