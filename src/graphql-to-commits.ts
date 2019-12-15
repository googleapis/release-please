// Copyright 2019 Google LLC
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

import { GitHub } from './github';

const CONVENTIONAL_COMMIT_REGEX = /^[\w]+(\(\w+\))?!?: /;

// simplified model for working with commits (vs., GraphQL response):

export interface CommitsResponse {
  endCursor?: string;
  hasNextPage: boolean;
  commits: Commit[];
}

export interface Commit {
  sha: string | null;
  message: string;
  files: string[];
}

// define what the expected GraphQL response looks like.

interface CommitHistoryGraphQLResponse {
  repository: { defaultBranchRef: { target: { history: CommitHistory } } };
}

interface CommitHistory {
  edges: CommitEdge[];
  pageInfo: PageInfo;
}

interface CommitEdge {
  node: {
    message: string;
    oid: string;
    associatedPullRequests: { edges: PREdge[] };
  };
}

export interface PREdge {
  node: {
    number: number;
    mergeCommit: { oid: string };
    files: { edges: FileEdge[]; pageInfo: PageInfo };
    labels: { edges: LabelEdge[] };
  };
}

interface FileEdge {
  node: { path: string };
}

interface LabelEdge {
  node: { name: string };
}

interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

export async function graphqlToCommits(
  github: GitHub,
  response: CommitHistoryGraphQLResponse
): Promise<CommitsResponse> {
  const commitHistory: CommitHistory =
    response.repository.defaultBranchRef.target.history;
  const commits: CommitsResponse = {
    endCursor: commitHistory.pageInfo.endCursor,
    hasNextPage: commitHistory.pageInfo.hasNextPage,
    commits: [],
  };
  for (let i = 0, commitEdge: CommitEdge; i < commitHistory.edges.length; i++) {
    commitEdge = commitHistory.edges[i];
    const commit: Commit | undefined = await graphqlToCommit(
      github,
      commitEdge
    );
    // if the commit and its associated PR do not share a sha, we assume
    // that the commit was a push to master and disregard it.
    if (commit) {
      commits.commits.push(commit);
    }
  }
  return commits;
}

async function graphqlToCommit(
  github: GitHub,
  commitEdge: CommitEdge
): Promise<Commit | undefined> {
  const commit = {
    sha: commitEdge.node.oid,
    message: commitEdge.node.message,
    files: [],
  } as Commit;

  // TODO(bcoe): currently, due to limitations with the GitHub v4 API, we
  // are only able to fetch files associated with a commit if it has
  // an associated PR; this is a problem for code pushed directly to the
  // default branch. We should be mindful of this limitation, and fix when the
  // upstream API changes.
  if (commitEdge.node.associatedPullRequests.edges.length === 0) return commit;

  let prEdge: PREdge = commitEdge.node.associatedPullRequests.edges[0];

  // if the commit.sha and mergeCommit.oid do not match, assume that this
  // was a push to master and drop the commit.
  if (!prEdge.node.mergeCommit || commit.sha !== prEdge.node.mergeCommit.oid) {
    return undefined;
  }

  // if, on the off chance, there are more than 100 files attached to a
  // PR, paginate in the additional files.
  while (true && prEdge.node.files) {
    for (let i = 0, fileEdge; i < prEdge.node.files.edges.length; i++) {
      commit.files.push(prEdge.node.files.edges[i].node.path);
    }
    if (prEdge.node.files.pageInfo.hasNextPage) {
      prEdge = await github.pullRequestFiles(
        prEdge.node.number,
        prEdge.node.files.pageInfo.endCursor
      );
      continue;
    }
    if (prEdge.node.files.pageInfo.hasNextPage === false) break;
  }

  // to help some language teams transition to conventional commits, we allow
  // a label to be used as an alternative to a commit prefix.
  if (
    prEdge.node.labels &&
    CONVENTIONAL_COMMIT_REGEX.test(commit.message) === false
  ) {
    const prefix = prefixFromLabel(prEdge.node.labels.edges);
    if (prefix) {
      commit.message = `${prefix}${commit.message}`;
    }
  }
  return commit;
}

function prefixFromLabel(labels: LabelEdge[]): string | undefined {
  let prefix = undefined;
  let breaking = false;
  for (let i = 0, labelEdge; i < labels.length; i++) {
    labelEdge = labels[i];
    if (labelEdge.node.name === 'feature') {
      prefix = 'feat';
    } else if (labelEdge.node.name === 'fix') {
      prefix = 'fix';
    } else if (labelEdge.node.name === 'semver: major') {
      breaking = true;
    }
  }

  if (prefix) {
    prefix = `${prefix}${breaking ? '!' : ''}: `;
  }

  return prefix;
}
