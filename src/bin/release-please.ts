#!/usr/bin/env node

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

import {coerceOption} from '../util/coerce-option';
import * as yargs from 'yargs';
import {GitHub, GH_API_URL, GH_GRAPHQL_URL} from '../github';
import {Manifest, ManifestOptions, ROOT_PROJECT_PATH} from '../manifest';
import {ChangelogSection, buildChangelogSections} from '../changelog-notes';
import {logger, setLogger, CheckpointLogger} from '../util/logger';
import {
  getReleaserTypes,
  ReleaseType,
  VersioningStrategyType,
  getVersioningStrategyTypes,
  ChangelogNotesType,
  getChangelogTypes,
} from '../factory';
import {Bootstrapper} from '../bootstrapper';
import {createPatch} from 'diff';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parseGithubRepoUrl = require('parse-github-repo-url');

interface ErrorObject {
  body?: object;
  status?: number;
  message: string;
  stack: string;
}

interface GitHubArgs {
  dryRun?: boolean;
  trace?: boolean;
  repoUrl?: string;
  token?: string;
  apiUrl?: string;
  graphqlUrl?: string;
  fork?: boolean;

  // deprecated in favor of targetBranch
  defaultBranch?: string;
  targetBranch?: string;
}

interface ManifestArgs {
  configFile?: string;
  manifestFile?: string;
}

interface VersioningArgs {
  bumpMinorPreMajor?: boolean;
  bumpPatchForMinorPreMajor?: boolean;
  releaseAs?: string;

  // only for Ruby: TODO replace with generic bootstrap option
  // deprecated in favor of latestTagVersion
  lastPackageVersion?: string;

  latestTagVersion?: string;
  latestTagSha?: string;
  latestTagName?: string;
}

interface ManifestConfigArgs {
  path?: string;
  component?: string;
  packageName?: string;
  releaseType?: ReleaseType;
}

interface ReleaseArgs {
  draft?: boolean;
  prerelease?: boolean;
  releaseLabel?: string;
  snapshotLabel?: string;
  label?: string;
}

interface PullRequestArgs {
  draftPullRequest?: boolean;
  label?: string;
  skipLabeling?: boolean;
  signoff?: string;
}

interface PullRequestStrategyArgs {
  snapshot?: boolean;
  changelogSections?: ChangelogSection[];
  changelogPath?: string;
  changelogHost?: string;
  versioningStrategy?: VersioningStrategyType;

  // for Ruby: TODO refactor to find version.rb like Python finds version.py
  // and then remove this property
  versionFile?: string;
  extraFiles?: string[];
}

interface TaggingArgs {
  includeVInTags?: boolean;
  monorepoTags?: boolean;
  pullRequestTitlePattern?: string;
  pullRequestHeader?: string;
}

interface CreatePullRequestArgs
  extends GitHubArgs,
    ManifestArgs,
    ManifestConfigArgs,
    VersioningArgs,
    PullRequestArgs,
    PullRequestStrategyArgs,
    TaggingArgs {
  changelogType?: ChangelogNotesType;
}
interface CreateReleaseArgs
  extends GitHubArgs,
    ManifestArgs,
    ManifestConfigArgs,
    ReleaseArgs,
    TaggingArgs {}
interface CreateManifestPullRequestArgs
  extends GitHubArgs,
    ManifestArgs,
    PullRequestArgs {}
interface CreateManifestReleaseArgs
  extends GitHubArgs,
    ManifestArgs,
    ReleaseArgs {}
interface BootstrapArgs
  extends GitHubArgs,
    ManifestArgs,
    ManifestConfigArgs,
    VersioningArgs,
    PullRequestArgs,
    PullRequestStrategyArgs,
    ReleaseArgs {
  initialVersion?: string;
}
interface DebugConfigArgs extends GitHubArgs, ManifestArgs {}

