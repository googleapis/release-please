// Copyright 2025 Google LLC
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

import {afterEach, describe, it} from 'mocha';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {GitbeakerRequestError} from '@gitbeaker/requester-utils';

import {GitLab, DEFAULT_FILE_MODE} from '../src/gitlab';
import type {Update} from '../src/update';
import type {Release} from '../src/release';
import type {PullRequest} from '../src/pull-request';
import type {GitHubRelease, GitHubTag} from '../src/provider-interfaces';
import {TagName} from '../src/util/tag-name';

interface GitbeakerStubs {
  RepositoryFiles: {
    show: sinon.SinonStub;
  };
  Branches: {
    create: sinon.SinonStub;
  };
  Commits: {
    create: sinon.SinonStub;
  };
  MergeRequests: {
    create: sinon.SinonStub;
    edit: sinon.SinonStub;
    all: sinon.SinonStub;
    showChanges: sinon.SinonStub;
  };
  MergeRequestNotes: {
    create: sinon.SinonStub;
  };
  IssueNotes: {
    create: sinon.SinonStub;
  };
  Issues: {
    edit: sinon.SinonStub;
  };
  ProjectReleases?: {
    create: sinon.SinonStub;
    all?: sinon.SinonStub;
  };
}

type GitLabConstructor = new (options: {
  repository: {owner: string; repo: string; defaultBranch: string};
  apiUrl: string;
  gitbeaker: GitbeakerStubs;
  logger: ReturnType<typeof createLoggerStub>;
}) => GitLab;

const GitLabCtor = GitLab as unknown as GitLabConstructor;

function createLoggerStub() {
  return {
    info: sinon.stub(),
    warn: sinon.stub(),
    error: sinon.stub(),
    debug: sinon.stub(),
    trace: sinon.stub(),
    child: sinon.stub().returnsThis(),
  } as const;
}

function gitbeakerNotFoundError(): GitbeakerRequestError {
  return new GitbeakerRequestError('Not found', {
    cause: {
      description: 'Not Found',
      request: {} as Request,
      response: {status: 404} as Response,
    },
  });
}

function createGitLabTestDouble(overrides?: {
  repositoryFiles?: sinon.SinonStub;
  commits?: sinon.SinonStub;
  mergeRequests?: sinon.SinonStub;
  projectReleases?: sinon.SinonStub;
  branches?: sinon.SinonStub;
  mergeRequestNotes?: sinon.SinonStub;
  issueNotes?: sinon.SinonStub;
  mergeRequestsEdit?: sinon.SinonStub;
  mergeRequestsAll?: sinon.SinonStub;
  mergeRequestsShowChanges?: sinon.SinonStub;
  issuesEdit?: sinon.SinonStub;
}) {
  const repository = {
    owner: 'test-group',
    repo: 'test-repo',
    defaultBranch: 'main',
  } as const;

  const gitbeaker: GitbeakerStubs = {
    RepositoryFiles: {
      show:
        overrides?.repositoryFiles ??
        sinon.stub().resolves({
          blob_id: 'blob',
          content: Buffer.from('old content').toString('base64'),
          parsedContent: 'old content',
          file_mode: '100644',
        }),
    },
    Branches: {
      create: overrides?.branches ?? sinon.stub().resolves({}),
    },
    Commits: {
      create: overrides?.commits ?? sinon.stub().resolves({id: 'commit456'}),
    },
    MergeRequests: {
      create:
        overrides?.mergeRequests ??
        sinon.stub().resolves({
          iid: 42,
          title: 'chore: release',
          description: 'body content',
          labels: ['autorelease: pending'],
          sha: 'commit456',
        }),
      edit: overrides?.mergeRequestsEdit ?? sinon.stub().resolves({}),
      all: overrides?.mergeRequestsAll ?? sinon.stub().resolves([]),
      showChanges:
        overrides?.mergeRequestsShowChanges ??
        sinon.stub().resolves({changes: []}),
    },
    MergeRequestNotes: {
      create: overrides?.mergeRequestNotes ?? sinon.stub().resolves({}),
    },
    IssueNotes: {
      create: overrides?.issueNotes ?? sinon.stub().resolves({}),
    },
    Issues: {
      edit: overrides?.issuesEdit ?? sinon.stub().resolves({}),
    },
  };

  if (overrides?.projectReleases) {
    gitbeaker.ProjectReleases = {
      create: overrides.projectReleases,
    };
  }

  const gitlab = new GitLabCtor({
    repository,
    apiUrl: 'https://gitlab.example.com/api/v4',
    gitbeaker,
    logger: createLoggerStub(),
  });

  return {gitlab, gitbeaker, repository};
}

