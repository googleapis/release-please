exports['GitHubRelease createRelease attempts to guess package name for release 1'] = {
  'tag_name': 'v1.0.3',
  'body': '\n* entry',
  'name': '@google-cloud/foo v1.0.3'
}

exports['GitHubRelease createRelease attempts to guess package name for release 2'] = {
  'labels': [
    'autorelease: tagged'
  ]
}

exports['GitHubRelease extractLatestReleaseNotes handles CHANGELOG with old and new format entries 1'] = `


### Bug Fixes

* **deps:** update dependency google-auth-library to v4 ([#79](https://www.github.com/googleapis/nodejs-rcloadenv/issues/79)) ([1386b78](https://www.github.com/googleapis/nodejs-rcloadenv/commit/1386b78))


### Build System

* upgrade engines field to >=8.10.0 ([#71](https://www.github.com/googleapis/nodejs-rcloadenv/issues/71)) ([542f935](https://www.github.com/googleapis/nodejs-rcloadenv/commit/542f935))


### Miscellaneous Chores

* **deps:** update dependency gts to v1 ([#68](https://www.github.com/googleapis/nodejs-rcloadenv/issues/68)) ([972b473](https://www.github.com/googleapis/nodejs-rcloadenv/commit/972b473))


### BREAKING CHANGES

* **deps:** this will ship async/await with the generated code.
* upgrade engines field to >=8.10.0 (#71)

`

exports['GitHubRelease extractLatestReleaseNotes handles CHANGELOG with old format entries 1'] = `

03-22-2019 10:34 PDT

### New Features
- feat: add additional entity types ([#220](https://github.com/googleapis/nodejs-language/pull/220))

### Internal / Testing Changes
- chore: publish to npm using wombat ([#218](https://github.com/googleapis/nodejs-language/pull/218))
- build: use per-repo npm publish token ([#216](https://github.com/googleapis/nodejs-language/pull/216))

`

exports['GitHubRelease extractLatestReleaseNotes handles CHANGELOG with new format entries 1'] = `


### Bug Fixes

* candidate issue should only be updated every 15 minutes. ([#70](https://www.github.com/googleapis/release-please/issues/70)) ([edcd1f7](https://www.github.com/googleapis/release-please/commit/edcd1f7))


### Features

* add GitHub action for generating candidate issue ([#69](https://www.github.com/googleapis/release-please/issues/69)) ([6373aed](https://www.github.com/googleapis/release-please/commit/6373aed))
* checkbox based releases ([#77](https://www.github.com/googleapis/release-please/issues/77)) ([1e4193c](https://www.github.com/googleapis/release-please/commit/1e4193c))

`

exports['GitHubRelease extractLatestReleaseNotes extracts appropriate release notes when prior release is patch 1'] = `


### ⚠ BREAKING CHANGES

* temp directory now defaults to setting for report directory

### Features

* default temp directory to report directory ([#102](https://www.github.com/bcoe/c8/issues/102)) ([8602f4a](https://www.github.com/bcoe/c8/commit/8602f4a))
* load .nycrc/.nycrc.json to simplify migration ([#100](https://www.github.com/bcoe/c8/issues/100)) ([bd7484f](https://www.github.com/bcoe/c8/commit/bd7484f))

`

exports['GitHubRelease extractLatestReleaseNotes php-yoshi extracts appropriate release notes, when multiple packages updated 1'] = `

<details><summary>google/cloud-bigquerydatatransfer 0.11.1</summary>



### Bug Fixes

* Fix BigQueryDataTransfer smoke test ([#2046](https://www.github.com/googleapis/google-cloud-php/issues/2046)) ([98c7c9e](https://www.github.com/googleapis/google-cloud-php/commit/98c7c9e))

</details>

<details><summary>google/cloud-dlp 0.20.0</summary>



### Features

* Add support for avro ([#2050](https://www.github.com/googleapis/google-cloud-php/issues/2050)) ([4137f3d](https://www.github.com/googleapis/google-cloud-php/commit/4137f3d))

</details>

<details><summary>google/cloud-kms 1.4.0</summary>



### Features

* Update KMS client. ([#2045](https://www.github.com/googleapis/google-cloud-php/issues/2045)) ([c96da32](https://www.github.com/googleapis/google-cloud-php/commit/c96da32))

</details>

`

exports['GitHubRelease createRelease creates and labels release on GitHub 1'] = {
  'tag_name': 'v1.0.3',
  'body': '\n* entry',
  'name': 'foo v1.0.3'
}

exports['GitHubRelease createRelease creates and labels release on GitHub 2'] = {
  'labels': [
    'autorelease: tagged'
  ]
}

exports['GitHubRelease createRelease supports submodules in nested folders 1'] = {
  'tag_name': 'foo/v1.0.3',
  'body': '\n* entry',
  'name': 'foo foo/v1.0.3'
}

exports['GitHubRelease createRelease supports submodules in nested folders 2'] = {
  'labels': [
    'autorelease: tagged'
  ]
}

exports['GitHubRelease createRelease creates releases for submodule in monorepo 1'] = {
  'tag_name': 'bigquery/v1.0.3',
  'body': '\n* entry',
  'name': 'bigquery bigquery/v1.0.3'
}

exports['GitHubRelease createRelease creates releases for submodule in monorepo 2'] = {
  'labels': [
    'autorelease: tagged'
  ]
}

exports['GitHubRelease createRelease attempts to guess package name for submodule release 1'] = {
  'tag_name': '@google-cloud/foo-v1.0.3',
  'body': '\n* entry',
  'name': '@google-cloud/foo @google-cloud/foo-v1.0.3'
}

exports['GitHubRelease createRelease attempts to guess package name for submodule release 2'] = {
  'labels': [
    'autorelease: tagged'
  ]
}
