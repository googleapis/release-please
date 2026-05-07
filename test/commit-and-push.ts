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

/* eslint-disable node/no-unsupported-features/node-builtins */

import * as assert from 'assert';
import {describe, it, before, afterEach} from 'mocha';
import {octokit, setup} from './util';
import * as sinon from 'sinon';
import {GetResponseTypeFromEndpointMethod} from '@octokit/types';
import * as handler from '../src/util/code-suggester/github/commit-and-push';
import * as createCommitModule from '../src/util/code-suggester/github/create-commit';
import {
  Changes,
  FileData,
  TreeObject,
  RepoDomain,
  CommitData,
  CommitSigner,
} from '../src/util/code-suggester/types';
import {createCommit} from '../src/util/code-suggester/github/create-commit';
import {CommitError} from '../src/util/code-suggester/errors';

type GetCommitResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.git.getCommit
>;

type CreateTreeResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.git.createTree
>;

type CreateCommitResponse = GetResponseTypeFromEndpointMethod<
  typeof octokit.git.createCommit
>;

class FakeCommitSigner implements CommitSigner {
  signature: string;
  constructor(signature: string) {
    this.signature = signature;
  }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  async generateSignature(_commit: CommitData): Promise<string> {
    return this.signature;
  }
}

before(() => {
  setup();
});

describe('Push', () => {
  const sandbox = sinon.createSandbox();
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const sha = 'asdf1234';
  afterEach(() => {
    sandbox.restore();
  });

  it('GitHub tree objects that are generated correctly for text files in a sub-directory', () => {
    const changes: Changes = new Map();
    changes.set('a/foo.txt', new FileData('Foo content'));
    assert.deepStrictEqual(handler.generateTreeObjects(changes), [
      {
        path: 'a/foo.txt',
        mode: '100644',
        type: 'blob',
        content: 'Foo content',
      },
    ]);
  });
  it('has objects that are generated correctly for text files that are deleted', () => {
    const changes: Changes = new Map();
    changes.set('b/bar.txt', new FileData(null));
    assert.deepStrictEqual(handler.generateTreeObjects(changes), [
      {
        path: 'b/bar.txt',
        mode: '100644',
        type: 'blob',
        sha: null,
      },
    ]);
  });
  it('has objects that are generated correctly for deleted exe files', () => {
    const changes: Changes = new Map();
    changes.set('baz.exe', new FileData(null, '100755'));
    assert.deepStrictEqual(handler.generateTreeObjects(changes), [
      {
        path: 'baz.exe',
        mode: '100755',
        type: 'blob',
        sha: null,
      },
    ]);
  });
  it('has objects that are generated correctly for empty text files', () => {
    const changes: Changes = new Map();
    changes.set('empty.txt', new FileData(''));
    assert.deepStrictEqual(handler.generateTreeObjects(changes), [
      {
        path: 'empty.txt',
        mode: '100644',
        type: 'blob',
        content: '',
      },
    ]);
  });

  it('Calls octokit functions with correct params', async () => {
    const tree: TreeObject[] = [
      {
        path: 'a/foo.txt',
        mode: '100644',
        type: 'blob',
        content: 'Foo content',
      },
      {
        path: 'b/bar.txt',
        mode: '100644',
        type: 'blob',
        sha: null,
      },
      {
        path: 'baz.exe',
        mode: '100755',
        type: 'blob',
        sha: null,
      },
      {
        path: 'empty.txt',
        mode: '100644',
        type: 'blob',
        content: '',
      },
    ];
    const commitResponseData = await import(
      './fixtures/get-commit-response.json'
    );
    const createTreeResponseData = await import(
      './fixtures/create-tree-response.json'
    );
    const getCommitResponse = {
      headers: {},
      status: 200,
      url: 'http://fake-url.com',
      data: commitResponseData,
    } as unknown as GetCommitResponse;
    const createTreeResponse = {
      headers: {},
      status: 201,
      url: 'http://fake-url.com',
      data: createTreeResponseData,
    } as unknown as CreateTreeResponse;
    // setup
    const stubGetCommit = sandbox
      .stub(octokit.git, 'getCommit')
      .resolves(getCommitResponse);
    const stubCreateTree = sandbox
      .stub(octokit.git, 'createTree')
      .resolves(createTreeResponse);
    // tests
    const treeSha = await handler.createTree(octokit, origin, sha, tree);
    sandbox.assert.calledOnceWithExactly(stubGetCommit, {
      owner: origin.owner,
      repo: origin.repo,
      commit_sha: sha,
    });
    sandbox.assert.calledWithExactly(stubCreateTree, {
      owner: origin.owner,
      repo: origin.repo,
      tree,
      base_tree: getCommitResponse.data.tree.sha,
    });
    assert.strictEqual(treeSha, createTreeResponse.data.sha);
  });
});

