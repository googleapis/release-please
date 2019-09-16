# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/release-please?activeTab=versions

## [2.9.0](https://www.github.com/googleapis/release-please/compare/v2.8.0...v2.9.0) (2019-09-16)


### Features

* java-specific version bumping ([#264](https://www.github.com/googleapis/release-please/issues/264)) ([734846d](https://www.github.com/googleapis/release-please/commit/734846d))

## [2.8.0](https://www.github.com/googleapis/release-please/compare/v2.7.1...v2.8.0) (2019-09-13)


### Bug Fixes

* **docs:** stop linking reference documents to anchor ([d2d0f45](https://www.github.com/googleapis/release-please/commit/d2d0f45))
* replace all version update tags ([#260](https://www.github.com/googleapis/release-please/issues/260)) ([54e0cd3](https://www.github.com/googleapis/release-please/commit/54e0cd3))
* treat docs like any other section of CHANGELOG ([#255](https://www.github.com/googleapis/release-please/issues/255)) ([254597f](https://www.github.com/googleapis/release-please/commit/254597f))


### Features

* handle Java multiple versions ([#262](https://www.github.com/googleapis/release-please/issues/262)) ([d850283](https://www.github.com/googleapis/release-please/commit/d850283))

### [2.7.1](https://www.github.com/googleapis/release-please/compare/v2.7.0...v2.7.1) (2019-08-27)


### Bug Fixes

* address a couple more bugs with Ruby libraries ([#242](https://www.github.com/googleapis/release-please/issues/242)) ([f1b4bd1](https://www.github.com/googleapis/release-please/commit/f1b4bd1))
* allow java-yoshi as CLI option ([#252](https://www.github.com/googleapis/release-please/issues/252)) ([2d5886f](https://www.github.com/googleapis/release-please/commit/2d5886f))
* allow setting default initial version per language ([#251](https://www.github.com/googleapis/release-please/issues/251)) ([d8fff67](https://www.github.com/googleapis/release-please/commit/d8fff67))

## [2.7.0](https://www.github.com/googleapis/release-please/compare/v2.6.1...v2.7.0) (2019-08-23)


### Bug Fixes

* file search needs full owner/repo ([#245](https://www.github.com/googleapis/release-please/issues/245)) ([1757a9e](https://www.github.com/googleapis/release-please/commit/1757a9e))


### Features

* add ReleasePRFactory ([#247](https://www.github.com/googleapis/release-please/issues/247)) ([e78fd89](https://www.github.com/googleapis/release-please/commit/e78fd89))

### [2.6.1](https://www.github.com/googleapis/release-please/compare/v2.6.0...v2.6.1) (2019-08-22)


### Bug Fixes

* java snapshot releases skip autorelease label ([#243](https://www.github.com/googleapis/release-please/issues/243)) ([05e00f4](https://www.github.com/googleapis/release-please/commit/05e00f4))

## [2.6.0](https://www.github.com/googleapis/release-please/compare/v2.5.2...v2.6.0) (2019-08-22)


### Bug Fixes

* address bugs found during first run on Ruby ([#238](https://www.github.com/googleapis/release-please/issues/238)) ([9ffe1c7](https://www.github.com/googleapis/release-please/commit/9ffe1c7))


### Features

* customize java changelog/release notes sections ([#240](https://www.github.com/googleapis/release-please/issues/240)) ([de84a86](https://www.github.com/googleapis/release-please/commit/de84a86))

### [2.5.2](https://www.github.com/googleapis/release-please/compare/v2.5.1...v2.5.2) (2019-08-21)


### Bug Fixes

* left in blerg debug message ([#236](https://www.github.com/googleapis/release-please/issues/236)) ([e5fff6c](https://www.github.com/googleapis/release-please/commit/e5fff6c))

### [2.5.1](https://www.github.com/googleapis/release-please/compare/v2.5.0...v2.5.1) (2019-08-21)


### Bug Fixes

* **deps:** update dependency yargs to v14 ([f406898](https://www.github.com/googleapis/release-please/commit/f406898))
* docs should not count as feature ([#234](https://www.github.com/googleapis/release-please/issues/234)) ([5a2c7d7](https://www.github.com/googleapis/release-please/commit/5a2c7d7))

## [2.5.0](https://www.github.com/googleapis/release-please/compare/v2.4.1...v2.5.0) (2019-08-19)


### Features

* allow octokit to be dependency injected ([#229](https://www.github.com/googleapis/release-please/issues/229)) ([ac05dc6](https://www.github.com/googleapis/release-please/commit/ac05dc6))
* implement generic java strategy ([#227](https://www.github.com/googleapis/release-please/issues/227)) ([53b62b8](https://www.github.com/googleapis/release-please/commit/53b62b8))

### [2.4.1](https://www.github.com/googleapis/release-please/compare/v2.4.0...v2.4.1) (2019-08-16)


### Bug Fixes

* a few minor tweaks to ruby template ([#225](https://www.github.com/googleapis/release-please/issues/225)) ([1b6ed02](https://www.github.com/googleapis/release-please/commit/1b6ed02))

## [2.4.0](https://www.github.com/googleapis/release-please/compare/v2.3.2...v2.4.0) (2019-08-14)


### Features

* add support for yoshi-ruby mono repo ([#222](https://www.github.com/googleapis/release-please/issues/222)) ([31417db](https://www.github.com/googleapis/release-please/commit/31417db))

### [2.3.2](https://www.github.com/googleapis/release-please/compare/v2.3.1...v2.3.2) (2019-08-06)


### Bug Fixes

* reflect yoshi's use of minor version bumps ([#220](https://www.github.com/googleapis/release-please/issues/220)) ([1f2d637](https://www.github.com/googleapis/release-please/commit/1f2d637))

### [2.3.1](https://www.github.com/googleapis/release-please/compare/v2.3.0...v2.3.1) (2019-08-01)


### Bug Fixes

* don't print full error in --debug mode ([#217](https://www.github.com/googleapis/release-please/issues/217)) ([896d601](https://www.github.com/googleapis/release-please/commit/896d601))
* samples package.json may not require top-level module ([#216](https://www.github.com/googleapis/release-please/issues/216)) ([2f788e8](https://www.github.com/googleapis/release-please/commit/2f788e8))

## [2.3.0](https://www.github.com/googleapis/release-please/compare/v2.2.4...v2.3.0) (2019-07-26)


### Bug Fixes

* **deps:** update dependency @octokit/graphql to v3 ([#208](https://www.github.com/googleapis/release-please/issues/208)) ([200f710](https://www.github.com/googleapis/release-please/commit/200f710))
* **deps:** update dependency @octokit/request to v5 ([#209](https://www.github.com/googleapis/release-please/issues/209)) ([6a79479](https://www.github.com/googleapis/release-please/commit/6a79479))


### Features

* adding support for google-auth-library-java ([#203](https://www.github.com/googleapis/release-please/issues/203)) ([f72c930](https://www.github.com/googleapis/release-please/commit/f72c930))

### [2.2.4](https://www.github.com/googleapis/release-please/compare/v2.2.3...v2.2.4) (2019-07-25)


### Bug Fixes

* just use the full list of commits to decide on top-level version bump ([#206](https://www.github.com/googleapis/release-please/issues/206)) ([9cd920e](https://www.github.com/googleapis/release-please/commit/9cd920e))

### [2.2.3](https://www.github.com/googleapis/release-please/compare/v2.2.2...v2.2.3) (2019-07-25)


### Bug Fixes

* increase PRs checked during release to 100 ([#204](https://www.github.com/googleapis/release-please/issues/204)) ([561502a](https://www.github.com/googleapis/release-please/commit/561502a))

### [2.2.2](https://www.github.com/googleapis/release-please/compare/v2.2.1...v2.2.2) (2019-07-01)


### Bug Fixes

* **docs:** link to reference docs section on googleapis.dev ([#199](https://www.github.com/googleapis/release-please/issues/199)) ([48704e1](https://www.github.com/googleapis/release-please/commit/48704e1))

### [2.2.1](https://www.github.com/googleapis/release-please/compare/v2.2.0...v2.2.1) (2019-06-24)


### Bug Fixes

* src/manifest.json needs 'v' prefix and top level version ([#197](https://www.github.com/googleapis/release-please/issues/197)) ([4d22fea](https://www.github.com/googleapis/release-please/commit/4d22fea))

## [2.2.0](https://www.github.com/googleapis/release-please/compare/v2.1.0...v2.2.0) (2019-06-20)


### Features

* adds additional updaters/logic for PHP mono-repo ([#195](https://www.github.com/googleapis/release-please/issues/195)) ([728aa86](https://www.github.com/googleapis/release-please/commit/728aa86))

## [2.1.0](https://www.github.com/googleapis/release-please/compare/v2.0.1...v2.1.0) (2019-06-10)


### Features

* avoid updating release PR if no additional changes ([#192](https://www.github.com/googleapis/release-please/issues/192)) ([0c96de1](https://www.github.com/googleapis/release-please/commit/0c96de1))

### [2.0.1](https://www.github.com/googleapis/release-please/compare/v2.0.0...v2.0.1) (2019-06-08)


### Bug Fixes

* bash script still had a couple bugs ([#190](https://www.github.com/googleapis/release-please/issues/190)) ([9fabd64](https://www.github.com/googleapis/release-please/commit/9fabd64))
* should use single = for bash comparison ([#188](https://www.github.com/googleapis/release-please/issues/188)) ([068d1a4](https://www.github.com/googleapis/release-please/commit/068d1a4))

## [2.0.0](https://www.github.com/googleapis/release-please/compare/v1.6.1...v2.0.0) (2019-06-07)


### ⚠ BREAKING CHANGES

* update GitHub action to run on PR rather than commit (#186)
* removed support for candidate issues

### Bug Fixes

* github commits query timed out in some cases ([4c1242b](https://www.github.com/googleapis/release-please/commit/4c1242b))
* **generate-action:** write instructions on stderr ([#182](https://www.github.com/googleapis/release-please/issues/182)) ([e362e00](https://www.github.com/googleapis/release-please/commit/e362e00))


### Code Refactoring

* removed support for candidate issues ([052c902](https://www.github.com/googleapis/release-please/commit/052c902))


### Features

* adding support for yoshi-PHP mono-repo to release-pr ([#164](https://www.github.com/googleapis/release-please/issues/164)) ([fc3812d](https://www.github.com/googleapis/release-please/commit/fc3812d))
* allow secrets to be loaded from path ([#185](https://www.github.com/googleapis/release-please/issues/185)) ([319f4f5](https://www.github.com/googleapis/release-please/commit/319f4f5))
* refactor to accept --proxy-key and --api-url ([#180](https://www.github.com/googleapis/release-please/issues/180)) ([e2c4603](https://www.github.com/googleapis/release-please/commit/e2c4603))
* update GitHub action to run on PR rather than commit ([#186](https://www.github.com/googleapis/release-please/issues/186)) ([edd728f](https://www.github.com/googleapis/release-please/commit/edd728f))

### [1.6.1](https://www.github.com/googleapis/release-please/compare/v1.6.0...v1.6.1) (2019-05-20)


### Bug Fixes

* extend release notes regex to support patches ([#142](https://www.github.com/googleapis/release-please/issues/142)) ([e887626](https://www.github.com/googleapis/release-please/commit/e887626))
* force update branch rather than closing and reopening PRs ([#152](https://www.github.com/googleapis/release-please/issues/152)) ([b0db15f](https://www.github.com/googleapis/release-please/commit/b0db15f)), closes [#141](https://www.github.com/googleapis/release-please/issues/141) [#128](https://www.github.com/googleapis/release-please/issues/128)

## [1.6.0](https://www.github.com/googleapis/release-please/compare/v1.5.1...v1.6.0) (2019-05-19)


### Features

* BREAKING CHANGE moved to top of template ([#137](https://www.github.com/googleapis/release-please/issues/137)) ([3a92b99](https://www.github.com/googleapis/release-please/commit/3a92b99))

### [1.5.1](https://www.github.com/googleapis/release-please/compare/v1.5.0...v1.5.1) (2019-05-17)


### Bug Fixes

* adding additional labels could potentially break CHANGELOG generation logic ([#133](https://www.github.com/googleapis/release-please/issues/133)) ([75933dd](https://www.github.com/googleapis/release-please/commit/75933dd))
* if we generate a CHANGELOG with only a header, don't open a PR ([#132](https://www.github.com/googleapis/release-please/issues/132)) ([ba68930](https://www.github.com/googleapis/release-please/commit/ba68930))

## [1.5.0](https://www.github.com/googleapis/release-please/compare/v1.4.2...v1.5.0) (2019-05-17)


### Bug Fixes

* testing release process ([#122](https://www.github.com/googleapis/release-please/issues/122)) ([f38e3d3](https://www.github.com/googleapis/release-please/commit/f38e3d3))


### Features

* ensuring that robot works as expected ([#124](https://www.github.com/googleapis/release-please/issues/124)) ([89bd210](https://www.github.com/googleapis/release-please/commit/89bd210))

### [1.4.2](https://www.github.com/googleapis/release-please/compare/v1.4.1...v1.4.2) (2019-05-17)

### [1.4.1](https://www.github.com/googleapis/release-please/compare/v1.4.0...v1.4.1) (2019-05-16)


### Bug Fixes

* output labels in log ([#108](https://www.github.com/googleapis/release-please/issues/108)) ([ad73b2d](https://www.github.com/googleapis/release-please/commit/ad73b2d))

## [1.4.0](https://www.github.com/googleapis/release-please/compare/v1.3.0...v1.4.0) (2019-05-16)


### Bug Fixes

* GitHub issues do not allow 'link comments' ([#92](https://www.github.com/googleapis/release-please/issues/92)) ([fe4cd4f](https://www.github.com/googleapis/release-please/commit/fe4cd4f))
* Node 10 is required for async/await ([#89](https://www.github.com/googleapis/release-please/issues/89)) ([c795eef](https://www.github.com/googleapis/release-please/commit/c795eef))


### Features

* introduce detect-checked command, a quick check for whether a release has been requested ([#93](https://www.github.com/googleapis/release-please/issues/93)) ([d835335](https://www.github.com/googleapis/release-please/commit/d835335))

## [1.3.0](https://www.github.com/googleapis/release-please/compare/v1.2.0...v1.3.0) (2019-05-15)


### Bug Fixes

* export COMMAND variable ([c3e54c7](https://www.github.com/googleapis/release-please/commit/c3e54c7))
* remove space in export ([0c487b8](https://www.github.com/googleapis/release-please/commit/0c487b8))


### Features

* add command for generating action config ([#87](https://www.github.com/googleapis/release-please/issues/87)) ([73d9165](https://www.github.com/googleapis/release-please/commit/73d9165))
* don't remove link to PR until new commits landed ([#88](https://www.github.com/googleapis/release-please/issues/88)) ([6316331](https://www.github.com/googleapis/release-please/commit/6316331))
* example of process ([74dea84](https://www.github.com/googleapis/release-please/commit/74dea84))
* introduce GitHub release functionality ([#85](https://www.github.com/googleapis/release-please/issues/85)) ([df046b4](https://www.github.com/googleapis/release-please/commit/df046b4))

## [1.2.0](https://www.github.com/googleapis/release-please/compare/v1.1.0...v1.2.0) (2019-05-10)


### Bug Fixes

* candidate issue should only be updated every 15 minutes. ([#70](https://www.github.com/googleapis/release-please/issues/70)) ([edcd1f7](https://www.github.com/googleapis/release-please/commit/edcd1f7))


### Features

* add GitHub action for generating candidate issue ([#69](https://www.github.com/googleapis/release-please/issues/69)) ([6373aed](https://www.github.com/googleapis/release-please/commit/6373aed))
* checkbox based releases ([#77](https://www.github.com/googleapis/release-please/issues/77)) ([1e4193c](https://www.github.com/googleapis/release-please/commit/1e4193c))
