import {Commit} from '../../src';
import {
  CommitExclude,
  CommitExcludeConfig,
} from '../../src/util/commit-exclude';
import {expect} from 'chai';

describe('commit-exclude', () => {
  const commitsPerPath: Record<string, Commit[]> = {
    '.': [
      {
        sha: 'pack1Pack2',
        message: 'commit pack1Pack2',
        files: ['pkg1/foo.txt', 'pkg2/bar.txt'],
      },
      {
        sha: 'rootCommit',
        message: 'commit root',
        files: ['foo.txt'],
      },
      {
        sha: 'pack3',
        message: 'commit pack3',
        files: ['pkg3/bar/foo.txt'],
      },
    ],
    pkg1: [
      {
        sha: 'pack1Pack2',
        message: 'commit pack1Pack2',
        files: ['pkg1/foo.txt', 'pkg2/bar.txt'],
      },
    ],
    pkg2: [
      {
        sha: 'pack1Pack2',
        message: 'commit pack1Pack2',
        files: ['pkg1/foo.txt', 'pkg2/bar.txt'],
      },
    ],
    pkg3: [
      {
        sha: 'pack3',
        message: 'commit pack3',
        files: ['pkg3/foo.txt'],
      },
      {
        sha: 'pack3sub',
        message: 'commit pack3sub',
        files: ['pkg3/bar/foo.txt'],
      },
    ],
  };

  it('should not exclude anything if paths are empty', () => {
    const config: Record<string, CommitExcludeConfig> = {};
    const commitExclude = new CommitExclude(config);
    const newCommitsPerPath = commitExclude.excludeCommits(commitsPerPath);
    expect(newCommitsPerPath['.'].length).to.equal(3);
    expect(newCommitsPerPath['pkg1'].length).to.equal(1);
    expect(newCommitsPerPath['pkg2'].length).to.equal(1);
    expect(newCommitsPerPath['pkg3'].length).to.equal(2);
  });

  it('should not exclude only if all files are from excluded path', () => {
    const config: Record<string, CommitExcludeConfig> = {
      '.': {excludePaths: ['pkg3', 'pkg1']},
      pkg3: {excludePaths: ['pkg3/bar']},
    };
    const commitExclude = new CommitExclude(config);
    const newCommitsPerPath = commitExclude.excludeCommits(commitsPerPath);
    expect(newCommitsPerPath['.'].length).to.equal(2);
    expect(newCommitsPerPath['pkg1'].length).to.equal(1);
    expect(newCommitsPerPath['pkg2'].length).to.equal(1);
    expect(newCommitsPerPath['pkg3'].length).to.equal(1);
  });

  it('should exclude if all files are from excluded path', () => {
    const config: Record<string, CommitExcludeConfig> = {
      '.': {excludePaths: ['pkg3', 'pkg1', 'pkg2']},
    };
    const commitExclude = new CommitExclude(config);
    const newCommitsPerPath = commitExclude.excludeCommits(commitsPerPath);
    expect(newCommitsPerPath['.'].length).to.equal(1);
    expect(newCommitsPerPath['pkg1'].length).to.equal(1);
    expect(newCommitsPerPath['pkg2'].length).to.equal(1);
    expect(newCommitsPerPath['pkg3'].length).to.equal(2);
  });
});