describe('Commit', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const treeSha = 'TREE-asfd1234';
  const head = 'head-asdf1234';
  const message = 'Hello world';
  it('Invokes octokit function called with correct values', async () => {
    // setup
    const createCommitResponseData = await import(
      './fixtures/create-commit-response.json'
    );
    const createCommitResponse = {
      headers: {},
      status: 201,
      url: 'http://fake-url.com',
      data: createCommitResponseData,
    } as unknown as CreateCommitResponse;
    const stubCreateCommit = sandbox
      .stub(octokit.git, 'createCommit')
      .resolves(createCommitResponse);
    // tests
    const sha = await createCommit(octokit, origin, head, treeSha, message);
    assert.strictEqual(sha, createCommitResponse.data.sha);
    sandbox.assert.calledOnceWithMatch(stubCreateCommit, {
      owner: origin.owner,
      repo: origin.repo,
      message,
      tree: treeSha,
      parents: [head],
    });
  });
});

describe('Update branch reference', () => {
  const sandbox = sinon.createSandbox();
  afterEach(() => {
    sandbox.restore();
  });
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const sha = 'asdf1234';
  it('Invokes octokit function called with correct values', async () => {
    // setup
    const stubUpdateRef = sandbox.stub(octokit.git, 'updateRef');
    // tests
    await handler.updateRef(
      octokit,
      {branch: 'test-branch-name', ...origin},
      sha,
      false
    );
    sandbox.assert.calledOnceWithExactly(stubUpdateRef, {
      owner: origin.owner,
      repo: origin.repo,
      sha,
      ref: 'heads/test-branch-name',
      force: false,
    });
  });
});

