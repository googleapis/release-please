# Forgejo

Release Please can open release PRs and create releases on a
[Forgejo](https://forgejo.org) instance. It talks to the Forgejo REST API
(`/api/v1`), so no local clone is needed.

## Requirements

* **Forgejo v16 or newer.** Release PR branches are rebuilt from the target
  branch on every run and force-updated with the `force_overwrite_new_branch`
  option of the "modify multiple files" API, which was added in Forgejo v16.
  Older versions can open a release PR once but fail to update it, and
  Release Please reports a clear error when that happens.
* **A token with repository write access.** A personal access token needs the
  `write:repository` and `write:issue` scopes, plus `read:organization` if the
  repository belongs to an organization, so organization labels are reused.
  The automatic Forgejo Actions token also works, but pull requests, tags and
  releases created with it do not trigger other workflows.
* **Squash or merge-commit merges (recommended).** Commits are linked to the
  pull request whose merge commit they are. With rebase merges only the last
  commit of a pull request is linked. That is enough to detect merged release
  PRs, but `BEGIN_COMMIT_OVERRIDE` in PR bodies is only honored for the linked
  commit.

## Forgejo Action

This repository contains a composite action ([`action.yml`](../action.yml)).
It builds Release Please on the runner and runs it with the same inputs as
[googleapis/release-please-action](https://github.com/googleapis/release-please-action).

```yaml
# .forgejo/workflows/release-please.yml
on:
  push:
    branches:
      - main

jobs:
  release-please:
    runs-on: docker
    steps:
      - uses: https://github.com/martinhaintz/release-please@feat/forgejo-support
        id: release
        with:
          token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
          # omit to use release-please-config.json and .release-please-manifest.json
          release-type: simple

      - if: ${{ steps.release.outputs.release_created == 'true' }}
        run: echo "Released ${{ steps.release.outputs.tag_name }}"
```

You can also mirror this repository to your Forgejo instance and reference it
there, e.g. `uses: https://git.example.com/tools/release-please@feat/forgejo-support`.

The runner needs `bash`. Node.js 22 is installed with `actions/setup-node`,
which Forgejo resolves through the instance's `DEFAULT_ACTIONS_URL` (by
default <https://data.forgejo.org>). If that action isn't available on your
instance, set `node-version: ''` and use a runner image that already has
Node.js 22 or newer.

### Inputs

| Input | Default | Description |
| ----- | ------- | ----------- |
| `token` | `${{ github.token }}` | Token used for all API calls |
| `release-type` | | Release type, e.g. `node` or `simple`. If unset, the manifest config files are used |
| `path` | | Path of the component when using `release-type` |
| `target-branch` | default branch | Branch to open release PRs against |
| `config-file` | `release-please-config.json` | Path to the config file |
| `manifest-file` | `.release-please-manifest.json` | Path to the manifest file |
| `repo-url` | `${{ github.repository }}` | Repository as `<owner>/<repo>` |
| `api-url` | `${{ github.api_url }}` | Forgejo API URL, e.g. `https://git.example.com/api/v1` |
| `include-component-in-tag` | | Prefix tags and branches with the component |
| `skip-github-release` | `false` | Don't create releases |
| `skip-github-pull-request` | `false` | Don't open release PRs |
| `skip-labeling` | `false` | Don't label release PRs |
| `changelog-host` | instance URL | Host used for links in the changelog |
| `versioning-strategy` | | Versioning strategy |
| `release-as` | | Force the next version |
| `wip-prefix` | `WIP:` | Title prefix marking draft release PRs, see [Draft release PRs](#draft-release-prs) |
| `node-version` | `22` | Node.js version to install. Empty skips `setup-node` |

### Outputs

| Output | Description |
| ------ | ----------- |
| `releases_created` | `true` if any release was created |
| `paths_released` | JSON array of the released paths |
| `releases` | JSON array of all created releases, with the keys below. Use it for monorepos, e.g. `fromJSON(steps.release.outputs.releases)[0].tag_name` |
| `release_created` | `true` if the root path (`.`) was released |
| `tag_name`, `version`, `major`, `minor`, `patch`, `sha`, `name`, `body`, `html_url`, `upload_url`, `id`, `draft`, `pr_number` | Details of the root path release |
| `prs_created` | `true` if a release PR was created or updated |
| `pr` / `prs` | JSON of the first / all release PRs |

Composite actions can only expose declared outputs. Unlike
release-please-action, there are no per-path outputs such as
`packages/foo--tag_name`; use `releases` instead.

## CLI

```bash
release-please release-pr \
  --scm=forgejo \
  --repo-url=https://git.example.com/<owner>/<repo> \
  --token=$FORGEJO_TOKEN \
  --release-type=simple

release-please github-release \
  --scm=forgejo \
  --repo-url=https://git.example.com/<owner>/<repo> \
  --token=$FORGEJO_TOKEN \
  --release-type=simple
```

The API URL is derived from `--repo-url` (`https://<host>[/<subpath>]/api/v1`).
If you pass `--repo-url=<owner>/<repo>`, also pass
`--api-url=https://<host>/api/v1`. `--wip-prefix` sets the title prefix of
draft release PRs (see below). `--local` isn't supported with Forgejo.

## Library

```ts
import {Forgejo, Manifest} from 'release-please';

const forgejo = await Forgejo.create({
  owner: 'owner',
  repo: 'repo',
  apiUrl: 'https://git.example.com/api/v1',
  token: process.env.FORGEJO_TOKEN,
});
const manifest = await Manifest.fromManifest(
  forgejo,
  forgejo.repository.defaultBranch
);
await manifest.createPullRequests();
await manifest.createReleases();
```

## Draft release PRs

Forgejo has no separate draft flag. It treats a pull request as a draft
("work in progress") when its title starts with one of the prefixes in
`[repository.pull-request].WORK_IN_PROGRESS_PREFIXES` (default: `WIP:` and
`[WIP]`), and it won't merge such a pull request.

With `draft-pull-request: true` (or `--draft-pull-request`), new release PRs
are opened with the title `WIP: <title>`. To mark one as ready, remove the
prefix, e.g. with the "Remove WIP: prefix" link on the pull request page.
Later runs keep the current state:

* a release PR that is still a draft keeps its prefix when its title is updated
* a release PR that was marked as ready stays ready

If your instance uses other prefixes, set the one to use with the action input
`wip-prefix` or the CLI option `--wip-prefix` (e.g. `--wip-prefix=Draft:`).
If the prefix isn't listed in the instance's `WORK_IN_PROGRESS_PREFIXES`, the
PR isn't marked as a draft and Release Please logs a warning.

## API usage

* List requests use the largest page size the instance allows
  (`[api].MAX_RESPONSE_ITEMS`, read from `/settings/api`; 50 if unavailable).
* Each commit is linked to its pull request with a separate request. The
  `commit-batch-size` option in `release-please-config.json` (default 10)
  sets how many of these requests run at the same time. Lower it if your
  instance is rate limited or slow.

## Limitations

* `changelog-type: github` isn't supported, because Forgejo can't generate release notes.
* Release PRs are always opened from a branch in the same repository. The `fork` option is ignored with a warning.
* Files are written through the Forgejo contents API, which can't set file modes, so the executable bit of an updated file may be lost.
* Missing labels (e.g. `autorelease: pending`) are created automatically with a neutral color.