function gitHubOptions(yargs: yargs.Argv): yargs.Argv {
  return yargs
    .option('token', {describe: 'GitHub token with repo write permissions'})
    .option('api-url', {
      describe: 'URL to use when making API requests',
      default: GH_API_URL,
      type: 'string',
    })
    .option('graphql-url', {
      describe: 'URL to use when making GraphQL requests',
      default: GH_GRAPHQL_URL,
      type: 'string',
    })
    .option('default-branch', {
      describe: 'The branch to open release PRs against and tag releases on',
      type: 'string',
      deprecated: 'use --target-branch instead',
    })
    .option('target-branch', {
      describe: 'The branch to open release PRs against and tag releases on',
      type: 'string',
    })
    .option('repo-url', {
      describe: 'GitHub URL to generate release for',
      demand: true,
    })
    .option('dry-run', {
      describe: 'Prepare but do not take action',
      type: 'boolean',
      default: false,
    })
    .middleware(_argv => {
      const argv = _argv as GitHubArgs;
      // allow secrets to be loaded from file path
      // rather than being passed directly to the bin.
      if (argv.token) argv.token = coerceOption(argv.token);
      if (argv.apiUrl) argv.apiUrl = coerceOption(argv.apiUrl);
      if (argv.graphqlUrl) argv.graphqlUrl = coerceOption(argv.graphqlUrl);
    });
}

function releaseOptions(yargs: yargs.Argv): yargs.Argv {
  return yargs
    .option('draft', {
      describe:
        'mark release as a draft. no tag is created but tag_name and ' +
        'target_commitish are associated with the release for future ' +
        'tag creation upon "un-drafting" the release.',
      type: 'boolean',
      default: false,
    })
    .option('prerelease', {
      describe:
        'mark release that have prerelease versions ' +
        'as as a prerelease on Github',
      type: 'boolean',
      default: false,
    })
    .option('label', {
      default: 'autorelease: pending',
      describe: 'comma-separated list of labels to remove to from release PR',
    })
    .option('release-label', {
      describe: 'set a pull request label other than "autorelease: tagged"',
      default: 'autorelease: tagged',
      type: 'string',
    })
    .option('snapshot-label', {
      describe:
        'set a java snapshot pull request label other than "autorelease: snapshot"',
      default: 'autorelease: snapshot',
      type: 'string',
    });
}

function pullRequestOptions(yargs: yargs.Argv): yargs.Argv {
  // common to ReleasePR and GitHubRelease
  return yargs
    .option('label', {
      default: 'autorelease: pending',
      describe: 'comma-separated list of labels to add to from release PR',
    })
    .option('skip-labeling', {
      describe: 'skip application of labels to pull requests',
      type: 'boolean',
      default: false,
    })
    .option('fork', {
      describe: 'should the PR be created from a fork',
      type: 'boolean',
      default: false,
    })
    .option('draft-pull-request', {
      describe: 'mark pull request as a draft',
      type: 'boolean',
      default: false,
    })
    .option('signoff', {
      describe:
        'Add Signed-off-by line at the end of the commit log message using the user and email provided. (format "Name <email@example.com>").',
      type: 'string',
    });
}

function pullRequestStrategyOptions(yargs: yargs.Argv): yargs.Argv {
  return yargs
    .option('release-as', {
      describe: 'override the semantically determined release version',
      type: 'string',
    })
    .option('bump-minor-pre-major', {
      describe:
        'should we bump the semver minor prior to the first major release',
      default: false,
      type: 'boolean',
    })
    .option('bump-patch-for-minor-pre-major', {
      describe:
        'should we bump the semver patch instead of the minor for non-breaking' +
        ' changes prior to the first major release',
      default: false,
      type: 'boolean',
    })
    .option('extra-files', {
      describe: 'extra files for the strategy to consider',
      type: 'string',
      coerce(arg?: string) {
        if (arg) {
          return arg.split(',');
        }
        return arg;
      },
    })
    .option('version-file', {
      describe: 'path to version file to update, e.g., version.rb',
      type: 'string',
    })
    .option('snapshot', {
      describe: 'is it a snapshot (or pre-release) being generated?',
      type: 'boolean',
      default: false,
    })
    .option('versioning-strategy', {
      describe: 'strategy used for bumping versions',
      choices: getVersioningStrategyTypes(),
      default: 'default',
    })
    .option('changelog-path', {
      default: 'CHANGELOG.md',
      describe: 'where can the CHANGELOG be found in the project?',
      type: 'string',
    })
    .option('changelog-type', {
      describe: 'type of changelog to build',
      choices: getChangelogTypes(),
    })
    .option('changelog-sections', {
      describe: 'comma-separated list of scopes to include in the changelog',
      type: 'string',
      coerce: (arg?: string) => {
        if (arg) {
          return buildChangelogSections(arg.split(','));
        }
        return arg;
      },
    })
    .option('changelog-host', {
      describe: 'host for hyperlinks in the changelog',
      type: 'string',
    })
    .option('last-package-version', {
      describe: 'last version # that package was released as',
      type: 'string',
      deprecated: 'use --latest-tag-version instead',
    })
    .option('latest-tag-version', {
      describe: 'Override the detected latest tag version',
      type: 'string',
    })
    .option('latest-tag-sha', {
      describe: 'Override the detected latest tag SHA',
      type: 'string',
    })
    .option('latest-tag-name', {
      describe: 'Override the detected latest tag name',
      type: 'string',
    })
    .middleware(_argv => {
      const argv = _argv as CreatePullRequestArgs;

      if (argv.defaultBranch) {
        logger.warn(
          '--default-branch is deprecated. Please use --target-branch instead.'
        );
        argv.targetBranch = argv.targetBranch || argv.defaultBranch;
      }

      if (argv.lastPackageVersion) {
        logger.warn(
          '--latest-package-version is deprecated. Please use --latest-tag-version instead.'
        );
        argv.latestTagVersion =
          argv.latestTagVersion || argv.lastPackageVersion;
      }
    });
}

