import * as sinon from 'sinon';
import { Commit, ConventionalCommit } from '../src/commit';
import { GitHub, GitHubTag, GitHubRelease } from '../src/github';
import { Update } from '../src/update';
import { CandidateReleasePullRequest } from '../src/manifest';
import { PullRequestBody, ReleaseData } from '../src/util/pull-request-body';
import { ReleaseType } from '../src/factory';
import { GitHubFileContents } from '@google-automations/git-file-utils';
import { CompositeUpdater } from '../src/updaters/composite';
import { PullRequestOverflowHandler } from '../src/util/pull-request-overflow-handler';
import { ReleasePullRequest } from '../src/release-pull-request';
import { PullRequest } from '../src/pull-request';
export declare function stubSuggesterWithSnapshot(sandbox: sinon.SinonSandbox, snapName: string): void;
export declare function safeSnapshot(content: string): void;
export declare function dateSafe(content: string): string;
export declare function stringifyExpectedChanges(expected: [string, object][]): string;
export declare function readPOJO(name: string): object;
export declare function buildMockConventionalCommit(message: string, files?: string[]): ConventionalCommit[];
export declare function buildMockCommit(message: string, files?: string[]): Commit;
export declare function buildGitHubFileContent(fixturesPath: string, fixture: string): GitHubFileContents;
export declare function buildGitHubFileRaw(content: string): GitHubFileContents;
export interface StubFiles {
    sandbox: sinon.SinonSandbox;
    github: GitHub;
    targetBranch?: string;
    fixturePath: string;
    files: string[];
    flatten?: boolean;
    inlineFiles?: [string, string][];
}
export declare function stubFilesFromFixtures(options: StubFiles): void;
export declare function getFilesInDir(directory: string, fileList?: string[]): string[];
export declare function getFilesInDirWithPrefix(directory: string, prefix: string): string[];
export declare function assertHasUpdate(updates: Update[], path: string, clazz?: any): Update;
export declare function assertHasUpdates(updates: Update[], path: string, ...clazz: any): Update | CompositeUpdater;
export declare function assertNoHasUpdate(updates: Update[], path: string): void;
export declare function loadCommitFixtures(name: string): Commit[];
export declare function buildCommitFromFixture(name: string): Commit;
interface MockCandidatePullRequestOptions {
    component?: string;
    updates?: Update[];
    notes?: string;
    draft?: boolean;
    labels?: string[];
    group?: string;
}
export declare function buildMockCandidatePullRequest(path: string, releaseType: ReleaseType, versionString: string, options?: MockCandidatePullRequestOptions): CandidateReleasePullRequest;
export declare function mockCommits(sandbox: sinon.SinonSandbox, github: GitHub, commits: Commit[]): sinon.SinonStub;
export declare function mockReleases(sandbox: sinon.SinonSandbox, github: GitHub, releases: GitHubRelease[]): sinon.SinonStub;
export declare function mockTags(sandbox: sinon.SinonSandbox, github: GitHub, tags: GitHubTag[]): sinon.SinonStub;
export declare function mockPullRequests(sandbox: sinon.SinonSandbox, github: GitHub, pullRequests: PullRequest[]): sinon.SinonStub;
export declare function mockReleaseData(count: number): ReleaseData[];
export declare class MockPullRequestOverflowHandler implements PullRequestOverflowHandler {
    handleOverflow(pullRequest: ReleasePullRequest, _maxSize?: number | undefined): Promise<string>;
    parseOverflow(pullRequest: PullRequest): Promise<PullRequestBody | undefined>;
}
export {};
