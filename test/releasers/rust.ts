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
import {Rust} from '../../src/releasers/rust';
import * as snapshot from 'snap-shot-it';
import * as suggester from 'code-suggester';
import * as sinon from 'sinon';
import {readPOJO, stringifyExpectedChanges} from '../helpers';
import {readFileSync} from 'fs';
import {resolve} from 'path';

nock.disableNetConnect();
const sandbox = sinon.createSandbox();
const fixturesPath = './test/releasers/fixtures/rust';

describe('Rust', () => {
  afterEach(() => {
    sandbox.restore();
  });
  describe('run', () => {
    function runTests(opts: {hasCargoLock: boolean}) {
      const suffix = `${opts.hasCargoLock ? 'with' : 'without'} Cargo.lock`;

      it(`creates a release PR for non-monorepo ${suffix}`, async () => {
        const releasePR = new Rust({
          repoUrl: 'fasterthanlime/rust-test-repo',
          releaseType: 'rust',
          packageName: 'crate1',
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
            name: 'v0.123.4',
            version: '0.123.4',
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
        const getFileContentsStub = sandbox.stub(
          releasePR.gh,
          'getFileContentsOnBranch'
        );

        // 'Cargo.toml' exists and is for a single package:
        const manifestContent = readFileSync(
          resolve(fixturesPath, 'Cargo-crate1.toml'),
          'utf8'
        );
        getFileContentsStub.withArgs('Cargo.toml', 'main').resolves({
          sha: 'abc123',
          content: Buffer.from(manifestContent, 'utf8').toString('base64'),
          parsedContent: manifestContent,
        });

        if (opts.hasCargoLock) {
          // `Cargo.lock` exists and is for a single package. note: the same
          // fixture as the monorepo case is used, it doesn't matter much.
          const lockfileContent = readFileSync(
            resolve(fixturesPath, 'Cargo.lock'),
            'utf8'
          );
          getFileContentsStub.withArgs('Cargo.lock', 'main').resolves({
            sha: 'abc123',
            content: Buffer.from(lockfileContent, 'utf8').toString('base64'),
            parsedContent: lockfileContent,
          });
        }

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

      it(`creates a release PR for monorepo ${suffix}`, async () => {
        const releasePR = new Rust({
          repoUrl: 'fasterthanlime/rust-test-repo',
          releaseType: 'rust',
          packageName: 'crate1',
          apiUrl: 'https://api.github.com',
          path: 'crates/crate1',
          monorepoTags: true,
        });

        // Indicates that there are no PRs currently waiting to be released:
        sandbox
          .stub(releasePR.gh, 'findMergedReleasePR')
          .returns(Promise.resolve(undefined));

        // Return latest tag used to determine next version #:
        sandbox.stub(releasePR.gh, 'latestTag').returns(
          Promise.resolve({
            sha: 'da6e52d956c1e35d19e75e0f2fdba439739ba364',
            name: 'v0.123.4',
            version: '0.123.4',
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
        const getFileContentsStub = sandbox.stub(
          releasePR.gh,
          'getFileContentsOnBranch'
        );

        // 'Cargo.toml' exists and is for the workspace
        const workspaceManifestContent = readFileSync(
          resolve(fixturesPath, 'Cargo-workspace.toml'),
          'utf8'
        );
        getFileContentsStub.withArgs('Cargo.toml', 'main').resolves({
          sha: 'abc123',
          content: Buffer.from(workspaceManifestContent, 'utf8').toString(
            'base64'
          ),
          parsedContent: workspaceManifestContent,
        });

        // 'crates/crate1/Cargo.toml' exists and is for the `crate1` package
        const crate1ManifestContent = readFileSync(
          resolve(fixturesPath, 'Cargo-crate1.toml'),
          'utf8'
        );
        getFileContentsStub
          .withArgs('crates/crate1/Cargo.toml', 'main')
          .resolves({
            sha: 'abc123',
            content: Buffer.from(crate1ManifestContent, 'utf8').toString(
              'base64'
            ),
            parsedContent: crate1ManifestContent,
          });

        // 'crates/crate2/Cargo.toml' exists and is for the `crate2` package
        const crate2ManifestContent = readFileSync(
          resolve(fixturesPath, 'Cargo-crate2.toml'),
          'utf8'
        );
        getFileContentsStub
          .withArgs('crates/crate2/Cargo.toml', 'main')
          .resolves({
            sha: 'abc123',
            content: Buffer.from(crate2ManifestContent, 'utf8').toString(
              'base64'
            ),
            parsedContent: crate2ManifestContent,
          });

        if (opts.hasCargoLock) {
          // a top-level `Cargo.lock` exists and is for both packages
          const lockfileContent = readFileSync(
            resolve(fixturesPath, 'Cargo.lock'),
            'utf8'
          );
          getFileContentsStub.withArgs('Cargo.lock', 'main').resolves({
            sha: 'abc123',
            content: Buffer.from(lockfileContent, 'utf8').toString('base64'),
            parsedContent: lockfileContent,
          });
        }

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
    }

    runTests({hasCargoLock: false});
    runTests({hasCargoLock: true});

    it('does not support snapshot releases', async () => {
      const releasePR = new Rust({
        repoUrl: 'fasterthanlime/rust-test-repo',
        releaseType: 'rust',
        packageName: 'crate1',
        apiUrl: 'https://api.github.com',
        snapshot: true,
      });
      const pr = await releasePR.run();
      assert.strictEqual(pr, undefined);
    });
  });
});