function manifestConfigOptions(
  yargs: yargs.Argv,
  defaultType?: string
): yargs.Argv {
  return yargs
    .option('path', {
      describe: 'release from path other than root directory',
      type: 'string',
    })
    .option('component', {
      describe: 'name of component release is being minted for',
      type: 'string',
    })
    .option('package-name', {
      describe: 'name of package release is being minted for',
      type: 'string',
    })
    .option('release-type', {
      describe: 'what type of repo is a release being created for?',
      choices: getReleaserTypes(),
      default: defaultType,
    });
}

function manifestOptions(yargs: yargs.Argv): yargs.Argv {
  return yargs
    .option('config-file', {
      default: 'release-please-config.json',
      describe: 'where can the config file be found in the project?',
    })
    .option('manifest-file', {
      default: '.release-please-manifest.json',
      describe: 'where can the manifest file be found in the project?',
    });
}

function taggingOptions(yargs: yargs.Argv): yargs.Argv {
  return yargs
    .option('include-v-in-tags', {
      describe: 'include "v" in tag versions',
      type: 'boolean',
      default: true,
    })
    .option('monorepo-tags', {
      describe: 'include library name in tags and release branches',
      type: 'boolean',
      default: false,
    })
    .option('pull-request-title-pattern', {
      describe: 'Title pattern to make release PR',
      type: 'string',
    })
    .option('pull-request-header', {
      describe: 'Header for release PR',
      type: 'string',
    });
}

const createReleasePullRequestCommand: yargs.CommandModule<
  {},
  CreatePullRequestArgs
> = {
  command: 'release-pr',
  describe: 'create or update a PR representing the next release',
  builder(yargs) {
    return manifestOptions(
      manifestConfigOptions(
        taggingOptions(
          pullRequestOptions(pullRequestStrategyOptions(gitHubOptions(yargs)))
        )
      )
    );
  },
  async handler(argv) {
    const github = await buildGitHub(argv);
    const targetBranch = argv.targetBranch || github.repository.defaultBranch;
    let manifest: Manifest;
    if (argv.releaseType) {
      manifest = await Manifest.fromConfig(
        github,
        targetBranch,
        {
          releaseType: argv.releaseType,
          component: argv.component,
          packageName: argv.packageName,
          draftPullRequest: argv.draftPullRequest,
          bumpMinorPreMajor: argv.bumpMinorPreMajor,
          bumpPatchForMinorPreMajor: argv.bumpPatchForMinorPreMajor,
          changelogPath: argv.changelogPath,
          changelogType: argv.changelogType,
          changelogHost: argv.changelogHost,
          pullRequestTitlePattern: argv.pullRequestTitlePattern,
          pullRequestHeader: argv.pullRequestHeader,
          changelogSections: argv.changelogSections,
          releaseAs: argv.releaseAs,
          versioning: argv.versioningStrategy,
          extraFiles: argv.extraFiles,
          versionFile: argv.versionFile,
          includeComponentInTag: argv.monorepoTags,
          includeVInTag: argv.includeVInTags,
        },
        extractManifestOptions(argv),
        argv.path
      );
    } else {
      const manifestOptions = extractManifestOptions(argv);
      manifest = await Manifest.fromManifest(
        github,
        targetBranch,
        argv.configFile,
        argv.manifestFile,
        manifestOptions,
        argv.path,
        argv.releaseAs
      );
    }

    if (argv.dryRun) {
      const pullRequests = await manifest.buildPullRequests();
      console.log(`Would open ${pullRequests.length} pull requests`);
      console.log('fork:', manifest.fork);
      for (const pullRequest of pullRequests) {
        console.log('title:', pullRequest.title.toString());
        console.log('branch:', pullRequest.headRefName);
        console.log('draft:', pullRequest.draft);
        console.log('body:', pullRequest.body.toString());
        console.log('updates:', pullRequest.updates.length);
        const changes = await github.buildChangeSet(
          pullRequest.updates,
          targetBranch
        );
        for (const update of pullRequest.updates) {
          console.log(
            `  ${update.path}: `,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (update.updater as any).constructor
          );
          if (argv.trace) {
            const change = changes.get(update.path);
            if (change) {
              const patch = createPatch(
                update.path,
                change.originalContent || '',
                change.content || ''
              );
              console.log(patch);
            } else {
              console.warn(`no change found for ${update.path}`);
            }
          }
        }
      }
    } else {
      const pullRequestNumbers = await manifest.createPullRequests();
      console.log(pullRequestNumbers);
    }
  },
};

