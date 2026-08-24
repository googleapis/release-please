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

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import {expect} from 'chai';
import {describe, it, before} from 'mocha';
import {LocalGitHub} from '../src/local-github';
import {FileNotFoundError} from '../src/errors';
import {GitHubApi} from '../src/github-api';

async function createSubmoduleRepo(): Promise<{
  repoPath: string;
  localGitHub: LocalGitHub;
}> {
  const tempDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'local-github-submodule-test-')
  );
  const fakeGlobalConfig = path.join(tempDir, '.gitconfig');
  await fs.promises.writeFile(
    fakeGlobalConfig,
    '[user]\nname=Test\nemail=test@example.com\n'
  );
  const env = {...process.env, GIT_CONFIG_GLOBAL: fakeGlobalConfig};

  child_process.execFileSync('git', ['init', '-b', 'main'], {
    cwd: tempDir,
    env,
  });
  child_process.execFileSync('git', ['config', 'user.name', 'Test'], {
    cwd: tempDir,
    env,
  });
  child_process.execFileSync(
    'git',
    ['config', 'user.email', 'test@example.com'],
    {cwd: tempDir, env}
  );
  child_process.execFileSync('git', ['config', 'commit.gpgSign', 'false'], {
    cwd: tempDir,
    env,
  });
  await fs.promises.writeFile(
    path.join(tempDir, 'pom.xml'),
    '<project></project>'
  );
  await fs.promises.mkdir(path.join(tempDir, 'packages', 'pkg'), {
    recursive: true,
  });
  await fs.promises.writeFile(
    path.join(tempDir, 'packages', 'pkg', 'setup.py'),
    '# setup'
  );
  await fs.promises.writeFile(
    path.join(tempDir, 'packages', 'pkg', 'pom.xml'),
    '<project>child</project>'
  );
  child_process.execFileSync('git', ['add', '.'], {cwd: tempDir, env});
  child_process.execFileSync(
    'git',
    [
      'update-index',
      '--add',
      '--cacheinfo',
      '160000,1111111111111111111111111111111111111111,submodule-pkg',
    ],
    {cwd: tempDir, env}
  );
  child_process.execFileSync(
    'git',
    ['commit', '-m', 'initial commit with submodule'],
    {cwd: tempDir, env}
  );

  const localGitHub = new LocalGitHub(
    {owner: 'fake', repo: 'fake', defaultBranch: 'main'},
    null as unknown as GitHubApi,
    tempDir
  );
  return {repoPath: tempDir, localGitHub};
}

describe('LocalGitHub', function () {
  this.timeout(60000);
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

    it('reads file content correctly from a branch', async () => {
      const contents = await localGitHub.getFileContentsOnBranch(
        'package.json',
        '12.x'
      );
      expect(contents).to.not.be.undefined;
      expect(contents.parsedContent).to.include('"name": "release-please"');
      expect(contents.sha).to.not.be.undefined;
    });

    it('reads file content correctly from a tag', async () => {
      const contents = await localGitHub.getFileContentsOnBranch(
        'package.json',
        'v17.4.0'
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

    it('throws FileNotFoundError when file does not exist on a branch', async () => {
      try {
        await localGitHub.getFileContentsOnBranch(
          'non-existent-file.txt',
          '12.x'
        );
        throw new Error('Expected FileNotFoundError to be thrown');
      } catch (err) {
        const error = err as Error;
        expect(error.name).to.equal('FileNotFoundError');
      }
    });

    it('throws FileNotFoundError when encountering a submodule entry (mode 160000)', async () => {
      const {localGitHub: submoduleGitHub} = await createSubmoduleRepo();
      try {
        await submoduleGitHub.getFileContentsOnBranch('submodule-pkg', 'main');
        expect.fail('Expected FileNotFoundError to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(FileNotFoundError);
      }
    });

    it('throws FileNotFoundError when git ls-tree or ref resolution fails', async () => {
      try {
        await localGitHub.getFileContentsOnBranch(
          'package.json',
          'non-existent-ref-xyz'
        );
        expect.fail('Expected FileNotFoundError to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(FileNotFoundError);
      }
    });

    it('throws FileNotFoundError when git show fails', async () => {
      const tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), 'git-show-test-')
      );
      const fakeGlobalConfig = path.join(tempDir, '.gitconfig');
      await fs.promises.writeFile(
        fakeGlobalConfig,
        '[user]\nname=Test\nemail=test@example.com\n'
      );
      const env = {...process.env, GIT_CONFIG_GLOBAL: fakeGlobalConfig};

      child_process.execFileSync('git', ['init', '-b', 'main'], {
        cwd: tempDir,
        env,
      });
      child_process.execFileSync('git', ['config', 'user.name', 'Test'], {
        cwd: tempDir,
        env,
      });
      child_process.execFileSync(
        'git',
        ['config', 'user.email', 'test@example.com'],
        {cwd: tempDir, env}
      );
      child_process.execFileSync('git', ['config', 'commit.gpgSign', 'false'], {
        cwd: tempDir,
        env,
      });
      child_process.execFileSync(
        'git',
        ['commit', '--allow-empty', '-m', 'initial'],
        {cwd: tempDir, env}
      );

      const localGitHubInstance = new LocalGitHub(
        {owner: 'fake', repo: 'fake', defaultBranch: 'main'},
        null as unknown as GitHubApi,
        tempDir
      );

      try {
        await localGitHubInstance.getFileContentsOnBranch(
          'invalid-file.txt',
          'main'
        );
        expect.fail('Expected FileNotFoundError to be thrown');
      } catch (err) {
        expect(err).to.be.instanceOf(FileNotFoundError);
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

    it('finds files by filename on a branch', async () => {
      const files = await localGitHub.findFilesByFilenameAndRef(
        'package.json',
        '12.x'
      );
      expect(files).to.include('package.json');
    });

    it('ignores git submodules and returns only matching files', async () => {
      const {localGitHub: submoduleGitHub} = await createSubmoduleRepo();
      const files = await submoduleGitHub.findFilesByFilename('pom.xml');
      expect(files).to.have.members(['pom.xml', 'packages/pkg/pom.xml']);
    });
  });

  describe('findFilesByGlobAndRef', () => {
    it('finds files by glob', async () => {
      const files = await localGitHub.findFilesByGlobAndRef('*.json', 'main');
      expect(files).to.include('package.json');
    });

    it('finds files by glob on a branch', async () => {
      const files = await localGitHub.findFilesByGlobAndRef('*.json', '12.x');
      expect(files).to.include('package.json');
    });

    it('ignores git submodules and returns only matching files by glob', async () => {
      const {localGitHub: submoduleGitHub} = await createSubmoduleRepo();
      const files = await submoduleGitHub.findFilesByGlob('**/*.py');
      expect(files).to.deep.equal(['packages/pkg/setup.py']);
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

    it('finds files by extension on a branch', async () => {
      const files = await localGitHub.findFilesByExtensionAndRef(
        'json',
        '12.x'
      );
      expect(files).to.include('package.json');
    });

    it('ignores git submodules and returns only matching files by extension', async () => {
      const {localGitHub: submoduleGitHub} = await createSubmoduleRepo();
      const files = await submoduleGitHub.findFilesByExtension('py');
      expect(files).to.deep.equal(['packages/pkg/setup.py']);
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
