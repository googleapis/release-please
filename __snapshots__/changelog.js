exports['ChangelogUpdater updateContent inserts content at appropriate location if CHANGELOG exists 1'] = `
# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/dialogflow?activeTab=versions

## 2.0.0

* added a new foo to bar.

## v0.8.2

03-13-2019 16:30 PDT

### Bug Fixes
- fix: throw on invalid credentials ([#281](https://github.com/googleapis/nodejs-dialogflow/pull/281))

### Dependencies
- fix(deps): update dependency google-gax to ^0.25.0 ([#269](https://github.com/googleapis/nodejs-dialogflow/pull/269))

### Documentation
- docs: use backticks for JS values ([#299](https://github.com/googleapis/nodejs-dialogflow/pull/299))
- docs: update jsdoc strings and import paths ([#298](https://github.com/googleapis/nodejs-dialogflow/pull/298))
- docs: update links in contrib guide ([#283](https://github.com/googleapis/nodejs-dialogflow/pull/283))
- docs: update contributing path in README ([#275](https://github.com/googleapis/nodejs-dialogflow/pull/275))
- docs: move CONTRIBUTING.md to root ([#274](https://github.com/googleapis/nodejs-dialogflow/pull/274))
- docs: add lint/fix example to contributing guide ([#272](https://github.com/googleapis/nodejs-dialogflow/pull/272))
- docs: fix example comments ([#271](https://github.com/googleapis/nodejs-dialogflow/pull/271))

### Internal / Testing Changes
- build: Add docuploader credentials to node publish jobs ([#296](https://github.com/googleapis/nodejs-dialogflow/pull/296))
- build: use node10 to run samples-test, system-test etc ([#295](https://github.com/googleapis/nodejs-dialogflow/pull/295))
- build: update release configuration
- chore: sync latest proto docs
- chore(deps): update dependency mocha to v6
- build: use linkinator for docs test ([#282](https://github.com/googleapis/nodejs-dialogflow/pull/282))
- fix(deps): update dependency yargs to v13 ([#280](https://github.com/googleapis/nodejs-dialogflow/pull/280))
- build: create docs test npm scripts ([#279](https://github.com/googleapis/nodejs-dialogflow/pull/279))
- build: test using @grpc/grpc-js in CI ([#276](https://github.com/googleapis/nodejs-dialogflow/pull/276))
- refactor: improve generated code style. ([#270](https://github.com/googleapis/nodejs-dialogflow/pull/270))

## v0.8.1

01-28-2019 13:24 PST

### Documentation
- fix(docs): dialogflow isnt published under @google-cloud scope ([#266](https://github.com/googleapis/nodejs-dialogflow/pull/266))

## v0.8.0

01-28-2019 11:05 PST

`

exports['ChangelogUpdater updateContent inserts content at appropriate location if CHANGELOG exists, and last release was a patch 1'] = `
# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/@google-cloud/os-login?activeTab=versions

## 2.0.0

* added a new foo to bar.

### [0.3.3](https://www.github.com/googleapis/nodejs-os-login/compare/v0.3.2...v0.3.3) (2019-04-30)


### Bug Fixes

* include 'x-goog-request-params' header in requests ([#167](https://www.github.com/googleapis/nodejs-os-login/issues/167)) ([074051d](https://www.github.com/googleapis/nodejs-os-login/commit/074051d))

## v0.3.2

03-18-2019 13:47 PDT

`

exports['ChangelogUpdater updateContent inserts content at appropriate location in yoshi-dotnet style CHANGELOG 1'] = `
# Version history

## 1.0.0

* added a new foo to bar.

## Version 1.0.0-alpha00, released 2022-06-24

Initial release.

`

exports['ChangelogUpdater updateContent inserts content at appropriate location in yoshi-ruby style CHANGELOG 1'] = `
# Release History

## 0.7.0

* added a new foo to bar.

### 0.5.0 / 2019-07-08

* Support overriding service host and port

### 0.4.2 / 2019-06-11

* Add VERSION constant

### 0.4.1 / 2019-04-29

* Add AUTHENTICATION.md guide.
* Extract gRPC header values from request.

### 0.4.0 / 2019-03-11

* Add v1beta1 API version

### 0.3.0 / 2018-12-10

* Add support for Regional Clusters.
  * Client methods deprecate many positional arguments in
    favor of name/parent named argument.
  * Maintains backwards compatibility.

### 0.2.2 / 2018-09-20

* Update documentation.
  * Change documentation URL to googleapis GitHub org.

### 0.2.1 / 2018-09-10

* Update documentation.

### 0.2.0 / 2018-08-21

* Move Credentials location:
  * Add Google::Cloud::Container::V1::Credentials
  * Remove Google::Cloud::Container::Credentials
* Update dependencies.
* Update documentation.

### 0.1.0 / 2017-12-26

* Initial release

`

exports['ChangelogUpdater updateContent populates a new CHANGELOG if none exists 1'] = `
# Changelog

## 2.0.0

* added a new foo to bar.

`

exports['ChangelogUpdater updateContent prepends CHANGELOG entries if a different style is found 1'] = `
# Changelog

## 1.0.0

* added a new foo to bar.

## Version 1.0.0-alpha01, released 2022-06-25

Second alpha release.

## Version 1.0.0-alpha00, released 2022-06-24

Initial release.

`