const createReleaseCommand: yargs.CommandModule<{}, CreateReleaseArgs> = {
  command: 'github-release',
  describe: 'create a GitHub release from a release PR',
  builder(yargs) {
    return releaseOptions(
      manifestOptions(
        manifestConfigOptions(taggingOptions(gitHubOptions(yargs)))
      )
    );
  },
  async handler(argv) {
    const github = await buildGitHub(argv);
    const targetBranch =
      argv.targetBranch ||
      argv.defaultBranch ||
      github.repository.defaultBranch;
    let manifest: Manifest;
    if (argv.releaseType) {
      manifest = await Manifest.fromConfig(
        github,
        targetBranch,
        {
          releaseType: argv.releaseType,
          component: argv.component,
          packageName: argv.packageName,
          draft: argv.draft,
          prerelease: argv.prerelease,
          includeComponentInTag: argv.monorepoTags,
          includeVInTag: argv.includeVInTags,
        },
        extractManifestOptions(argv),
        argv.path
      );
    } else {
      const manifestOptions = extractManifestOptions(argv);
      manifest = await Manifest.fromManifest(
        github,
        targetBranch,
        argv.configFile,
        argv.manifestFile,
        manifestOptions
      );
    }

    if (argv.dryRun) {
      const releases = await manifest.buildReleases();
      logger.info(`Would tag ${releases.length} releases:`);
      for (const release of releases) {
        logger.info({
          name: release.name,
          tag: release.tag.toString(),
          notes: release.notes,
          sha: release.sha,
          draft: release.draft,
          prerelease: release.prerelease,
          pullNumber: release.pullRequest.number,
        });
      }
    } else {
      const releaseNumbers = await manifest.createReleases();
      console.log(releaseNumbers);
    }
  },
};

const createManifestPullRequestCommand: yargs.CommandModule<
  {},
  CreateManifestPullRequestArgs
> = {
  command: 'manifest-pr',
  describe: 'create a release-PR using a manifest file',
  deprecated: 'use release-pr instead.',
  builder(yargs) {
    return manifestOptions(pullRequestOptions(gitHubOptions(yargs)));
  },
  async handler(argv) {
    logger.warn('manifest-pr is deprecated. Please use release-pr instead.');
    const github = await buildGitHub(argv);
    const targetBranch =
      argv.targetBranch ||
      argv.defaultBranch ||
      github.repository.defaultBranch;
    const manifestOptions = extractManifestOptions(argv);
    const manifest = await Manifest.fromManifest(
      github,
      targetBranch,
      argv.configFile,
      argv.manifestFile,
      manifestOptions
    );

    if (argv.dryRun) {
      const pullRequests = await manifest.buildPullRequests();
      console.log(`Would open ${pullRequests.length} pull requests`);
      console.log('fork:', manifest.fork);
      for (const pullRequest of pullRequests) {
        console.log('title:', pullRequest.title.toString());
        console.log('branch:', pullRequest.headRefName);
        console.log('draft:', pullRequest.draft);
        console.log('body:', pullRequest.body.toString());
        console.log('updates:', pullRequest.updates.length);
        for (const update of pullRequest.updates) {
          console.log(
            `  ${update.path}: `,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (update.updater as any).constructor
          );
        }
      }
    } else {
      const pullRequestNumbers = await manifest.createPullRequests();
      console.log(pullRequestNumbers);
    }
  },
};

const createManifestReleaseCommand: yargs.CommandModule<
  {},
  CreateManifestReleaseArgs
