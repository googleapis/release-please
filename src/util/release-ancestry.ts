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

import {Commit} from '../commit';

/**
 * Tracks which walked commits each release already contains.
 *
 * Commit history arrives newest committer date first, not in graph order.
 * A branch cut before a release and merged after it keeps its older dates,
 * so its commits sort behind the release commit. Stopping at the release
 * commit drops them (googleapis/release-please#2883). Feed every walked
 * commit to `visit`; `isComplete` says when no unwalked commit can be
 * missing from a release and every walked commit can be classified, and
 * `notReleasedBy` filters a walked list down to what a given release does
 * not contain.
 *
 * When any walked commit lacks `parents`, ancestry is unknown: `isComplete`
 * is always true and `notReleasedBy` returns `undefined`, so callers keep
 * the date-order behavior.
 */
export class ReleaseAncestry {
  private tracking = true;
  // Walked commit SHA => its parent SHAs.
  private readonly parentsOf = new Map<string, string[]>();
  // Commits known to be reachable from the walk's head, through walked edges.
  private readonly reached = new Set<string>();
  // Reached commits that have not been walked yet.
  private readonly frontier = new Set<string>();
  // Walked commits not yet linked to the head. Skewed dates can sort a
  // commit ahead of every child that leads to it, so until one is walked
  // nobody can say which releases contain it.
  private readonly unlinked = new Set<string>();
  // Release SHA => the release commit and every ancestor found so far.
  private readonly contained = new Map<string, Set<string>>();

  constructor(releaseShas: Iterable<string>) {
    for (const sha of releaseShas) {
      this.contained.set(sha, new Set([sha]));
    }
  }

  visit(commit: Commit): void {
    const parents = commit.parents;
    if (!parents) {
      this.tracking = false;
      return;
    }
    const isHead = this.parentsOf.size === 0;
    this.parentsOf.set(commit.sha, parents);
    this.frontier.delete(commit.sha);
    if (isHead || this.reached.has(commit.sha)) {
      this.reached.add(commit.sha);
      this.reach(parents);
    } else {
      this.unlinked.add(commit.sha);
    }
    for (const ancestors of this.contained.values()) {
      if (ancestors.has(commit.sha)) {
        this.contain(ancestors, parents);
      }
    }
  }

  // Mark `shas` reached and, through edges already walked, their ancestors.
  private reach(shas: string[]): void {
    const pending = [...shas];
    for (let sha = pending.pop(); sha !== undefined; sha = pending.pop()) {
      if (this.reached.has(sha)) {
        continue;
      }
      this.reached.add(sha);
      const parents = this.parentsOf.get(sha);
      if (parents) {
        this.unlinked.delete(sha);
        pending.push(...parents);
      } else {
        this.frontier.add(sha);
      }
    }
  }

  // Add `shas` and, through edges already walked, their ancestors. Dates
  // can be skewed, so a parent may have been walked before its child.
  private contain(ancestors: Set<string>, shas: string[]): void {
    const pending = [...shas];
    for (let sha = pending.pop(); sha !== undefined; sha = pending.pop()) {
      if (ancestors.has(sha)) {
        continue;
      }
      ancestors.add(sha);
      pending.push(...(this.parentsOf.get(sha) ?? []));
    }
  }

  /**
   * True once every walked commit is linked to the head and every unwalked
   * commit reachable from the head is contained in every release, so
   * walking further can find nothing unreleased and every walked commit can
   * be classified.
   */
  isComplete(): boolean {
    if (!this.tracking) {
      return true;
    }
    if (this.unlinked.size > 0) {
      return false;
    }
    for (const sha of this.frontier) {
      for (const ancestors of this.contained.values()) {
        if (!ancestors.has(sha)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * The commits that the release at `releaseSha` does not contain, or
   * `undefined` when ancestry is unknown.
   */
  notReleasedBy(
    commits: Commit[],
    releaseSha: string | undefined
  ): Commit[] | undefined {
    if (!this.tracking) {
      return undefined;
    }
    const ancestors = releaseSha ? this.contained.get(releaseSha) : undefined;
    if (!ancestors) {
      return commits;
    }
    return commits.filter(commit => !ancestors.has(commit.sha));
  }
}
