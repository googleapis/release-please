# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/@google-cloud/rcloadenv?activeTab=versions

## [1.0.0](https://www.github.com/googleapis/nodejs-rcloadenv/compare/v0.3.3...v1.0.0) (2019-05-14)


### Bug Fixes

* **deps:** update dependency google-auth-library to v4 ([#79](https://www.github.com/googleapis/nodejs-rcloadenv/issues/79)) ([1386b78](https://www.github.com/googleapis/nodejs-rcloadenv/commit/1386b78))


### Build System

* upgrade engines field to >=8.10.0 ([#71](https://www.github.com/googleapis/nodejs-rcloadenv/issues/71)) ([542f935](https://www.github.com/googleapis/nodejs-rcloadenv/commit/542f935))


### Miscellaneous Chores

* **deps:** update dependency gts to v1 ([#68](https://www.github.com/googleapis/nodejs-rcloadenv/issues/68)) ([972b473](https://www.github.com/googleapis/nodejs-rcloadenv/commit/972b473))


### BREAKING CHANGES

* **deps:** this will ship async/await with the generated code.
* upgrade engines field to >=8.10.0 (#71)

## v0.3.3

03-12-2019 12:20 PDT

Greetings y'all!  This is a patch service release that bumps a few dependencies.  That's it!

### Dependencies
- fix(deps): update dependency yargs to v13 ([#49](https://github.com/googleapis/nodejs-rcloadenv/pull/49))
- fix(deps): update dependency google-auth-library to v3 ([#39](https://github.com/googleapis/nodejs-rcloadenv/pull/39))

### Documentation
- docs: update links in contrib guide ([#51](https://github.com/googleapis/nodejs-rcloadenv/pull/51))
- docs: update contributing path in README ([#46](https://github.com/googleapis/nodejs-rcloadenv/pull/46))
- docs: move CONTRIBUTING.md to root ([#45](https://github.com/googleapis/nodejs-rcloadenv/pull/45))
- docs: add lint/fix example to contributing guide ([#43](https://github.com/googleapis/nodejs-rcloadenv/pull/43))

### Internal / Testing Changes
- build: Add docuploader credentials to node publish jobs ([#55](https://github.com/googleapis/nodejs-rcloadenv/pull/55))
- build: use node10 to run samples-test, system-test etc ([#54](https://github.com/googleapis/nodejs-rcloadenv/pull/54))
- build: update release configuration
- chore(deps): update dependency mocha to v6
- build: use linkinator for docs test ([#50](https://github.com/googleapis/nodejs-rcloadenv/pull/50))
- build: create docs test npm scripts ([#48](https://github.com/googleapis/nodejs-rcloadenv/pull/48))
- build: test using @grpc/grpc-js in CI ([#47](https://github.com/googleapis/nodejs-rcloadenv/pull/47))
- chore(deps): update dependency eslint-config-prettier to v4 ([#41](https://github.com/googleapis/nodejs-rcloadenv/pull/41))
- build: ignore googleapis.com in doc link check ([#40](https://github.com/googleapis/nodejs-rcloadenv/pull/40))
- build: check broken links in generated docs ([#37](https://github.com/googleapis/nodejs-rcloadenv/pull/37))
- refactor: improve the sample tests ([#36](https://github.com/googleapis/nodejs-rcloadenv/pull/36))
- chore: add synth.metadata ([#35](https://github.com/googleapis/nodejs-rcloadenv/pull/35))
- chore(build): inject yoshi automation key ([#34](https://github.com/googleapis/nodejs-rcloadenv/pull/34))
- chore: update nyc and eslint configs ([#33](https://github.com/googleapis/nodejs-rcloadenv/pull/33))
- chore: fix publish.sh permission +x ([#32](https://github.com/googleapis/nodejs-rcloadenv/pull/32))
- fix(build): fix Kokoro release script ([#31](https://github.com/googleapis/nodejs-rcloadenv/pull/31))
- build: add Kokoro configs for autorelease ([#30](https://github.com/googleapis/nodejs-rcloadenv/pull/30))
- chore: always nyc report before calling codecov ([#27](https://github.com/googleapis/nodejs-rcloadenv/pull/27))
- chore: nyc ignore build/test by default ([#26](https://github.com/googleapis/nodejs-rcloadenv/pull/26))