describe('Commit and push function', async () => {
  const sandbox = sinon.createSandbox();
  const oldHeadSha = 'OLD-head-Sha-asdf1234';
  const changes: Changes = new Map();
  const origin: RepoDomain = {
    owner: 'Foo',
    repo: 'Bar',
  };
  const branchName = 'test-branch-name';
  const message = 'Hello world';

  const commitResponseData = await import(
    './fixtures/get-commit-response.json'
  );
  const createTreeResponseData = await import(
    './fixtures/create-tree-response.json'
  );
  const getCommitResponse = {
    headers: {},
    status: 200,
    url: 'http://fake-url.com',
    data: commitResponseData,
  } as unknown as GetCommitResponse;
  const createTreeResponse = {
    headers: {},
    status: 201,
    url: 'http://fake-url.com',
    data: createTreeResponseData,
  } as unknown as CreateTreeResponse;

  const createCommitResponseData = await import(
    './fixtures/create-commit-response.json'
  );
  const createCommitResponse = {
    headers: {},
    status: 201,
    url: 'http://fake-url.com',
    data: createCommitResponseData,
  } as unknown as CreateCommitResponse;
  afterEach(() => {
    sandbox.restore();
  });
  it('When everything works it calls functions with correct parameter values', async () => {
    changes.set('foo.txt', {
      mode: '100755',
      content: 'some file content',
    });
    // setup
    const stubGetCommit = sandbox
      .stub(octokit.git, 'getCommit')
      .resolves(getCommitResponse);
    const stubCreateTree = sandbox
      .stub(octokit.git, 'createTree')
      .resolves(createTreeResponse);
    const stubCreateCommit = sandbox
      .stub(octokit.git, 'createCommit')
      .resolves(createCommitResponse);
    const stubUpdateRef = sandbox.stub(octokit.git, 'updateRef');
    // tests
    await handler.commitAndPush(
      octokit,
      oldHeadSha,
      changes,
      {branch: branchName, ...origin},
      message,
      true
    );
    sandbox.assert.calledOnceWithExactly(stubGetCommit, {
      owner: origin.owner,
      repo: origin.repo,
      commit_sha: oldHeadSha,
    });
    sandbox.assert.calledWithExactly(stubCreateTree, {
      owner: origin.owner,
      repo: origin.repo,
      tree: [
        {
          path: 'foo.txt',
          mode: '100755',
          type: 'blob',
          content: 'some file content',
        },
      ],
      base_tree: getCommitResponse.data.tree.sha,
    });
    sandbox.assert.calledOnceWithMatch(stubCreateCommit, {
      owner: origin.owner,
      repo: origin.repo,
      message,
      tree: createTreeResponse.data.sha,
      parents: [oldHeadSha],
    });
    sandbox.assert.calledOnceWithExactly(stubUpdateRef, {
      owner: origin.owner,
      repo: origin.repo,
      sha: createCommitResponse.data.sha,
      ref: 'heads/test-branch-name',
      force: true,
    });
  });
  it('allows configuring a commit signer', async () => {
    changes.set('foo.txt', {
      mode: '100755',
      content: 'some file content',
    });
    // setup
    const stubGetCommit = sandbox
      .stub(octokit.git, 'getCommit')
      .resolves(getCommitResponse);
    const stubCreateTree = sandbox
      .stub(octokit.git, 'createTree')
      .resolves(createTreeResponse);
    const stubCreateCommit = sandbox
      .stub(octokit.git, 'createCommit')
      .resolves(createCommitResponse);
    const stubUpdateRef = sandbox.stub(octokit.git, 'updateRef');
    const fakeSigner = new FakeCommitSigner('fake-signature');
    const options = {
      author: {
        name: 'Test Committer',
        email: 'test-committer@example.com',
      },
      signer: fakeSigner,
    };
    const signatureSpy = sandbox.spy(fakeSigner, 'generateSignature');
    // tests
    await handler.commitAndPush(
      octokit,
      oldHeadSha,
      changes,
      {branch: branchName, ...origin},
      message,
      true,
      options
    );
    sandbox.assert.calledOnceWithExactly(stubGetCommit, {
      owner: origin.owner,
      repo: origin.repo,
      commit_sha: oldHeadSha,
    });
    sandbox.assert.calledWithExactly(stubCreateTree, {
      owner: origin.owner,
      repo: origin.repo,
      tree: [
        {
          path: 'foo.txt',
          mode: '100755',
          type: 'blob',
          content: 'some file content',
        },
      ],
      base_tree: getCommitResponse.data.tree.sha,
    });
    sandbox.assert.calledOnceWithMatch(stubCreateCommit, {
      owner: origin.owner,
      repo: origin.repo,
      message,
      tree: createTreeResponse.data.sha,
      parents: [oldHeadSha],
      signature: 'fake-signature',
      author: {
        name: 'Test Committer',
        email: 'test-committer@example.com',
      },
    });
    sandbox.assert.calledOnceWithExactly(stubUpdateRef, {
      owner: origin.owner,
      repo: origin.repo,
      sha: createCommitResponse.data.sha,
      ref: 'heads/test-branch-name',
      force: true,
    });
    sandbox.assert.calledOnceWithMatch(signatureSpy, {
      message,
      tree: createTreeResponse.data.sha,
      parents: [oldHeadSha],
      author: {
        name: 'Test Committer',
        email: 'test-committer@example.com',
      },
    });
  });
  it('Forwards GitHub error if getCommit fails', async () => {
    const error = new Error('Error committing');
    sandbox.stub(octokit.git, 'getCommit').rejects(error);
    await assert.rejects(handler.createTree(octokit, origin, '', []), error);
  });
  it('Forwards GitHub error if createTree fails', async () => {
    // setup
    const error = new Error('Error committing');
    sandbox.stub(octokit.git, 'getCommit').resolves(getCommitResponse);
    sandbox.stub(octokit.git, 'createTree').rejects(error);
    // tests
    await assert.rejects(
      handler.createTree(octokit, origin, '', [
        {path: 'foo.txt', type: 'blob', mode: '100755'},
      ]),
      e => e instanceof CommitError && e.cause === error
    );
  });
  it('groups files into batches', async () => {
    for (let i = 0; i < 10; i++) {
      changes.set(`path${i}`, {
        mode: '100755',
        content: 'some file content',
      });
    }
    sandbox.stub(octokit.git, 'getCommit').resolves(getCommitResponse);
    const createCommitStub = sandbox
      .stub(createCommitModule, 'createCommit')
      .resolves('commitsha1')
      .onSecondCall()
      .resolves('commitsha2');
    const createTreeStub = sandbox.stub(octokit.git, 'createTree').resolves({
      data: {
        sha: 'createdsha1',
        url: 'unused',
        truncated: false,
        tree: [
          {
            path: 'path1',
            type: 'blob',
            mode: '100755',
          },
        ],
      },
      headers: {},
      status: 201,
      url: 'unused',
    });
    const updateRefStub = sandbox.stub(octokit.git, 'updateRef').resolves();

    await handler.commitAndPush(
      octokit,
      oldHeadSha,
      changes,
      {branch: branchName, ...origin},
      message,
      true,
      {filesPerCommit: 6}
    );

    sinon.assert.calledTwice(createTreeStub);
    sinon.assert.calledTwice(createCommitStub);
    sinon.assert.calledOnce(updateRefStub);
  });
});
