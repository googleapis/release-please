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

import { GitHub } from './github';

// simplified model for working with commits (vs., GraphQL response):

export interface CommitsResponse {
  endCursor?: string;
  hasNextPage: boolean;
  commits: Commit[];
}

export interface Commit {
  sha: string;
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
  node: { number: number; files: { edges: FileEdge[]; pageInfo: PageInfo } };
}

interface FileEdge {
  node: { path: string };
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
    const commit: Commit = await graphqlToCommit(github, commitEdge);
    commits.commits.push(commit);
  }
  return commits;
}

async function graphqlToCommit(
  github: GitHub,
  commitEdge: CommitEdge
): Promise<Commit> {
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

  // if, on the off chance, there are more than 100 files attached to a
  // PR, paginate in the additional files.
  while (true) {
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

  return commit;
}
