# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/release-please?activeTab=versions

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
