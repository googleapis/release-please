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

import * as assert from 'assert';
import {describe, it, afterEach} from 'mocha';
import * as nock from 'nock';
import {OCaml} from '../../src/releasers/ocaml';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {readPOJO, stringifyExpectedChanges} from '../helpers';
import {readFileSync} from 'fs';
import {resolve} from 'path';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/ocaml';

describe('OCaml', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    const suites = [
      {esy: ['esy.json'], opam: ['sample.opam']},
      {esy: ['esy.json'], opam: []},
      {esy: [], opam: ['sample.opam']},
      {esy: ['package.json'], opam: []},
    ];

    suites.forEach(({esy, opam}) => {
      let suiteName = esy.join(',');
      if (esy.length && opam.length) {
        suiteName += ' + ';
      }
      suiteName += opam.join(',');

      it(`creates a release PR for non-monorepo (${suiteName})`, async () => {
        const releasePR = new OCaml({
          repoUrl: 'phated/ocaml-sample-repo',
          releaseType: 'ocaml',
          packageName: 'sample',
          apiUrl: 'https://api.github.com',
        });

        // Indicates that there are no PRs currently waiting to be released:
        sandbox
          .stub(releasePR.gh, 'findMergedReleasePR')
          .returns(Promise.resolve(undefined));

        // Return latest tag used to determine next version #:
        sandbox.stub(releasePR.gh, 'latestTag').returns(
          Promise.resolve({
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            name: 'v0.5.0',
            version: '0.5.0',
          })
        );

        // Commits, used to build CHANGELOG, and propose next version bump:
        sandbox
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .stub(releasePR.gh as any, 'commitsSinceSha')
          .returns(Promise.resolve(readPOJO('commits-fix')));

        // See if there are any release PRs already open, we do this as
        // we consider opening a new release-pr:
        sandbox
          .stub(releasePR.gh, 'findOpenReleasePRs')
          .returns(Promise.resolve([]));

        // Lookup the default branch name:
        sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('main');

        // Fetch files from GitHub, in prep to update with code-suggester:
        const findFilesByExtensionStub = sandbox.stub(
          releasePR.gh,
          'findFilesByExtension'
        );

        findFilesByExtensionStub.withArgs('json').resolves(esy);
        findFilesByExtensionStub.withArgs('opam').resolves(opam);
        findFilesByExtensionStub.resolves([]);

        // Fetch files from GitHub, in prep to update with code-suggester:
        const getFileContentsStub = sandbox.stub(
          releasePR.gh,
          'getFileContentsOnBranch'
        );

        // 'esy.json' exists
        const esyJsonContents = readFileSync(
          resolve(fixturesPath, 'esy.json'),
          'utf8'
        );
        esy.forEach(filename => {
          getFileContentsStub.withArgs(filename, 'main').resolves({
            sha: 'abc123',
            content: Buffer.from(esyJsonContents, 'utf8').toString('base64'),
            parsedContent: esyJsonContents,
          });
        });
        // 'sample.opam' exists
        const opamContents = readFileSync(
          resolve(fixturesPath, 'sample.opam'),
          'utf8'
        );
        opam.forEach(filename => {
          getFileContentsStub.withArgs(filename, 'main').resolves({
            sha: 'abc123',
            content: Buffer.from(opamContents, 'utf8').toString('base64'),
            parsedContent: opamContents,
          });
        });

        // Nothing else exists:
        getFileContentsStub.rejects(
          Object.assign(Error('not found'), {status: 404})
        );

        // We stub the entire suggester API, these updates are generally the
        // most interesting thing under test, as they represent the changes
        // that will be pushed up to GitHub:
        let expectedChanges: [string, object][] = [];
        sandbox.replace(
          suggester,
          'createPullRequest',
          (_octokit, changes): Promise<number> => {
            expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
            return Promise.resolve(22);
          }
        );

        // Call made to close any stale release PRs still open on GitHub:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sandbox.stub(releasePR as any, 'closeStaleReleasePRs');

        // Call to add autorelease: pending label:
        sandbox.stub(releasePR.gh, 'addLabels');

        await releasePR.run();

        // Did we generate all the changes to files we expected to?
        snapshot(stringifyExpectedChanges(expectedChanges));
      });
    });

    it(`skips JSON files that don't contain a "version" field`, async () => {
      const releasePR = new OCaml({
        repoUrl: 'phated/ocaml-sample-repo',
        releaseType: 'ocaml',
        packageName: 'sample',
        apiUrl: 'https://api.github.com',
      });

      // Indicates that there are no PRs currently waiting to be released:
      sandbox
        .stub(releasePR.gh, 'findMergedReleasePR')
        .returns(Promise.resolve(undefined));

      // Return latest tag used to determine next version #:
      sandbox.stub(releasePR.gh, 'latestTag').returns(
        Promise.resolve({
          sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
          name: 'v0.5.0',
          version: '0.5.0',
        })
      );

      // Commits, used to build CHANGELOG, and propose next version bump:
      sandbox
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .stub(releasePR.gh as any, 'commitsSinceSha')
        .returns(Promise.resolve(readPOJO('commits-fix')));

      // See if there are any release PRs already open, we do this as
      // we consider opening a new release-pr:
      sandbox
        .stub(releasePR.gh, 'findOpenReleasePRs')
        .returns(Promise.resolve([]));

      // Lookup the default branch name:
      sandbox.stub(releasePR.gh, 'getDefaultBranch').resolves('main');

      // Fetch files from GitHub, in prep to update with code-suggester:
      const findFilesByExtensionStub = sandbox.stub(
        releasePR.gh,
        'findFilesByExtension'
      );

      findFilesByExtensionStub.withArgs('json').resolves(['fixture.json']);
      findFilesByExtensionStub.withArgs('opam').resolves([]);
      findFilesByExtensionStub.resolves([]);

      // Fetch files from GitHub, in prep to update with code-suggester:
      const getFileContentsStub = sandbox.stub(
        releasePR.gh,
        'getFileContentsOnBranch'
      );

      getFileContentsStub.withArgs('fixture.json', 'main').resolves({
        sha: 'abc123',
        content: Buffer.from(JSON.stringify({test: 'Test'}), 'utf8').toString('base64'),
        parsedContent: '{"test": "Test"}',
      });

      // Nothing else exists:
      getFileContentsStub.rejects(
        Object.assign(Error('not found'), {status: 404})
      );

      // We stub the entire suggester API, these updates are generally the
      // most interesting thing under test, as they represent the changes
      // that will be pushed up to GitHub:
      let expectedChanges: [string, object][] = [];
      sandbox.replace(
        suggester,
        'createPullRequest',
        (_octokit, changes): Promise<number> => {
          expectedChanges = [...(changes as Map<string, object>)]; // Convert map to key/value pairs.
          return Promise.resolve(22);
        }
      );

      // Call made to close any stale release PRs still open on GitHub:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sandbox.stub(releasePR as any, 'closeStaleReleasePRs');

      // Call to add autorelease: pending label:
      sandbox.stub(releasePR.gh, 'addLabels');

      await releasePR.run();

      // Did we generate all the changes to files we expected to?
      snapshot(stringifyExpectedChanges(expectedChanges));
    });

    // TODO(blaine): Monorepo setup

    it('does not support snapshot releases', async () => {
      const releasePR = new OCaml({
        repoUrl: 'phated/ocaml-sample-repo',
        releaseType: 'ocaml',
        packageName: 'sample',
        apiUrl: 'https://api.github.com',
        snapshot: true,
      });
      const pr = await releasePR.run();
      assert.strictEqual(pr, undefined);
    });
  });
});
