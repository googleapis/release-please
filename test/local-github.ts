// Copyright 2026 Google LLC
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

import {expect} from 'chai';
import {describe, it, before} from 'mocha';
import {LocalGitHub} from '../src/local-github';

describe('LocalGitHub', () => {
  let localGitHub: LocalGitHub;

  before(async () => {
    localGitHub = await LocalGitHub.create({
      owner: 'googleapis',
      repo: 'release-please',
      defaultBranch: 'main',
      cloneDepth: 100,
    });
  });

  describe('getFileContentsOnBranch', () => {
    it('reads file content correctly', async () => {
      const contents = await localGitHub.getFileContentsOnBranch(
        'package.json',
        'main'
      );
      expect(contents).to.not.be.undefined;
      expect(contents.parsedContent).to.include('"name": "release-please"');
      expect(contents.sha).to.not.be.undefined;
    });

    it('throws FileNotFoundError when file does not exist', async () => {
      try {
        await localGitHub.getFileContentsOnBranch(
          'non-existent-file.txt',
          'main'
        );
        throw new Error('Expected FileNotFoundError to be thrown');
      } catch (err) {
        const error = err as Error;
        expect(error.name).to.equal('FileNotFoundError');
      }
    });
  });

  describe('findFilesByFilenameAndRef', () => {
    it('finds files by filename', async () => {
      const files = await localGitHub.findFilesByFilenameAndRef(
        'package.json',
        'main'
      );
      expect(files).to.include('package.json');
    });
  });

  describe('findFilesByGlobAndRef', () => {
    it('finds files by glob', async () => {
      const files = await localGitHub.findFilesByGlobAndRef('*.json', 'main');
      expect(files).to.include('package.json');
    });
  });

  describe('findFilesByExtensionAndRef', () => {
    it('finds files by extension', async () => {
      const files = await localGitHub.findFilesByExtensionAndRef(
        'json',
        'main'
      );
      expect(files).to.include('package.json');
    });
  });

  describe('mergeCommitIterator', () => {
    it('iterates over commits', async () => {
      const generator = localGitHub.mergeCommitIterator('main', {
        maxResults: 5,
      });
      const commits = [];
      for await (const commit of generator) {
        commits.push(commit);
      }
      expect(commits.length).to.be.greaterThan(0);
      expect(commits.length).to.be.lessThanOrEqual(5);
      expect(commits[0].sha).to.not.be.undefined;
      expect(commits[0].message).to.not.be.undefined;
    });
  });

  describe('tagIterator', () => {
    it('iterates over tags', async () => {
      const generator = localGitHub.tagIterator({maxResults: 5});
      const tags = [];
      for await (const tag of generator) {
        tags.push(tag);
      }
      expect(tags.length).to.be.greaterThan(0);
      expect(tags.length).to.be.lessThanOrEqual(5);
      expect(tags[0].name).to.not.be.undefined;
      expect(tags[0].sha).to.not.be.undefined;
    });
  });
});