> = {
  command: 'manifest-release',
  describe: 'create releases/tags from last release-PR using a manifest file',
  deprecated: 'use github-release instead',
  builder(yargs) {
    return manifestOptions(releaseOptions(gitHubOptions(yargs)));
  },
  async handler(argv) {
    logger.warn(
      'manifest-release is deprecated. Please use github-release instead.'
    );
    const github = await buildGitHub(argv);
    const targetBranch =
      argv.targetBranch ||
      argv.defaultBranch ||
      github.repository.defaultBranch;
    const manifestOptions = extractManifestOptions(argv);
    const manifest = await Manifest.fromManifest(
      github,
      targetBranch,
      argv.configFile,
      argv.manifestFile,
      manifestOptions
    );

    if (argv.dryRun) {
      const releases = await manifest.buildReleases();
      logger.info(releases);
    } else {
      const releaseNumbers = await manifest.createReleases();
      console.log(releaseNumbers);
    }
  },
};

const bootstrapCommand: yargs.CommandModule<{}, BootstrapArgs> = {
  command: 'bootstrap',
  describe: 'configure release manifest',
  builder(yargs) {
    return manifestConfigOptions(
      manifestOptions(
        releaseOptions(pullRequestStrategyOptions(gitHubOptions(yargs)))
      )
    )
      .option('initial-version', {
        description: 'current version',
      })
      .coerce('path', arg => {
        return arg || ROOT_PROJECT_PATH;
      });
  },
  async handler(argv) {
    const github = await buildGitHub(argv);
    const targetBranch =
      argv.targetBranch ||
      argv.defaultBranch ||
      github.repository.defaultBranch;
    const bootstrapper = new Bootstrapper(
      github,
      targetBranch,
      argv.manifestFile,
      argv.configFile,
      argv.initialVersion
    );
    const path = argv.path || ROOT_PROJECT_PATH;
    const releaserConfig = {
      releaseType: argv.releaseType!,
      component: argv.component,
      packageName: argv.packageName,
      draft: argv.draft,
      prerelease: argv.prerelease,
      draftPullRequest: argv.draftPullRequest,
      bumpMinorPreMajor: argv.bumpMinorPreMajor,
      bumpPatchForMinorPreMajor: argv.bumpPatchForMinorPreMajor,
      changelogPath: argv.changelogPath,
      changelogHost: argv.changelogHost,
      changelogSections: argv.changelogSections,
      releaseAs: argv.releaseAs,
      versioning: argv.versioningStrategy,
      extraFiles: argv.extraFiles,
      versionFile: argv.versionFile,
    };
    if (argv.dryRun) {
      const pullRequest = await await bootstrapper.buildPullRequest(
        path,
        releaserConfig
      );
      console.log('Would open 1 pull request');
      console.log('title:', pullRequest.title);
      console.log('branch:', pullRequest.headBranchName);
      console.log('body:', pullRequest.body);
      console.log('updates:', pullRequest.updates.length);
      const changes = await github.buildChangeSet(
        pullRequest.updates,
        targetBranch
      );
      for (const update of pullRequest.updates) {
        console.log(
          `  ${update.path}: `,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (update.updater as any).constructor
        );
        if (argv.trace) {
          const change = changes.get(update.path);
          if (change) {
            const patch = createPatch(
              update.path,
              change.originalContent || '',
              change.content || ''
            );
            console.log(patch);
          } else {
            console.warn(`no change found for ${update.path}`);
          }
        }
      }
    } else {
      const pullRequest = await bootstrapper.bootstrap(path, releaserConfig);
      console.log(pullRequest);
    }
  },
};

const debugConfigCommand: yargs.CommandModule<{}, DebugConfigArgs> = {
  command: 'debug-config',
  describe: 'debug manifest config',
  builder(yargs) {
    return manifestConfigOptions(manifestOptions(gitHubOptions(yargs)));
  },
  async handler(argv) {
    const github = await buildGitHub(argv);
    const manifestOptions = extractManifestOptions(argv);
    const targetBranch =
      argv.targetBranch ||
      argv.defaultBranch ||
      github.repository.defaultBranch;
    const manifest = await Manifest.fromManifest(
      github,
      targetBranch,
      argv.configFile,
      argv.manifestFile,
      manifestOptions
    );
    console.log(manifest);
  },
};