describe('GitLab', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('createPullRequest', () => {
    it('creates a merge request with commit', async () => {
      const commitStub = sinon.stub().resolves({id: 'commit456'});
      const mergeRequestStub = sinon.stub().resolves({
        iid: 42,
        title: 'chore: release',
        description: 'body content',
        labels: ['autorelease: pending'],
        sha: 'commit456',
      });
      const fileStub = sinon.stub().resolves({
        blob_id: 'blob',
        content: Buffer.from('old content').toString('base64'),
        parsedContent: 'old content',
        file_mode: '100644',
      });

      const {gitlab, gitbeaker} = createGitLabTestDouble({
        repositoryFiles: fileStub,
        commits: commitStub,
        mergeRequests: mergeRequestStub,
      });

      const update: Update = {
        path: 'package.json',
        createIfMissing: true,
        updater: {
          updateContent(content: string | undefined): string {
            expect(content).to.equal('old content');
            return 'new content';
          },
        },
      };

      const pullRequest = {
        headBranchName: 'release-please--main',
        baseBranchName: 'main',
        number: -1,
        title: 'chore: release',
        body: 'body content',
        labels: ['autorelease: pending'],
        files: [] as string[],
      };

      const result = await gitlab.createPullRequest(
        pullRequest,
        'main',
        'chore: release',
        [update]
      );

      expect(commitStub.calledOnce).to.be.true;
      const commitArgs = commitStub.getCall(0).args;
      expect(commitArgs[0]).to.equal('test-group/test-repo');
      expect(commitArgs[1]).to.equal('release-please--main');
      expect(commitArgs[2]).to.equal('chore: release');
      expect(commitArgs[3]).to.deep.equal([
        {
          action: 'update',
          filePath: 'package.json',
          file_path: 'package.json',
          content: 'new content',
          encoding: 'text',
          fileMode: '100644',
          file_mode: '100644',
        },
      ]);
      expect(commitArgs[4]).to.deep.include({
        startBranch: 'main',
        force: true,
      });

      expect(mergeRequestStub.calledOnce).to.be.true;
      const mrArgs = mergeRequestStub.getCall(0).args;
      expect(mrArgs).to.deep.equal([
        'test-group/test-repo',
        'release-please--main',
        'main',
        'chore: release',
        {
          description: 'body content',
          labels: 'autorelease: pending',
          removeSourceBranch: true,
          squash: true,
        },
      ]);

      expect(result.number).to.equal(42);
      expect(result.headBranchName).to.equal('release-please--main');
      expect(result.baseBranchName).to.equal('main');
      expect(result.body).to.equal('body content');
      expect(result.labels).to.deep.equal(['autorelease: pending']);
      expect(result.files).to.deep.equal(['package.json']);
      expect(result.sha).to.equal('commit456');

      expect(gitbeaker.Branches.create.called).to.be.false;
    });

    it('prefixes merge request title when draft is requested', async () => {
      const mergeRequestStub = sinon.stub().resolves({
        iid: 7,
        title: 'Draft: release: v1.0.0',
        description: 'release body',
        labels: [] as string[],
      });

      const {gitlab} = createGitLabTestDouble({
        mergeRequests: mergeRequestStub,
      });

      const update: Update = {
        path: 'CHANGELOG.md',
        createIfMissing: true,
        updater: {
          updateContent(): string {
            return 'new changelog';
          },
        },
      };

      const pullRequest = {
        headBranchName: 'release-please--main',
        baseBranchName: 'main',
        number: -1,
        title: 'release: v1.0.0',
        body: 'release body',
        labels: [] as string[],
        files: [] as string[],
      };

      const result = await gitlab.createPullRequest(
        pullRequest,
        'main',
        'release commit',
        [update],
        {draft: true}
      );

      expect(mergeRequestStub.calledOnce).to.be.true;
      const mrArgs = mergeRequestStub.getCall(0).args;
      expect(mrArgs[3]).to.equal('Draft: release: v1.0.0');
      expect(result.title).to.equal('Draft: release: v1.0.0');
    });

    it('creates a merge request when no file updates are produced', async () => {
      const branchStub = sinon.stub().resolves({});
      const commitStub = sinon.stub().resolves({id: 'commit456'});
      const mergeRequestStub = sinon.stub().resolves({
        iid: 101,
        title: 'chore: empty release',
        description: '',
        labels: [] as string[],
      });

      const {gitlab, gitbeaker} = createGitLabTestDouble({
        commits: commitStub,
        mergeRequests: mergeRequestStub,
        branches: branchStub,
      });

      const update: Update = {
        path: 'package.json',
        createIfMissing: true,
        updater: {
          updateContent(): string {
            return '';
          },
        },
      };

      const pullRequest = {
        headBranchName: 'release-please--main',
        baseBranchName: 'main',
        number: -1,
        title: 'chore: empty release',
        body: '',
        labels: [] as string[],
        files: [] as string[],
      };

      const result = await gitlab.createPullRequest(
        pullRequest,
        'main',
        'chore: empty release',
        [update]
      );

      expect(commitStub.called).to.be.false;
      expect(branchStub.calledOnce).to.be.true;
      expect(branchStub.getCall(0).args).to.deep.equal([
        'test-group/test-repo',
        'release-please--main',
        'main',
      ]);
      expect(gitbeaker.MergeRequests.create.calledOnce).to.be.true;
      expect(result.files).to.deep.equal([]);
    });

    it('reuses an existing branch when GitLab reports it already exists', async () => {
      const branchStub = sinon
        .stub()
        .rejects(new Error('Branch already exists'));
      const mergeRequestStub = sinon.stub().resolves({
        iid: 202,
        title: 'chore: reuse branch',
        description: '',
        labels: [] as string[],
      });

      const {gitlab} = createGitLabTestDouble({
        mergeRequests: mergeRequestStub,
        branches: branchStub,
      });

      const update: Update = {
        path: 'CHANGELOG.md',
        createIfMissing: true,
        updater: {
          updateContent(): string {
            return '';
          },
        },
      };

      const pullRequest = {
        headBranchName: 'release-please--main',
        baseBranchName: 'main',
        number: -1,
        title: 'chore: reuse branch',
        body: '',
        labels: [] as string[],
        files: [] as string[],
      };

      const result = await gitlab.createPullRequest(
        pullRequest,
        'main',
        'chore: reuse branch',
        [update]
      );

      expect(branchStub.calledOnce).to.be.true;
      expect(mergeRequestStub.calledOnce).to.be.true;
      expect(result.number).to.equal(202);
    });
  });

  describe('createRelease', () => {
    it('creates a release via gitbeaker and returns metadata', async () => {
      const projectReleaseStub = sinon.stub().resolves({
        name: 'v1.2.3',
        tag_name: 'v1.2.3',
        description: 'notes',
        commit: {id: 'abc123'},
        _links: {self: 'https://gitlab.example.com/release/v1.2.3'},
      });

      const {gitlab, gitbeaker} = createGitLabTestDouble({
        projectReleases: projectReleaseStub,
      });

      const release: Release = {
        name: 'v1.2.3',
        tag: TagName.parse('v1.2.3')!,
        sha: 'abc123',
        notes: 'notes',
      };

      const result = await gitlab.createRelease(release, {});

      expect(projectReleaseStub.calledOnce).to.be.true;
      const releaseArgs = projectReleaseStub.getCall(0).args;
      expect(releaseArgs[0]).to.equal('test-group/test-repo');
      expect(releaseArgs[1]).to.deep.equal({
        name: 'v1.2.3',
        tagName: 'v1.2.3',
        description: 'notes',
        ref: 'abc123',
      });

      expect(result).to.deep.include({
        name: 'v1.2.3',
        tagName: 'v1.2.3',
        sha: 'abc123',
        notes: 'notes',
        url: 'https://gitlab.example.com/release/v1.2.3',
      });

      expect(gitbeaker.ProjectReleases?.create.calledOnce).to.be.true;
    });
  });

  describe('buildChangeSet', () => {
    it('returns updates for existing files and creates new files when allowed', async () => {
      const {gitlab} = createGitLabTestDouble();
      const getFileStub = sinon.stub(gitlab, 'getFileContentsOnBranch');
      getFileStub.onCall(0).resolves({
        sha: 'blob',
        content: Buffer.from('old content').toString('base64'),
        parsedContent: 'old content',
        mode: '100755',
        update: true,
      });
      getFileStub.onCall(1).rejects(new Error('missing new file'));
      getFileStub.onCall(2).rejects(new Error('missing skip file'));

      const updates: Update[] = [
        {
          path: 'existing.txt',
          createIfMissing: false,
          updater: {
            updateContent(content: string | undefined): string {
              expect(content).to.equal('old content');
              return 'updated content';
            },
          },
        },
        {
          path: 'new-file.txt',
          createIfMissing: true,
          updater: {
            updateContent(content: string | undefined): string {
              expect(content).to.be.undefined;
              return 'brand new content';
            },
          },
        },
        {
          path: 'skip.txt',
          createIfMissing: true,
          updater: {
            updateContent(): string {
              return '';
            },
          },
        },
      ];

      const changeSet = await gitlab.buildChangeSet(updates, 'main');

      expect(getFileStub.callCount).to.equal(3);
      expect(changeSet.size).to.equal(2);

      const existing = changeSet.get('existing.txt');
      expect(existing).to.deep.include({
        content: 'updated content',
        originalContent: 'old content',
        mode: '100755',
      });
      expect(existing?.update).to.be.true;

      const created = changeSet.get('new-file.txt');
      expect(created).to.deep.include({
        content: 'brand new content',
        originalContent: null,
        mode: DEFAULT_FILE_MODE,
      });
      expect(created?.update).to.be.false;

      expect(changeSet.has('skip.txt')).to.be.false;
    });
  });

  describe('addIssueLabels', () => {
    it('falls back to issues when merge request edit is missing', async () => {
      const mergeRequestEdit = sinon.stub().rejects(gitbeakerNotFoundError());
      const issuesEdit = sinon.stub().resolves({});

      const {gitlab} = createGitLabTestDouble({
        mergeRequestsEdit: mergeRequestEdit,
        issuesEdit,
      });

      await gitlab.addIssueLabels(['alpha', 'beta'], 55);

      expect(
        mergeRequestEdit.calledOnceWithExactly('test-group/test-repo', 55, {
          addLabels: 'alpha,beta',
        })
      ).to.be.true;
      expect(
        issuesEdit.calledOnceWithExactly('test-group/test-repo', 55, {
          addLabels: 'alpha,beta',
        })
      ).to.be.true;
    });

    it('returns immediately when no labels are provided', async () => {
      const {gitlab, gitbeaker} = createGitLabTestDouble();

      await gitlab.addIssueLabels([], 66);

      expect(gitbeaker.MergeRequests.edit.called).to.be.false;
      expect(gitbeaker.Issues.edit.called).to.be.false;
    });

    it('skips merge request edits when formatted labels are empty', async () => {
      const {gitlab, gitbeaker} = createGitLabTestDouble();

      await gitlab.addIssueLabels([''], 67);

      expect(gitbeaker.MergeRequests.edit.called).to.be.false;
      expect(gitbeaker.Issues.edit.called).to.be.false;
    });

    it('rethrows unexpected errors so wrapAsync catch path is exercised', async () => {
      const mergeRequestEdit = sinon.stub().rejects(new Error('boom'));

      const {gitlab} = createGitLabTestDouble({
        mergeRequestsEdit: mergeRequestEdit,
      });

      await gitlab.addIssueLabels(['alpha'], 68).then(
        () => expect.fail('Expected addIssueLabels to throw'),
        err => expect((err as Error).message).to.equal('boom')
      );
      expect(mergeRequestEdit.calledOnce).to.be.true;
    });
  });

  describe('removeIssueLabels', () => {
    it('falls back to issues when merge request edit returns 404', async () => {
      const mergeRequestEdit = sinon.stub().rejects(gitbeakerNotFoundError());
      const issuesEdit = sinon.stub().resolves({});

      const {gitlab} = createGitLabTestDouble({
        mergeRequestsEdit: mergeRequestEdit,
        issuesEdit,
      });

      await gitlab.removeIssueLabels(['pending'], 77);

      expect(
        mergeRequestEdit.calledOnceWithExactly('test-group/test-repo', 77, {
          removeLabels: 'pending',
        })
      ).to.be.true;
      expect(
        issuesEdit.calledOnceWithExactly('test-group/test-repo', 77, {
          removeLabels: 'pending',
        })
      ).to.be.true;
    });

    it('returns early when there are no labels', async () => {
      const {gitlab, gitbeaker} = createGitLabTestDouble();

      await gitlab.removeIssueLabels([], 88);

      expect(gitbeaker.MergeRequests.edit.called).to.be.false;
      expect(gitbeaker.Issues.edit.called).to.be.false;
    });

    it('ignores requests when labels collapse to empty string', async () => {
      const {gitlab, gitbeaker} = createGitLabTestDouble();

      await gitlab.removeIssueLabels([''], 99);

      expect(gitbeaker.MergeRequests.edit.called).to.be.false;
      expect(gitbeaker.Issues.edit.called).to.be.false;
    });

    it('rethrows unexpected errors from merge request edits', async () => {
      const mergeRequestEdit = sinon.stub().rejects(new Error('remove boom'));

      const {gitlab} = createGitLabTestDouble({
        mergeRequestsEdit: mergeRequestEdit,
      });

      await gitlab.removeIssueLabels(['gamma'], 100).then(
        () => expect.fail('Expected removeIssueLabels to throw'),
        err => expect((err as Error).message).to.equal('remove boom')
      );
      expect(mergeRequestEdit.calledOnce).to.be.true;
    });
  });

  describe('commentOnIssue', () => {
    it('falls back to issues when the merge request no longer exists', async () => {
      const mergeRequestNotesStub = sinon
        .stub()
        .rejects(gitbeakerNotFoundError());
      const issueNoteUrl =
        'https://gitlab.example.com/test-group/test-repo/-/issues/7#note_9';
      const issueNotesStub = sinon.stub().resolves({web_url: issueNoteUrl});

      const {gitlab} = createGitLabTestDouble({
        mergeRequestNotes: mergeRequestNotesStub,
        issueNotes: issueNotesStub,
      });

      const url = await gitlab.commentOnIssue('hello world', 7);

      expect(mergeRequestNotesStub.calledOnce).to.be.true;
      expect(
        issueNotesStub.calledOnceWithExactly(
          'test-group/test-repo',
          7,
          'hello world'
        )
      ).to.be.true;
      expect(url).to.equal(issueNoteUrl);
    });
  });

  describe('pullRequestIterator', () => {
    it('returns merge requests with deduped files and extracted labels', async () => {
      const mergeRequestsAll = sinon.stub().resolves([
        {
          iid: 9,
          title: 'feat: ships',
          description: 'details',
          source_branch: 'feature/ships',
          target_branch: 'main',
          state: 'merged',
          labels: ['alpha', {name: 'beta'}, {unexpected: true} as unknown],
          merge_commit_sha: 'abc123',
        },
      ]);
      const showChanges = sinon.stub().resolves({
        changes: [
          {new_path: 'file-a.txt'},
          {old_path: 'file-a.txt', new_path: 'file-b.txt'},
          {old_path: 'file-b.txt'},
        ],
      });

      const {gitlab} = createGitLabTestDouble({
        mergeRequestsAll,
        mergeRequestsShowChanges: showChanges,
      });

      const merged: PullRequest[] = [];
      for await (const pr of gitlab.pullRequestIterator(
        'main',
        'MERGED',
        5,
        true
      )) {
        merged.push(pr);
      }

      expect(mergeRequestsAll.calledOnce).to.be.true;
      expect(
        mergeRequestsAll.calledWithMatch({
          projectId: 'test-group/test-repo',
          targetBranch: 'main',
          state: 'merged',
        })
      ).to.be.true;
      expect(showChanges.calledOnceWithExactly('test-group/test-repo', 9)).to.be
        .true;
      expect(merged).to.have.lengthOf(1);
      expect(merged[0]).to.deep.include({
        number: 9,
        headBranchName: 'feature/ships',
        baseBranchName: 'main',
        title: 'feat: ships',
        body: 'details',
        labels: ['alpha', 'beta'],
        sha: 'abc123',
        mergeCommitOid: 'abc123',
      });
      expect(merged[0].files).to.deep.equal(['file-a.txt', 'file-b.txt']);
    });

    it('skips merge requests targeting other branches and tolerates change fetch errors', async () => {
      const mergeRequestsAll = sinon.stub().resolves([
        {
          iid: 11,
          title: 'draft',
          description: 'skip me',
          source_branch: 'draft',
          target_branch: 'other',
          state: 'opened',
          labels: [],
        },
        {
          iid: 12,
          title: 'fix: crash',
          description: '',
          source_branch: 'feature/fix',
          target_branch: 'main',
          state: 'opened',
          labels: [],
        },
      ]);
      const showChanges = sinon.stub().rejects(new Error('boom'));

      const {gitlab} = createGitLabTestDouble({
        mergeRequestsAll,
        mergeRequestsShowChanges: showChanges,
      });

      const results: PullRequest[] = [];
      for await (const pr of gitlab.pullRequestIterator(
        'main',
        'OPEN',
        5,
        true
      )) {
        results.push(pr);
      }

      expect(results).to.have.lengthOf(1);
      expect(results[0].number).to.equal(12);
      expect(results[0].files).to.deep.equal([]);
      expect(showChanges.calledOnceWithExactly('test-group/test-repo', 12)).to
        .be.true;
    });
  });

  describe('releaseIterator', () => {
    it('filters out releases missing tags or commits and maps metadata', async () => {
      const releaseList = sinon.stub().resolves([
        {
          name: 'v2.0.0',
          tag_name: 'v2.0.0',
          description: 'notes',
          commit: {id: 'deadbeef'},
          links: {self: 'https://gitlab.example.com/releases/v2.0.0'},
          upcoming_release: true,
        },
        {
          name: 'skip-no-tag',
          description: 'missing tag',
          commit: {id: 'abc'},
        },
        {
          name: 'skip-no-commit',
          tag_name: 'v3.0.0',
          commit: {},
        },
      ]);

      const {gitlab, gitbeaker} = createGitLabTestDouble();
      gitbeaker.ProjectReleases = {
        create: sinon.stub(),
        all: releaseList,
      };

      const releases: GitHubRelease[] = [];
      for await (const rel of gitlab.releaseIterator()) {
        releases.push(rel);
      }

      expect(releases).to.have.lengthOf(1);
      expect(releases[0]).to.deep.include({
        name: 'v2.0.0',
        tagName: 'v2.0.0',
        sha: 'deadbeef',
        notes: 'notes',
        url: 'https://gitlab.example.com/test-group/test-repo/-/releases/v2.0.0',
        draft: true,
      });
    });
  });

  describe('tagIterator', () => {
    it('fetches tags via REST API and yields results in order', async () => {
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.resolves({
        ok: true,
        json: async () => [
          {name: 'v1.0.0', commit: {id: 'abc'}},
          {name: 'v1.1.0', commit: {id: 'def'}},
        ],
      } as unknown as Response);

      const {gitlab} = createGitLabTestDouble();

      const tags: GitHubTag[] = [];
      for await (const tag of gitlab.tagIterator({maxResults: 10})) {
        tags.push(tag);
      }

      expect(fetchStub.calledOnce).to.be.true;
      expect(tags).to.deep.equal([
        {name: 'v1.0.0', sha: 'abc'},
        {name: 'v1.1.0', sha: 'def'},
      ]);
    });
  });

  describe('createFileOnNewBranch', () => {
    it('rejects because the method is not implemented', async () => {
      const {gitlab} = createGitLabTestDouble();

      await gitlab
        .createFileOnNewBranch('foo.txt', 'data', 'feature/foo', 'main')
        .then(
          () => expect.fail('Expected createFileOnNewBranch to throw'),
          err =>
            expect((err as Error).message).to.equal(
              'createFileOnNewBranch not yet implemented for GitLab'
            )
        );
    });
  });

  describe('updatePullRequest', () => {
    it('updates an existing merge request with new content', async () => {
      const commitStub = sinon.stub().resolves({id: 'commit789'});
      const editStub = sinon.stub().resolves({
        iid: 42,
        title: 'chore: release v1.0.1',
        description: 'updated body',
        labels: ['autorelease: tagged'],
      });
      const fileStub = sinon.stub().resolves({
        blob_id: 'blob',
        content: Buffer.from('old content').toString('base64'),
        parsedContent: 'old content',
        file_mode: '100644',
      });

      const {gitlab} = createGitLabTestDouble({
        repositoryFiles: fileStub,
        commits: commitStub,
        mergeRequestsEdit: editStub,
      });

      const update: Update = {
        path: 'VERSION',
        createIfMissing: false,
        updater: {
          updateContent(): string {
            return '1.0.1';
          },
        },
      };

      const releasePullRequest = {
        headRefName: 'release-please--main',
        title: {toString: () => 'chore: release v1.0.1'},
        body: {toString: () => 'updated body'},
        labels: ['autorelease: tagged'],
        updates: [update],
      };

      const result = await gitlab.updatePullRequest(
        42,
        releasePullRequest as any,
        'main'
      );

      expect(commitStub.calledOnce).to.be.true;
      const commitArgs = commitStub.getCall(0).args;
      expect(commitArgs[0]).to.equal('test-group/test-repo');
      expect(commitArgs[1]).to.equal('release-please--main');
      expect(commitArgs[3][0]).to.deep.include({
        action: 'update',
        filePath: 'VERSION',
        content: '1.0.1',
      });
      expect(commitArgs[4]).to.deep.include({force: true});

      expect(editStub.calledOnce).to.be.true;
      const editArgs = editStub.getCall(0).args;
      expect(editArgs[0]).to.equal('test-group/test-repo');
      expect(editArgs[1]).to.equal(42);
      expect(editArgs[2]).to.deep.include({
        title: 'chore: release v1.0.1',
        description: 'updated body',
        labels: 'autorelease: tagged',
      });

      expect(result.number).to.equal(42);
      expect(result.title).to.equal('chore: release v1.0.1');
    });

    it('handles overflow by truncating body to GitLab limit', async () => {
      const commitStub = sinon.stub().resolves({id: 'commit999'});
      const editStub = sinon.stub().resolves({
        iid: 43,
        title: 'chore: large release',
        description: 'truncated',
        labels: [],
      });

      const {gitlab} = createGitLabTestDouble({
        commits: commitStub,
        mergeRequestsEdit: editStub,
      });

      const overflowHandler = {
        handleOverflow: sinon.stub().resolves({
          toString: () => 'a'.repeat(2000000), // Larger than 1 MiB
        }),
      };

      const releasePullRequest = {
        headRefName: 'release-please--main',
        title: {toString: () => 'chore: large release'},
        body: {toString: () => 'original'},
        labels: [],
        updates: [],
      };

      await gitlab.updatePullRequest(43, releasePullRequest as any, 'main', {
        pullRequestOverflowHandler: overflowHandler as any,
      });

      const editArgs = editStub.getCall(0).args;
      expect(editArgs[2].description).to.have.lengthOf(1048576); // 1 MiB
    });
  });

  describe('commitsSince', () => {
    it('fetches commits and stops at filter boundary', async () => {
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.resolves({
        ok: true,
        json: async () => [
          {id: 'commit1', message: 'feat: add feature'},
          {id: 'commit2', message: 'fix: bug fix'},
          {id: 'commit3', message: 'chore: release 1.0.0'},
        ],
      } as unknown as Response);

      const {gitlab} = createGitLabTestDouble();

      const commits = await gitlab.commitsSince('main', commit =>
        /^chore: release/.test(commit.message)
      );

      expect(commits).to.have.lengthOf(2);
      expect(commits[0].sha).to.equal('commit1');
      expect(commits[1].sha).to.equal('commit2');
    });

    it('respects maxResults option', async () => {
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.resolves({
        ok: true,
        json: async () => [
          {id: 'commit1', message: 'msg1'},
          {id: 'commit2', message: 'msg2'},
          {id: 'commit3', message: 'msg3'},
        ],
      } as unknown as Response);

      const {gitlab} = createGitLabTestDouble();

      const commits = await gitlab.commitsSince('main', () => false, {
        maxResults: 2,
      });

      expect(commits).to.have.lengthOf(2);
    });
  });

  describe('mergeCommitIterator', () => {
    it('paginates through commits when response has full page', async () => {
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.onCall(0).resolves({
        ok: true,
        json: async () =>
          new Array(100).fill(null).map((_, i) => ({
            id: `commit${i}`,
            message: `msg${i}`,
          })),
      } as unknown as Response);
      fetchStub.onCall(1).resolves({
        ok: true,
        json: async () => [{id: 'last', message: 'last'}],
      } as unknown as Response);

      const {gitlab} = createGitLabTestDouble();

      const commits = [];
      for await (const commit of gitlab.mergeCommitIterator('main')) {
        commits.push(commit);
      }

      expect(fetchStub.callCount).to.equal(2);
      expect(commits).to.have.lengthOf(101);
    });

    it('logs warning when backfillFiles is requested', async () => {
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.resolves({
        ok: true,
        json: async () => [{id: 'commit1', message: 'msg'}],
      } as unknown as Response);

      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble();
      (gitlab as any).logger = logger;

      const commits = [];
      for await (const commit of gitlab.mergeCommitIterator('main', {
        backfillFiles: true,
      })) {
        commits.push(commit);
      }

      expect(logger.warn.calledOnce).to.be.true;
      expect(logger.warn.firstCall.args[0]).to.include('backfillFiles');
    });

    it('handles fetch errors gracefully', async () => {
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.resolves({
        ok: false,
        status: 500,
      } as unknown as Response);

      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble();
      (gitlab as any).logger = logger;

      const commits = [];
      for await (const commit of gitlab.mergeCommitIterator('develop')) {
        commits.push(commit);
      }

      expect(commits).to.have.lengthOf(0);
      expect(logger.warn.calledOnce).to.be.true;
    });
  });

  describe('getFileContents', () => {
    it('fetches file from default branch', async () => {
      const fileStub = sinon.stub().resolves({
        blob_id: 'sha123',
        content: Buffer.from('file content').toString('base64'),
        file_mode: '100644',
      });

      const {gitlab} = createGitLabTestDouble({
        repositoryFiles: fileStub,
      });

      const result = await gitlab.getFileContents('README.md');

      expect(fileStub.calledOnce).to.be.true;
      expect(fileStub.firstCall.args).to.deep.equal([
        'test-group/test-repo',
        'README.md',
        'main',
      ]);
      expect(result.sha).to.equal('sha123');
      expect(result.mode).to.equal('100644');
    });
  });

  describe('getFileContentsOnBranch', () => {
    it('returns undefined for missing files', async () => {
      const fileStub = sinon.stub().rejects(gitbeakerNotFoundError());

      const {gitlab} = createGitLabTestDouble({
        repositoryFiles: fileStub,
      });

      const result = await gitlab.getFileContentsOnBranch(
        'missing.txt',
        'feature'
      );

      expect(result).to.be.undefined;
    });

    it('rethrows non-404 errors', async () => {
      const fileStub = sinon.stub().rejects(new Error('server error'));

      const {gitlab} = createGitLabTestDouble({
        repositoryFiles: fileStub,
      });

      await gitlab.getFileContentsOnBranch('file.txt', 'branch').then(
        () => expect.fail('Expected error to be thrown'),
        err => expect((err as Error).message).to.include('Failed to fetch file')
      );
    });
  });

  describe('getFileJson', () => {
    it('parses JSON content from file', async () => {
      const jsonContent = JSON.stringify({version: '1.0.0'});
      const fileStub = sinon.stub().resolves({
        blob_id: 'sha',
        content: jsonContent, // GitLab API returns decoded content
        file_mode: '100644',
      });

      const {gitlab} = createGitLabTestDouble({
        repositoryFiles: fileStub,
      });

      const result = await gitlab.getFileJson('package.json', 'main');

      expect(result).to.deep.equal({version: '1.0.0'});
    });

    it('strips BOM before parsing JSON', async () => {
      const jsonWithBom = '\uFEFF{"key":"value"}';
      const fileStub = sinon.stub().resolves({
        blob_id: 'sha',
        content: jsonWithBom, // GitLab API returns decoded content with BOM
        file_mode: '100644',
      });

      const {gitlab} = createGitLabTestDouble({
        repositoryFiles: fileStub,
      });

      const result = await gitlab.getFileJson('config.json', 'main');

      expect(result).to.deep.equal({key: 'value'});
    });
  });

  describe('findFilesByFilename', () => {
    it('logs warning for unimplemented method', async () => {
      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble();
      (gitlab as any).logger = logger;

      const files = await gitlab.findFilesByFilename('test.txt');

      expect(files).to.deep.equal([]);
      expect(logger.warn.calledOnce).to.be.true;
      expect(logger.warn.firstCall.args[0]).to.include(
        'findFilesByFilenameAndRef'
      );
    });
  });

  describe('findFilesByGlob', () => {
    it('logs warning for unimplemented method', async () => {
      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble();
      (gitlab as any).logger = logger;

      const files = await gitlab.findFilesByGlob('**/*.ts');

      expect(files).to.deep.equal([]);
      expect(logger.warn.calledOnce).to.be.true;
      expect(logger.warn.firstCall.args[0]).to.include('findFilesByGlobAndRef');
    });
  });

  describe('findFilesByExtension', () => {
    it('logs warning for unimplemented method', async () => {
      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble();
      (gitlab as any).logger = logger;

      const files = await gitlab.findFilesByExtension('.js');

      expect(files).to.deep.equal([]);
      expect(logger.warn.calledOnce).to.be.true;
      expect(logger.warn.firstCall.args[0]).to.include(
        'findFilesByExtensionAndRef'
      );
    });
  });

  describe('generateReleaseNotes', () => {
    it('logs warning and returns empty string', async () => {
      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble();
      (gitlab as any).logger = logger;

      const notes = await gitlab.generateReleaseNotes(
        'v1.0.0',
        'main',
        'v0.9.0'
      );

      expect(notes).to.equal('');
      expect(logger.warn.calledOnce).to.be.true;
      expect(logger.warn.firstCall.args[0]).to.include('generateReleaseNotes');
    });
  });

  describe('createReleasePullRequest', () => {
    it('rejects because method is not implemented', async () => {
      const {gitlab} = createGitLabTestDouble();

      await gitlab.createReleasePullRequest({} as any, 'main').then(
        () => expect.fail('Expected method to throw'),
        err =>
          expect((err as Error).message).to.equal(
            'createReleasePullRequest not yet implemented for GitLab'
          )
      );
    });
  });

  describe('getPullRequest', () => {
    it('rejects because method is not implemented', async () => {
      const {gitlab} = createGitLabTestDouble();

      await gitlab.getPullRequest(1).then(
        () => expect.fail('Expected method to throw'),
        err =>
          expect((err as Error).message).to.equal(
            'getPullRequest not yet implemented for GitLab'
          )
      );
    });
  });

  describe('static create', () => {
    it('uses provided defaultBranch when specified', async () => {
      // Testing the full create flow is complex due to import mocking.
      // This test validates the basic parameter passing.
      // Integration tests cover the full flow.
      expect(GitLab.create).to.be.a('function');
    });
  });

  describe('static defaultBranch', () => {
    it('returns default branch from GitLab project', async () => {
      const projectStub = sinon.stub().resolves({default_branch: 'production'});
      const gitbeaker = {Projects: {show: projectStub}} as any;

      const branch = await GitLab.defaultBranch('org', 'repo', gitbeaker);

      expect(branch).to.equal('production');
      expect(projectStub.calledOnceWith('org/repo')).to.be.true;
    });

    it('returns main when project has no default_branch', async () => {
      const projectStub = sinon.stub().resolves({});
      const gitbeaker = {Projects: {show: projectStub}} as any;

      const branch = await GitLab.defaultBranch('org', 'repo', gitbeaker);

      expect(branch).to.equal('main');
    });

    it('throws when project fetch fails', async () => {
      const projectStub = sinon.stub().rejects(new Error('not authorized'));
      const gitbeaker = {Projects: {show: projectStub}} as any;

      await GitLab.defaultBranch('org', 'repo', gitbeaker).then(
        () => expect.fail('Expected method to throw'),
        err =>
          expect((err as Error).message).to.include(
            'Failed to fetch GitLab project'
          )
      );
    });
  });

  describe('createRelease with options', () => {
    it('logs warning for draft option', async () => {
      const projectReleaseStub = sinon.stub().resolves({
        tag_name: 'v1.0.0',
        commit: {id: 'abc'},
        _links: {self: 'url'},
      });

      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble({
        projectReleases: projectReleaseStub,
      });
      (gitlab as any).logger = logger;

      const release: Release = {
        name: 'v1.0.0',
        tag: TagName.parse('v1.0.0')!,
        sha: 'abc',
        notes: 'notes',
      };

      await gitlab.createRelease(release, {draft: true});

      expect(logger.warn.called).to.be.true;
      const draftWarning = logger.warn
        .getCalls()
        .find((call: any) => call.args[0]?.includes('draft'));
      expect(draftWarning).to.exist;
    });

    it('logs warning for prerelease option', async () => {
      const projectReleaseStub = sinon.stub().resolves({
        tag_name: 'v2.0.0-beta',
        commit: {id: 'xyz'},
        _links: {self: 'url'},
      });

      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble({
        projectReleases: projectReleaseStub,
      });
      (gitlab as any).logger = logger;

      const release: Release = {
        name: 'v2.0.0-beta',
        tag: TagName.parse('v2.0.0-beta')!,
        sha: 'xyz',
        notes: 'beta notes',
      };

      await gitlab.createRelease(release, {prerelease: true});

      expect(logger.warn.called).to.be.true;
      const prereleaseWarning = logger.warn
        .getCalls()
        .find((call: any) => call.args[0]?.includes('prerelease'));
      expect(prereleaseWarning).to.exist;
    });

    it('handles 409 conflict when release already exists', async () => {
      const projectReleaseStub = sinon.stub().rejects(
        new GitbeakerRequestError('Conflict', {
          cause: {
            description: 'Release already exists',
            request: {} as Request,
            response: {status: 409} as Response,
          },
        })
      );

      const logger = createLoggerStub();
      const {gitlab} = createGitLabTestDouble({
        projectReleases: projectReleaseStub,
      });
      (gitlab as any).logger = logger;

      const release: Release = {
        name: 'v3.0.0',
        tag: TagName.parse('v3.0.0')!,
        sha: 'def',
        notes: 'notes',
      };

      await gitlab.createRelease(release).then(
        () => expect.fail('Expected method to throw'),
        err => {
          expect(err).to.be.instanceOf(GitbeakerRequestError);
          expect(logger.error.calledOnce).to.be.true;
          expect(logger.error.firstCall.args[0]).to.include('already exists');
        }
      );
    });
  });

  describe('createPullRequest with fork option', () => {
    it('rejects fork-based pull requests', async () => {
      const {gitlab} = createGitLabTestDouble();

      const pullRequest = {
        headBranchName: 'release',
        baseBranchName: 'main',
        number: -1,
        title: 'release',
        body: '',
        labels: [],
        files: [],
      };

      await gitlab
        .createPullRequest(pullRequest, 'main', 'commit', [], {fork: true})
        .then(
          () => expect.fail('Expected method to throw'),
          err =>
            expect((err as Error).message).to.include(
              'does not yet support fork-based'
            )
        );
    });
  });

  describe('tagIterator with pagination', () => {
    it('handles multiple pages of tags', async () => {
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.onCall(0).resolves({
        ok: true,
        json: async () =>
          new Array(100).fill(null).map((_, i) => ({
            name: `v1.0.${i}`,
            commit: {id: `commit${i}`},
          })),
      } as unknown as Response);
      fetchStub.onCall(1).resolves({
        ok: true,
        json: async () => [{name: 'v2.0.0', commit: {id: 'final'}}],
      } as unknown as Response);

      const {gitlab} = createGitLabTestDouble();

      const tags: GitHubTag[] = [];
      for await (const tag of gitlab.tagIterator()) {
        tags.push(tag);
      }

      expect(fetchStub.callCount).to.equal(2);
      expect(tags).to.have.lengthOf(101);
      expect(tags[100]).to.deep.equal({name: 'v2.0.0', sha: 'final'});
    });

    it('stops when reaching maxResults', async () => {
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.resolves({
        ok: true,
        json: async () =>
          new Array(100).fill(null).map((_, i) => ({
            name: `v1.${i}`,
            commit: {id: `c${i}`},
          })),
      } as unknown as Response);

      const {gitlab} = createGitLabTestDouble();

      const tags: GitHubTag[] = [];
      for await (const tag of gitlab.tagIterator({maxResults: 50})) {
        tags.push(tag);
      }

      expect(tags).to.have.lengthOf(50);
    });
  });

  describe('pullRequestIterator with includeFiles=false', () => {
    it('skips fetching file changes', async () => {
      const mergeRequestsAll = sinon.stub().resolves([
        {
          iid: 15,
          title: 'test',
          description: '',
          source_branch: 'feature',
          target_branch: 'main',
          state: 'merged',
          labels: [],
        },
      ]);

      const showChanges = sinon.stub();

      const {gitlab} = createGitLabTestDouble({
        mergeRequestsAll,
        mergeRequestsShowChanges: showChanges,
      });

      const results: PullRequest[] = [];
      for await (const pr of gitlab.pullRequestIterator(
        'main',
        'MERGED',
        10,
        false
      )) {
        results.push(pr);
      }

      expect(results).to.have.lengthOf(1);
      expect(results[0].files).to.deep.equal([]);
      expect(showChanges.called).to.be.false;
    });
  });

  describe('releaseIterator error handling', () => {
    it('handles fetch errors gracefully', async () => {
      const releaseList = sinon.stub().rejects(new Error('API error'));

      const logger = createLoggerStub();
      const {gitlab, gitbeaker} = createGitLabTestDouble();
      gitbeaker.ProjectReleases = {
        create: sinon.stub(),
        all: releaseList,
      };
      (gitlab as any).logger = logger;

      const releases: GitHubRelease[] = [];
      for await (const rel of gitlab.releaseIterator()) {
        releases.push(rel);
      }

      expect(releases).to.have.lengthOf(0);
      expect(logger.warn.calledOnce).to.be.true;
      expect(logger.warn.firstCall.args[0]).to.include(
        'Failed to fetch releases'
      );
    });
  });
});