async function buildGitHub(argv: GitHubArgs): Promise<GitHub> {
  const [owner, repo] = parseGithubRepoUrl(argv.repoUrl);
  const github = await GitHub.create({
    owner,
    repo,
    token: argv.token!,
    apiUrl: argv.apiUrl,
    graphqlUrl: argv.graphqlUrl,
  });
  return github;
}

export const parser = yargs
  .command(createReleasePullRequestCommand)
  .command(createReleaseCommand)
  .command(createManifestPullRequestCommand)
  .command(createManifestReleaseCommand)
  .command(bootstrapCommand)
  .command(debugConfigCommand)
  .option('debug', {
    describe: 'print verbose errors (use only for local debugging).',
    default: false,
    type: 'boolean',
  })
  .option('trace', {
    describe: 'print extra verbose errors (use only for local debugging).',
    default: false,
    type: 'boolean',
  })
  .middleware(argv => {
    if (argv.trace) {
      setLogger(new CheckpointLogger(true, true));
    } else if (argv.debug) {
      setLogger(new CheckpointLogger(true));
    }
  })
  .option('plugin', {
    describe: 'load plugin named release-please-<plugin-name>',
    type: 'array',
    default: [],
  })
  .middleware(argv => {
    for (const pluginName of argv.plugin) {
      console.log(`requiring plugin: ${pluginName}`);
      try {
        const plugin = require(pluginName.toString());
        if (plugin?.init) {
          console.log(`loading plugin: ${pluginName}`);
        } else {
          console.warn(
            `plugin: ${pluginName} did not have an init() function.`
          );
        }
      } catch (e) {
        console.warn(`failed to require plugin: ${pluginName}:`, e);
      }
    }
  })
  .demandCommand(1)
  .strict(true)
  .scriptName('release-please');

interface HandleError {
  (err: ErrorObject): void;
  logger?: Console;
  yargsArgs?: yargs.Arguments;
}

function extractManifestOptions(
  argv: GitHubArgs & (PullRequestArgs | ReleaseArgs)
): ManifestOptions {
  const manifestOptions: ManifestOptions = {};
  if ('fork' in argv && argv.fork !== undefined) {
    manifestOptions.fork = argv.fork;
  }
  if (argv.label !== undefined) {
    let labels: string[] = argv.label.split(',');
    if (labels.length === 1 && labels[0] === '') labels = [];
    manifestOptions.labels = labels;
  }
  if ('skipLabeling' in argv && argv.skipLabeling !== undefined) {
    manifestOptions.skipLabeling = argv.skipLabeling;
  }
  if ('releaseLabel' in argv && argv.releaseLabel) {
    manifestOptions.releaseLabels = argv.releaseLabel.split(',');
  }
  if ('snapshotLabel' in argv && argv.snapshotLabel) {
    manifestOptions.snapshotLabels = argv.snapshotLabel.split(',');
  }
  if ('signoff' in argv && argv.signoff) {
    manifestOptions.signoff = argv.signoff;
  }
  if ('draft' in argv && argv.draft !== undefined) {
    manifestOptions.draft = argv.draft;
  }
  if ('draftPullRequest' in argv && argv.draftPullRequest !== undefined) {
    manifestOptions.draftPullRequest = argv.draftPullRequest;
  }
  return manifestOptions;
}

// The errors returned by octokit currently contain the
// request object, this contains information we don't want to
// leak. For this reason, we capture exceptions and print
// a less verbose error message (run with --debug to output
// the request object, don't do this in CI/CD).
export const handleError: HandleError = (err: ErrorObject) => {
  let status = '';
  if (handleError.yargsArgs === undefined) {
    throw new Error(
      'Set handleError.yargsArgs with a yargs.Arguments instance.'
    );
  }
  const ya = handleError.yargsArgs;
  const errorLogger = handleError.logger ?? logger;
  const command = ya?._?.length ? ya._[0] : '';
  if (err.status) {
    status = '' + err.status;
  }
  errorLogger.error(
    `command ${command} failed${status ? ` with status ${status}` : ''}`
  );
  if (ya?.debug) {
    logger.error('---------');
    logger.error(err.stack);
  }
  process.exitCode = 1;
};

// Only run parser if executed with node bin, this allows
// for the parser to be easily tested:
let argv: yargs.Arguments;
if (require.main === module) {
  (async () => {
    argv = await parser.parseAsync();
    handleError.yargsArgs = argv;
    process.on('unhandledRejection', err => {
      handleError(err as ErrorObject);
    });

    process.on('uncaughtException', err => {
      handleError(err as ErrorObject);
    });
  })();
}
