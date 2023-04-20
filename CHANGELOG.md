# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/release-please?activeTab=versions

## [15.10.4](https://github.com/googleapis/release-please/compare/v15.10.3...v15.10.4) (2023-04-19)


### Bug Fixes

* Add more trace logging when searching for latest release version ([#1922](https://github.com/googleapis/release-please/issues/1922)) ([c33cc81](https://github.com/googleapis/release-please/commit/c33cc8112fc366242182bcb3a28015c488f6140b))

## [15.10.3](https://github.com/googleapis/release-please/compare/v15.10.2...v15.10.3) (2023-04-11)


### Bug Fixes

* NeedsBootstrap computation also considers tags ([#1915](https://github.com/googleapis/release-please/issues/1915)) ([2773b6e](https://github.com/googleapis/release-please/commit/2773b6e8ae6bf7bd98adb89ed0eb702a1705b27b))

## [15.10.2](https://github.com/googleapis/release-please/compare/v15.10.1...v15.10.2) (2023-04-11)


### Bug Fixes

* **github-changelog-notes:** Prepend header to create parseable release notes ([#1912](https://github.com/googleapis/release-please/issues/1912)) ([3f53d40](https://github.com/googleapis/release-please/commit/3f53d40c8c3f927fffdf8973128e12450703a6e4))

## [15.10.1](https://github.com/googleapis/release-please/compare/v15.10.0...v15.10.1) (2023-04-10)


### Bug Fixes

* **xml:** Preserve trailing newline if the xml file had one ([#1911](https://github.com/googleapis/release-please/issues/1911)) ([b899da6](https://github.com/googleapis/release-please/commit/b899da6637a5152fc13be5b89688c5f70c85563d))

## [15.10.0](https://github.com/googleapis/release-please/compare/v15.9.3...v15.10.0) (2023-04-10)


### Features

* Allow excluding file paths to filter out commits ([#1875](https://github.com/googleapis/release-please/issues/1875)) ([a9bed82](https://github.com/googleapis/release-please/commit/a9bed8232ccaa192fb004953e34c49279d3c779f))

## [15.9.3](https://github.com/googleapis/release-please/compare/v15.9.2...v15.9.3) (2023-04-10)


### Bug Fixes

* **python:** Handle large version numbers in setup.cfg ([#1906](https://github.com/googleapis/release-please/issues/1906)) ([9a7b11f](https://github.com/googleapis/release-please/commit/9a7b11f4d0797222fd65e871d4ba9f488a72d1d9))

## [15.9.2](https://github.com/googleapis/release-please/compare/v15.9.1...v15.9.2) (2023-03-28)


### Bug Fixes

* **cargo-workspace:** Find workspace modules on the target branch ([#1889](https://github.com/googleapis/release-please/issues/1889)) ([9647941](https://github.com/googleapis/release-please/commit/96479413fd5fe9d1c546d829e70bfaf99b36661a))

## [15.9.1](https://github.com/googleapis/release-please/compare/v15.9.0...v15.9.1) (2023-03-14)


### Bug Fixes

* **cargo-workspace:** Validate Cargo.toml version field ([#1877](https://github.com/googleapis/release-please/issues/1877)) ([0303e2e](https://github.com/googleapis/release-please/commit/0303e2eb9fb082bd9657baa117961d8567eba7e6))

## [15.9.0](https://github.com/googleapis/release-please/compare/v15.8.2...v15.9.0) (2023-03-14)


### Features

* Support for "@" sign in component name ([#1873](https://github.com/googleapis/release-please/issues/1873)) ([d3b2f2f](https://github.com/googleapis/release-please/commit/d3b2f2f72c5aada66d3297d38b26d4aa3661177c))


### Bug Fixes

* Allow linked-versions to skip merging pull requests ([#1779](https://github.com/googleapis/release-please/issues/1779)) ([dc48b55](https://github.com/googleapis/release-please/commit/dc48b55b459754493513da30f68dc2588d3e30d4))
* **refactor:** Rename Salesforce to sfdx ([#1829](https://github.com/googleapis/release-please/issues/1829)) ([122820d](https://github.com/googleapis/release-please/commit/122820d5a38a401e1bbdc4878b02f94cf405ad0e))

## [15.8.2](https://github.com/googleapis/release-please/compare/v15.8.1...v15.8.2) (2023-03-13)


### Bug Fixes

* **cargo-workspaces:** Expand globs in crate paths ([#1852](https://github.com/googleapis/release-please/issues/1852)) ([0179f25](https://github.com/googleapis/release-please/commit/0179f25bf3bed7bca71c3cbdae6cc5a892954fe7))

## [15.8.1](https://github.com/googleapis/release-please/compare/v15.8.0...v15.8.1) (2023-03-07)


### Bug Fixes

* **sequential-calls:** Use push instead of concat when returning releases ([#1865](https://github.com/googleapis/release-please/issues/1865)) ([1026c73](https://github.com/googleapis/release-please/commit/1026c7366a94b4dbfa567580613bcf31a991a516))

## [15.8.0](https://github.com/googleapis/release-please/compare/v15.7.0...v15.8.0) (2023-02-15)


### Features

* Scan readme files in java-yoshi-mono-repo strategy ([#1853](https://github.com/googleapis/release-please/issues/1853)) ([635cc7d](https://github.com/googleapis/release-please/commit/635cc7d03820d539f470c151db410dd2a8d29eae))


### Bug Fixes

* Github issues link ([#1849](https://github.com/googleapis/release-please/issues/1849)) ([68e6759](https://github.com/googleapis/release-please/commit/68e67591bbae5db51ce0ce7591898a2adf49be96))

## [15.7.0](https://github.com/googleapis/release-please/compare/v15.6.0...v15.7.0) (2023-02-07)


### Features

* **changelog.json:** Implement changelog.json for python ([#1841](https://github.com/googleapis/release-please/issues/1841)) ([52594b1](https://github.com/googleapis/release-please/commit/52594b194fdd0ae516776128e6511d5e4cd21518))

## [15.6.0](https://github.com/googleapis/release-please/compare/v15.5.1...v15.6.0) (2023-02-01)


### Features

* **changelog.json:** Add pr suffix to issues array ([#1839](https://github.com/googleapis/release-please/issues/1839)) ([fdd75ef](https://github.com/googleapis/release-please/commit/fdd75efbc276d432f1d9d54f1790f4852a4aa3f7))

## [15.5.1](https://github.com/googleapis/release-please/compare/v15.5.0...v15.5.1) (2023-01-30)


### Bug Fixes

* Support TOML up to v1.0.0-rc.1 spec. ([#1837](https://github.com/googleapis/release-please/issues/1837)) ([a3d94ee](https://github.com/googleapis/release-please/commit/a3d94eec209e00b6f513caa379096d082af7a72b))

## [15.5.0](https://github.com/googleapis/release-please/compare/v15.4.0...v15.5.0) (2023-01-27)


### Features

* Add generic TOML updater ([#1833](https://github.com/googleapis/release-please/issues/1833)) ([2768a4c](https://github.com/googleapis/release-please/commit/2768a4cfe131ac8493447a8c7512c623c200df34))
* Add toml generic updater option to extra-files schema ([#1835](https://github.com/googleapis/release-please/issues/1835)) ([9240f71](https://github.com/googleapis/release-please/commit/9240f71c21f077b240d2ce186456fb23b50dfd89))

## [15.4.0](https://github.com/googleapis/release-please/compare/v15.3.1...v15.4.0) (2023-01-26)


### Features

* **changelog.json:** Include referenced issues/prs ([#1830](https://github.com/googleapis/release-please/issues/1830)) ([bacbbb5](https://github.com/googleapis/release-please/commit/bacbbb52ad802d42af1ffb40e8c616cc6c6601a6))

## [15.3.1](https://github.com/googleapis/release-please/compare/v15.3.0...v15.3.1) (2023-01-26)


### Bug Fixes

* Filter changelog.json commits based on changelog sections ([#1827](https://github.com/googleapis/release-please/issues/1827)) ([844aacd](https://github.com/googleapis/release-please/commit/844aacd76434ae288ee3ac9b2061dd9406e99bd8))

## [15.3.0](https://github.com/googleapis/release-please/compare/v15.2.0...v15.3.0) (2023-01-25)


### Features

* Add Salesforce strategy ([#1815](https://github.com/googleapis/release-please/issues/1815)) ([25b518f](https://github.com/googleapis/release-please/commit/25b518f4f34afcd749968d021f4eed99222a328a))
* Add support for yarn workspace versions ([#1819](https://github.com/googleapis/release-please/issues/1819)) ([8b0cc7d](https://github.com/googleapis/release-please/commit/8b0cc7d7d203609c95e9e7cfbef4f0faedd3f46d))
* **java-monorepo:** Switch to using .repo-metadata.json ([#1820](https://github.com/googleapis/release-please/issues/1820)) ([6cc85db](https://github.com/googleapis/release-please/commit/6cc85dbb95ade1c38c354a567a02b8a41d729a72))
* **node:** Add support for changelog.json in Node ([#1823](https://github.com/googleapis/release-please/issues/1823)) ([d3e3bd3](https://github.com/googleapis/release-please/commit/d3e3bd3b102195befb051457f9a837ff47388157))

## [15.2.0](https://github.com/googleapis/release-please/compare/v15.1.2...v15.2.0) (2023-01-23)


### Features

* **cli:** Add ability to dynamically load release-please plugin ([#1811](https://github.com/googleapis/release-please/issues/1811)) ([609383b](https://github.com/googleapis/release-please/commit/609383be5a05bb0107b489314b4bcd7615ddafd9))
* Export Strategy interface so external packages can implement ([609383b](https://github.com/googleapis/release-please/commit/609383be5a05bb0107b489314b4bcd7615ddafd9))
* Introduce ChangelogJson updater ([#1808](https://github.com/googleapis/release-please/issues/1808)) ([fe3a979](https://github.com/googleapis/release-please/commit/fe3a979a1c228610612aa2d6c303d408be956e2e))
* Introduce JavaYoshiMonoRepo strategy ([#1810](https://github.com/googleapis/release-please/issues/1810)) ([2d14307](https://github.com/googleapis/release-please/commit/2d143077a545b92e1d9de923ab81ae1e12b7a468))

## [15.1.2](https://github.com/googleapis/release-please/compare/v15.1.1...v15.1.2) (2023-01-17)


### Bug Fixes

* **ruby:** Gemfile.lock should not update when gem name is empty ([#1805](https://github.com/googleapis/release-please/issues/1805)) ([b54d499](https://github.com/googleapis/release-please/commit/b54d499a6b38e13175402fbd7eb7be75094d5014))

## [15.1.1](https://github.com/googleapis/release-please/compare/v15.1.0...v15.1.1) (2023-01-06)


### Bug Fixes

* **deps:** Update @google-automations/git-file-utils to 1.2.5 ([89f363e](https://github.com/googleapis/release-please/commit/89f363e015bb3a5a7e738232352db70e4d336d86))
* **deps:** Update code-suggester to 4.2.0 ([#1799](https://github.com/googleapis/release-please/issues/1799)) ([89f363e](https://github.com/googleapis/release-please/commit/89f363e015bb3a5a7e738232352db70e4d336d86))

## [15.1.0](https://github.com/googleapis/release-please/compare/v15.0.0...v15.1.0) (2023-01-05)


### Features

* **ruby:** Add Gemfile.Lock updater ([#1790](https://github.com/googleapis/release-please/issues/1790)) ([9baf736](https://github.com/googleapis/release-please/commit/9baf736aa424bf3dcf0f05009e5cf8c9ef05fd69))


### Bug Fixes

* **java-yoshi:** Throw MissingRequiredFile error if no versions.txt found ([#1794](https://github.com/googleapis/release-please/issues/1794)) ([542d412](https://github.com/googleapis/release-please/commit/542d412307ea8d6350908aeb7efaf9db9e3d03f9))

## [15.0.0](https://github.com/googleapis/release-please/compare/v14.17.5...v15.0.0) (2022-12-12)


### ⚠ BREAKING CHANGES

* Strategies can parse multiple releases from single release PR ([#1775](https://github.com/googleapis/release-please/issues/1775))
* Parse conventional commits in manifest ([#1772](https://github.com/googleapis/release-please/issues/1772))

### Features

* Strategies can parse multiple releases from single release PR ([#1775](https://github.com/googleapis/release-please/issues/1775)) ([b565f85](https://github.com/googleapis/release-please/commit/b565f85b64a431be1d62f8e682c183c4c1f1c631))


### Code Refactoring

* Parse conventional commits in manifest ([#1772](https://github.com/googleapis/release-please/issues/1772)) ([3391d3b](https://github.com/googleapis/release-please/commit/3391d3bc916ad07102bbb3873b93aeac6e13977c))

## [14.17.5](https://github.com/googleapis/release-please/compare/v14.17.4...v14.17.5) (2022-12-08)


### Bug Fixes

* **expo:** Android version now correctly builds as a number ([#1770](https://github.com/googleapis/release-please/issues/1770)) ([d54483b](https://github.com/googleapis/release-please/commit/d54483be6d307aea75797f6a5bcfa6679b64088f))

## [14.17.4](https://github.com/googleapis/release-please/compare/v14.17.3...v14.17.4) (2022-12-01)


### Bug Fixes

* Pass group-pull-request-title-pattern to strategies to parse releases ([#1760](https://github.com/googleapis/release-please/issues/1760)) ([f7601e4](https://github.com/googleapis/release-please/commit/f7601e423a267861fb86a441d1835ddf6da07a83))

## [14.17.3](https://github.com/googleapis/release-please/compare/v14.17.2...v14.17.3) (2022-11-26)


### Bug Fixes

* Handle incrementing ruby patch versions larger than 1 digit ([#1762](https://github.com/googleapis/release-please/issues/1762)) ([7ad300e](https://github.com/googleapis/release-please/commit/7ad300e97a79acf4c3dbe0b9af8586eb32ab81cf))

## [14.17.2](https://github.com/googleapis/release-please/compare/v14.17.1...v14.17.2) (2022-11-22)


### Bug Fixes

* Handle issue links in BREAKING_CHANGE notes section ([#1757](https://github.com/googleapis/release-please/issues/1757)) ([cd8c04b](https://github.com/googleapis/release-please/commit/cd8c04b4d7a67116b31baff60279fa6d719c73a0))

## [14.17.1](https://github.com/googleapis/release-please/compare/v14.17.0...v14.17.1) (2022-11-22)


### Bug Fixes

* **dart:** Throw MissingRequiredFileError if pubspec.yaml is missing ([#1756](https://github.com/googleapis/release-please/issues/1756)) ([ada9fd6](https://github.com/googleapis/release-please/commit/ada9fd6db42aa6db0db52b8a81aa7f70b064e914))
* **helm:** throw MissingRequiredFileError if Chart.yaml is missing ([ada9fd6](https://github.com/googleapis/release-please/commit/ada9fd6db42aa6db0db52b8a81aa7f70b064e914))
* **node-workspace:** Maintain the dependency version prefix in newCandidate ([#1748](https://github.com/googleapis/release-please/issues/1748)) ([909d310](https://github.com/googleapis/release-please/commit/909d310defdf24adfd4858bbe1604668c14ef77f))

## [14.17.0](https://github.com/googleapis/release-please/compare/v14.16.0...v14.17.0) (2022-11-11)


### Features

* add always-bump-major versioning strategy ([7526ca8](https://github.com/googleapis/release-please/commit/7526ca8be4fec4d785b44bfb8c8c70078ad7fc73))
* Add always-bump-minor versioning strategy ([#1744](https://github.com/googleapis/release-please/issues/1744)) ([7526ca8](https://github.com/googleapis/release-please/commit/7526ca8be4fec4d785b44bfb8c8c70078ad7fc73))

## [14.16.0](https://github.com/googleapis/release-please/compare/v14.15.3...v14.16.0) (2022-11-03)


### Features

* **node-workspace:** Maintain current version range prefix ([#1723](https://github.com/googleapis/release-please/issues/1723)) ([53e2599](https://github.com/googleapis/release-please/commit/53e25997fc9fd06fe83735ab5f9aef0f12639b16))

## [14.15.3](https://github.com/googleapis/release-please/compare/v14.15.2...v14.15.3) (2022-11-02)


### Bug Fixes

* **deps:** Bump minimum required xmldom to 0.8.4 ([#1736](https://github.com/googleapis/release-please/issues/1736)) ([11bbc85](https://github.com/googleapis/release-please/commit/11bbc85d8f7cc20e132979d129c1dfc11a269292))

## [14.15.2](https://github.com/googleapis/release-please/compare/v14.15.1...v14.15.2) (2022-11-01)


### Bug Fixes

* Allow overlapping paths when splitting commits ([#1733](https://github.com/googleapis/release-please/issues/1733)) ([adcb99a](https://github.com/googleapis/release-please/commit/adcb99acdbff9ddeea527b673bc8820edff68f2a))
* **cargo-workspace:** Update target dependencies in Cargo workspace packages ([#1730](https://github.com/googleapis/release-please/issues/1730)) ([3ca3bbc](https://github.com/googleapis/release-please/commit/3ca3bbcef729a359805473fdc798b5af5ab22861))

## [14.15.1](https://github.com/googleapis/release-please/compare/v14.15.0...v14.15.1) (2022-10-28)


### Bug Fixes

* **maven-workspace:** SNAPSHOT versions should not be included in the manifest ([#1727](https://github.com/googleapis/release-please/issues/1727)) ([d926c84](https://github.com/googleapis/release-please/commit/d926c840ec99de013a0b5cb198f9fb2700930cf7))

## [14.15.0](https://github.com/googleapis/release-please/compare/v14.14.0...v14.15.0) (2022-10-27)


### Features

* **php-yoshi:** Add "misc" as trigger, hide "chore" ([#1725](https://github.com/googleapis/release-please/issues/1725)) ([f7a9d09](https://github.com/googleapis/release-please/commit/f7a9d091670f0a70a13a1b641fbc6d07ec000da2))


### Bug Fixes

* **deps:** Update dependency type-fest to v3 ([#1649](https://github.com/googleapis/release-please/issues/1649)) ([d3c3a3e](https://github.com/googleapis/release-please/commit/d3c3a3eae6557994ad244c0bdd79e1782971d2c1))

## [14.14.0](https://github.com/googleapis/release-please/compare/v14.13.2...v14.14.0) (2022-10-25)


### Features

* Extract and return the created release id ([#1719](https://github.com/googleapis/release-please/issues/1719)) ([ef1c156](https://github.com/googleapis/release-please/commit/ef1c156ab1d44969548b4cb30b412b2066568aa4))

## [14.13.2](https://github.com/googleapis/release-please/compare/v14.13.1...v14.13.2) (2022-10-18)


### Bug Fixes

* **python:** Version updater updates patch versions &gt;= 10 ([#1708](https://github.com/googleapis/release-please/issues/1708)) ([80b3d4f](https://github.com/googleapis/release-please/commit/80b3d4fce7d494575b4f136e68bad1c508600ea0))

## [14.13.1](https://github.com/googleapis/release-please/compare/v14.13.0...v14.13.1) (2022-10-14)


### Bug Fixes

* Updating a pull request uses overflow handler if body is too large ([#1702](https://github.com/googleapis/release-please/issues/1702)) ([f328511](https://github.com/googleapis/release-please/commit/f3285115a9c0e4a199f86038319bafd6d604d96a))

## [14.13.0](https://github.com/googleapis/release-please/compare/v14.12.0...v14.13.0) (2022-10-13)


### Features

* Handle extremely large pull request body fields ([#1689](https://github.com/googleapis/release-please/issues/1689)) ([ecc424d](https://github.com/googleapis/release-please/commit/ecc424db9a86e742eb6b4f6f9271a8eae13e4efc))

## [14.12.0](https://github.com/googleapis/release-please/compare/v14.11.2...v14.12.0) (2022-10-12)


### Features

* Added expo strategy and updater ([#1646](https://github.com/googleapis/release-please/issues/1646)) ([9cb84cb](https://github.com/googleapis/release-please/commit/9cb84cb18211c61ed94d856b936fff30036b0988))

## [14.11.2](https://github.com/googleapis/release-please/compare/v14.11.1...v14.11.2) (2022-10-11)


### Bug Fixes

* Add initial-version to allowed properties in manifest schema ([#1691](https://github.com/googleapis/release-please/issues/1691)) ([408ddac](https://github.com/googleapis/release-please/commit/408ddac5dd4e1bc2c9b992365fa864e80298cee5))

## [14.11.1](https://github.com/googleapis/release-please/compare/v14.11.0...v14.11.1) (2022-10-10)


### Bug Fixes

* Explicitly sort PRs by updated desc ([#1685](https://github.com/googleapis/release-please/issues/1685)) ([807bda0](https://github.com/googleapis/release-please/commit/807bda0ab3e09e6116b43cd670bab1115bfdbff2))

## [14.11.0](https://github.com/googleapis/release-please/compare/v14.10.2...v14.11.0) (2022-10-05)


### Features

* **maven-workspace:** Update all discovered pom.xml within the components ([#1667](https://github.com/googleapis/release-please/issues/1667)) ([ace68d3](https://github.com/googleapis/release-please/commit/ace68d346291db6b591b9b3e1735d12f0a2b2bbc))

## [14.10.2](https://github.com/googleapis/release-please/compare/v14.10.1...v14.10.2) (2022-10-04)


### Bug Fixes

* **maven-workspace:** Preserve original pom.xml updater when bumping dependencies ([#1680](https://github.com/googleapis/release-please/issues/1680)) ([5d955c6](https://github.com/googleapis/release-please/commit/5d955c6e0c5896d2aedea08c5c0f12ac35972757))

## [14.10.1](https://github.com/googleapis/release-please/compare/v14.10.0...v14.10.1) (2022-10-03)


### Bug Fixes

* Put config schema on correct file ([#1678](https://github.com/googleapis/release-please/issues/1678)) ([6edc50b](https://github.com/googleapis/release-please/commit/6edc50b5599180b7ffa83a623559d328527e9274))

## [14.10.0](https://github.com/googleapis/release-please/compare/v14.9.0...v14.10.0) (2022-09-30)


### Features

* Add ability to set extra labels on components ([#1669](https://github.com/googleapis/release-please/issues/1669)) ([e05d43e](https://github.com/googleapis/release-please/commit/e05d43e0e9eb35ea7d9b47d7e0b13effc4c1422a)), closes [#1624](https://github.com/googleapis/release-please/issues/1624)
* **cli:** Add debug command for loading a manifest config ([#1671](https://github.com/googleapis/release-please/issues/1671)) ([98078a3](https://github.com/googleapis/release-please/commit/98078a3d3fab0eeaf456fbcbe1827dc0185d0424))


### Bug Fixes

* **cli:** bootstrap command respects --dry-run argument ([67fcb19](https://github.com/googleapis/release-please/commit/67fcb19cf3a7334092c08b65ae7b2c83b16db5d6))
* fix schema definition for label and release-label ([e05d43e](https://github.com/googleapis/release-please/commit/e05d43e0e9eb35ea7d9b47d7e0b13effc4c1422a))
* Manifest config bootstrapper should include schema field ([#1670](https://github.com/googleapis/release-please/issues/1670)) ([67fcb19](https://github.com/googleapis/release-please/commit/67fcb19cf3a7334092c08b65ae7b2c83b16db5d6))

## [14.9.0](https://github.com/googleapis/release-please/compare/v14.8.0...v14.9.0) (2022-09-30)


### Features

* Add initial version to base strategy ([#1665](https://github.com/googleapis/release-please/issues/1665)) ([c867403](https://github.com/googleapis/release-please/commit/c867403e50cacbb88ddf545b2c0888f2c500edcc))

## [14.8.0](https://github.com/googleapis/release-please/compare/v14.7.2...v14.8.0) (2022-09-28)


### Features

* Add `group-priority` plugin ([#1660](https://github.com/googleapis/release-please/issues/1660)) ([3ca750a](https://github.com/googleapis/release-please/commit/3ca750af3be8af06f9b6d0ed835524d53eab09c5))


### Bug Fixes

* Escape html tags in release notes ([#1661](https://github.com/googleapis/release-please/issues/1661)) ([891fdcb](https://github.com/googleapis/release-please/commit/891fdcb0776abd8b3518bb60c44873f55fd616a3))

## [14.7.2](https://github.com/googleapis/release-please/compare/v14.7.1...v14.7.2) (2022-09-26)


### Bug Fixes

* Graphql should also configure proxy agent ([#1655](https://github.com/googleapis/release-please/issues/1655)) ([c68f057](https://github.com/googleapis/release-please/commit/c68f05717148061a1f4365a2323474a72c567a08))

## [14.7.1](https://github.com/googleapis/release-please/compare/v14.7.0...v14.7.1) (2022-09-22)


### Bug Fixes

* Handle pull request files returned as null ([#1651](https://github.com/googleapis/release-please/issues/1651)) ([4cea3dd](https://github.com/googleapis/release-please/commit/4cea3dd1b17ee31e27c1d246e83fcf39f28f0677))
* **node:** Rethrow missing file error for package.json as a configuration error ([#1652](https://github.com/googleapis/release-please/issues/1652)) ([65ee57b](https://github.com/googleapis/release-please/commit/65ee57b433f67d87db3c2530dad4207218dae6d2))

## [14.7.0](https://github.com/googleapis/release-please/compare/v14.6.1...v14.7.0) (2022-09-20)


### Features

* Easy proxy configuration ([#1639](https://github.com/googleapis/release-please/issues/1639)) ([4bb4c65](https://github.com/googleapis/release-please/commit/4bb4c658e3c30150432802b5ccc2aa5a96332f1e))


### Bug Fixes

* **commit-split:** Detect overlapping prefixes ([#1638](https://github.com/googleapis/release-please/issues/1638)) ([db51b29](https://github.com/googleapis/release-please/commit/db51b295d711e657ee5928bc32a3dbb88c793969)), closes [#1637](https://github.com/googleapis/release-please/issues/1637)

## [14.6.1](https://github.com/googleapis/release-please/compare/v14.6.0...v14.6.1) (2022-09-20)


### Bug Fixes

* Detect uppercase readme.md files ([#1644](https://github.com/googleapis/release-please/issues/1644)) ([d3b68b2](https://github.com/googleapis/release-please/commit/d3b68b2afe622b0a9f83c77da33bfcf1bc4c77b4))

## [14.6.0](https://github.com/googleapis/release-please/compare/v14.5.0...v14.6.0) (2022-09-15)


### Features

* Allow nesting multiple commits that are parsed independently ([#1566](https://github.com/googleapis/release-please/issues/1566)) ([21ed59a](https://github.com/googleapis/release-please/commit/21ed59a1db32c6b9593931519bfa3b1eb456a4a7))


### Bug Fixes

* **deps:** Update dependency node-html-parser to v6 ([#1633](https://github.com/googleapis/release-please/issues/1633)) ([af213c4](https://github.com/googleapis/release-please/commit/af213c404a87754747bc3becab6b5759320d7508))

## [14.5.0](https://github.com/googleapis/release-please/compare/v14.4.0...v14.5.0) (2022-09-07)


### Features

* Allow specifying glob option for extra-files ([#1621](https://github.com/googleapis/release-please/issues/1621)) ([d0fbd90](https://github.com/googleapis/release-please/commit/d0fbd90659f14b975ba56570712b8a4b1ed59e25)), closes [#1619](https://github.com/googleapis/release-please/issues/1619)

## [14.4.0](https://github.com/googleapis/release-please/compare/v14.3.1...v14.4.0) (2022-09-07)


### Features

* Update elixir version in module attribute ([#1630](https://github.com/googleapis/release-please/issues/1630)) ([1af59a1](https://github.com/googleapis/release-please/commit/1af59a162bc6b858c696a3cb4eee1ed9a47f4256))


### Bug Fixes

* Allow parentheses in `pull-request-title-pattern` ([#1627](https://github.com/googleapis/release-please/issues/1627)) ([20f8684](https://github.com/googleapis/release-please/commit/20f8684740151ebcb7f902026c250a0e20515746))

## [14.3.1](https://github.com/googleapis/release-please/compare/v14.3.0...v14.3.1) (2022-09-06)


### Bug Fixes

* **sentence-case:** handle multiple colons in subject ([0564594](https://github.com/googleapis/release-please/commit/05645949c771a3898a8521520322dd952c9aa6ff))

## [14.3.0](https://github.com/googleapis/release-please/compare/v14.2.4...v14.3.0) (2022-08-31)


### Features

* introduce `sentence-case` plugin that capitalizes commit messages ([414eb5f](https://github.com/googleapis/release-please/commit/414eb5f716662569c72ff4cae2b1d1c95c0441ea))
* introduce processCommits hook for plugins ([#1607](https://github.com/googleapis/release-please/issues/1607)) ([414eb5f](https://github.com/googleapis/release-please/commit/414eb5f716662569c72ff4cae2b1d1c95c0441ea))


### Bug Fixes

* add changelog-path to valid config schema ([#1612](https://github.com/googleapis/release-please/issues/1612)) ([c2937ba](https://github.com/googleapis/release-please/commit/c2937ba9f96e7d7c78332ceba94d1ebcee35768b))

## [14.2.4](https://github.com/googleapis/release-please/compare/v14.2.3...v14.2.4) (2022-08-30)


### Bug Fixes

* prepend release notes to non-conforming changelog ([#1615](https://github.com/googleapis/release-please/issues/1615)) ([7d6c4c5](https://github.com/googleapis/release-please/commit/7d6c4c5aabd39436762253b019e17a5922ffa560))

## [14.2.3](https://github.com/googleapis/release-please/compare/v14.2.2...v14.2.3) (2022-08-30)


### Bug Fixes

* dont filter out root package in node workspace candidate filtering ([#1606](https://github.com/googleapis/release-please/issues/1606)) ([c8560d5](https://github.com/googleapis/release-please/commit/c8560d519db50690ac6dd3409dd2b3560f4c12a5))

## [14.2.2](https://github.com/googleapis/release-please/compare/v14.2.1...v14.2.2) (2022-08-30)


### Bug Fixes

* look at merged_at field to determine merge status ([#1609](https://github.com/googleapis/release-please/issues/1609)) ([1c9beac](https://github.com/googleapis/release-please/commit/1c9beacb49d82f2aa594ef0511fa8d9cfd743b11))

## [14.2.1](https://github.com/googleapis/release-please/compare/v14.2.0...v14.2.1) (2022-08-25)


### Bug Fixes

* allow providing logger to GitHub.create ([#1603](https://github.com/googleapis/release-please/issues/1603)) ([a14e906](https://github.com/googleapis/release-please/commit/a14e906991e0120d0a85d1c4d739999cd6c9f1e4))

## [14.2.0](https://github.com/googleapis/release-please/compare/v14.1.2...v14.2.0) (2022-08-25)


### Features

* maintain an instance logger ([#1599](https://github.com/googleapis/release-please/issues/1599)) ([adb8053](https://github.com/googleapis/release-please/commit/adb805357d6344f1737bb3541ec7354e76f45cdc))

## [14.1.2](https://github.com/googleapis/release-please/compare/v14.1.1...v14.1.2) (2022-08-25)


### Bug Fixes

* **deps:** update code-suggester to 4.1.0 ([#1600](https://github.com/googleapis/release-please/issues/1600)) ([e123a39](https://github.com/googleapis/release-please/commit/e123a392798e30ce75808f3b74e9b9836832725f))

## [14.1.1](https://github.com/googleapis/release-please/compare/v14.1.0...v14.1.1) (2022-08-23)


### Bug Fixes

* add REST API call to fetch pull requests without files ([#1591](https://github.com/googleapis/release-please/issues/1591)) ([b875a1f](https://github.com/googleapis/release-please/commit/b875a1f437889a46f8cb6e86648073b51401ab9e))

## [14.1.0](https://github.com/googleapis/release-please/compare/v14.0.0...v14.1.0) (2022-08-19)


### Features

* Allow $schema key in manifest config schema ([#1584](https://github.com/googleapis/release-please/issues/1584)) ([d0d43a0](https://github.com/googleapis/release-please/commit/d0d43a0f15d44941c2338f3c8e8c9f972fb45938))
* customize pr body header ([#1579](https://github.com/googleapis/release-please/issues/1579)) ([92e1366](https://github.com/googleapis/release-please/commit/92e13664bc5a7c4b849f3cea367944280e20b894))
* use file-cache from git-file-utils ([#1585](https://github.com/googleapis/release-please/issues/1585)) ([e0572f8](https://github.com/googleapis/release-please/commit/e0572f899202ddbad995e8ff21621166d7aae07e))


### Bug Fixes

* convert `MissingFileError` thrown by `git-file-utils` ([#1590](https://github.com/googleapis/release-please/issues/1590)) ([cf4f0a3](https://github.com/googleapis/release-please/commit/cf4f0a3068a049cac99d191f40195c686baee413))
* correct $schema format in manifest config schema ([#1589](https://github.com/googleapis/release-please/issues/1589)) ([e25537b](https://github.com/googleapis/release-please/commit/e25537b559d56c46aedba1e83f7dda7c6825781f))
* **deps:** update git-file-utils to 1.1.0 ([297a7b7](https://github.com/googleapis/release-please/commit/297a7b7ef862b7aa5e64a6077f86d674eefc140e))
* use git-file-utils' cache for file search ([#1588](https://github.com/googleapis/release-please/issues/1588)) ([297a7b7](https://github.com/googleapis/release-please/commit/297a7b7ef862b7aa5e64a6077f86d674eefc140e))

## [14.0.0](https://github.com/googleapis/release-please/compare/v13.21.0...v14.0.0) (2022-08-15)


### ⚠ BREAKING CHANGES

* **deps:** update octokit packages
* drop node 12 support (#1577)

### Bug Fixes

* **deps:** update code-suggester to v4 ([3fc0173](https://github.com/googleapis/release-please/commit/3fc0173e7342e082794c1911b2e7a6e61d810348))
* **deps:** update octokit packages ([3fc0173](https://github.com/googleapis/release-please/commit/3fc0173e7342e082794c1911b2e7a6e61d810348))


### Build System

* drop node 12 support ([#1577](https://github.com/googleapis/release-please/issues/1577)) ([3fc0173](https://github.com/googleapis/release-please/commit/3fc0173e7342e082794c1911b2e7a6e61d810348))

## [13.21.0](https://github.com/googleapis/release-please/compare/v13.20.0...v13.21.0) (2022-08-11)


### Features

* parse versioning type from the manifest config ([#1572](https://github.com/googleapis/release-please/issues/1572)) ([8a7bfc1](https://github.com/googleapis/release-please/commit/8a7bfc165755cec97cc9a3baa39ccd21e719644c)), closes [#1569](https://github.com/googleapis/release-please/issues/1569)


### Bug Fixes

* throw underlying API error when the manifest fetch commits when determining the latest released version ([#1571](https://github.com/googleapis/release-please/issues/1571)) ([0944bde](https://github.com/googleapis/release-please/commit/0944bdeb04bcee2872e79a07fbe05967847caef0))

## [13.20.0](https://github.com/googleapis/release-please/compare/v13.19.9...v13.20.0) (2022-08-08)


### Features

* allow plugins to skip merging in-scope pull requests ([#1550](https://github.com/googleapis/release-please/issues/1550)) ([354b1dc](https://github.com/googleapis/release-please/commit/354b1dc89c468e44b59507b4bb2f15d6723110ed))
* allow skipping snapshots for java strategies ([#1555](https://github.com/googleapis/release-please/issues/1555)) ([3430693](https://github.com/googleapis/release-please/commit/34306932e5fe21c89020b184a527c220d10c8390))

## [13.19.9](https://github.com/googleapis/release-please/compare/v13.19.8...v13.19.9) (2022-08-08)


### Bug Fixes

* php root-composer-update-packages version replace ([#1553](https://github.com/googleapis/release-please/issues/1553)) ([41127e6](https://github.com/googleapis/release-please/commit/41127e688597a0af6502957d85ba8cd6214e9008))

## [13.19.8](https://github.com/googleapis/release-please/compare/v13.19.7...v13.19.8) (2022-08-03)


### Bug Fixes

* convert ReleaserConfig JSON keys when bootstrapping ([#1535](https://github.com/googleapis/release-please/issues/1535)) ([64c267e](https://github.com/googleapis/release-please/commit/64c267e1c986029b6c483b924950135c138c510f)), closes [#1522](https://github.com/googleapis/release-please/issues/1522)

## [13.19.7](https://github.com/googleapis/release-please/compare/v13.19.6...v13.19.7) (2022-08-03)


### Bug Fixes

* handles pull request iterator when graphQL returns no files ([#1544](https://github.com/googleapis/release-please/issues/1544)) ([7d0f873](https://github.com/googleapis/release-please/commit/7d0f87361f9ddd3f55eb2f40ef7150c9b7f39f34))

## [13.19.6](https://github.com/googleapis/release-please/compare/v13.19.5...v13.19.6) (2022-07-27)


### Bug Fixes

* skip component when manifest release does not include component ([#1537](https://github.com/googleapis/release-please/issues/1537)) ([8f1a3a8](https://github.com/googleapis/release-please/commit/8f1a3a84a7abc81c47d8cac9295e58bc37cc92c5)), closes [#1536](https://github.com/googleapis/release-please/issues/1536)

## [13.19.5](https://github.com/googleapis/release-please/compare/v13.19.4...v13.19.5) (2022-07-26)


### Bug Fixes

* **dart:** add multiline flag to replace regex ([#1524](https://github.com/googleapis/release-please/issues/1524)) ([fd7b73b](https://github.com/googleapis/release-please/commit/fd7b73b8f9288dbfa84f37a6ce2e77f6c1b49db8)), closes [#1523](https://github.com/googleapis/release-please/issues/1523)

## [13.19.4](https://github.com/googleapis/release-please/compare/v13.19.3...v13.19.4) (2022-07-25)


### Bug Fixes

* **commits:** remove content before and after BREAKING in body ([#1531](https://github.com/googleapis/release-please/issues/1531)) ([f75e49f](https://github.com/googleapis/release-please/commit/f75e49f6b751347456746d9c4068191d340c8e1e))
* **python:** make` __init__.py` bump underscore / hyphen agnostic ([4b25a47](https://github.com/googleapis/release-please/commit/4b25a475d53fd4f2eadd14619f701e51275f8e62))

## [13.19.3](https://github.com/googleapis/release-please/compare/v13.19.2...v13.19.3) (2022-07-08)


### Bug Fixes

* stop iterating if we fail to receive commits from a graphql query ([#1518](https://github.com/googleapis/release-please/issues/1518)) ([0f27cb5](https://github.com/googleapis/release-please/commit/0f27cb58d5a21e95a4f1a6c3fcfff019cdfdaff9))

## [13.19.2](https://github.com/googleapis/release-please/compare/v13.19.1...v13.19.2) (2022-07-06)


### Bug Fixes

* move schemas to their own directory and add to dist ([#1512](https://github.com/googleapis/release-please/issues/1512)) ([b7fb4ad](https://github.com/googleapis/release-please/commit/b7fb4ad6182a050a2c2a8376b4dd84d105b83438)), closes [#1511](https://github.com/googleapis/release-please/issues/1511)

## [13.19.1](https://github.com/googleapis/release-please/compare/v13.19.0...v13.19.1) (2022-07-06)


### Bug Fixes

* fix file tree listing for extremely large repositories ([#1505](https://github.com/googleapis/release-please/issues/1505)) ([b6ea25e](https://github.com/googleapis/release-please/commit/b6ea25ef34720b16697f598d957604530908e195))

## [13.19.0](https://github.com/googleapis/release-please/compare/v13.18.7...v13.19.0) (2022-06-30)


### Features

* add manifest schemas ([#1496](https://github.com/googleapis/release-please/issues/1496)) ([adf84ad](https://github.com/googleapis/release-please/commit/adf84ad3ebb8723ebc0e1232cd899c323c36cbfc))

## [13.18.7](https://github.com/googleapis/release-please/compare/v13.18.6...v13.18.7) (2022-06-30)


### Bug Fixes

* correctly parse the changelog-type from the manifest config ([#1498](https://github.com/googleapis/release-please/issues/1498)) ([452f084](https://github.com/googleapis/release-please/commit/452f084ef8f664830c560472802e5942804df02d))
* pull request title component can include '/' ([#1499](https://github.com/googleapis/release-please/issues/1499)) ([19a8e82](https://github.com/googleapis/release-please/commit/19a8e8263500dedd32f3b555a9f00f8627f27a6d))

## [13.18.6](https://github.com/googleapis/release-please/compare/v13.18.5...v13.18.6) (2022-06-27)


### Bug Fixes

* **dotnet-yoshi:** autodetect component from path ([563ef02](https://github.com/googleapis/release-please/commit/563ef02210cc8bd52eedbfaa0a00787bc2e41ee6))
* **dotnet-yoshi:** handle existing google-cloud-dotnet history format ([#1486](https://github.com/googleapis/release-please/issues/1486)) ([563ef02](https://github.com/googleapis/release-please/commit/563ef02210cc8bd52eedbfaa0a00787bc2e41ee6))

## [13.18.5](https://github.com/googleapis/release-please/compare/v13.18.4...v13.18.5) (2022-06-24)


### Bug Fixes

* **ruby-yoshi:** don't remove PR link from changelog ([#1479](https://github.com/googleapis/release-please/issues/1479)) ([6faaebe](https://github.com/googleapis/release-please/commit/6faaebe3c317bfa1b4d98992733283296bafa20f))

## [13.18.4](https://github.com/googleapis/release-please/compare/v13.18.3...v13.18.4) (2022-06-24)


### Bug Fixes

* **cli:** pass GitHub API URLs from options to builder ([#1481](https://github.com/googleapis/release-please/issues/1481)) ([44b39ba](https://github.com/googleapis/release-please/commit/44b39baf90c19db1440f142eddd9cf9ed99c2da3))
* **go:** hide unwanted changelog sections ([#1483](https://github.com/googleapis/release-please/issues/1483)) ([60ed310](https://github.com/googleapis/release-please/commit/60ed310caf8895501d31efc6a5e28a3855b5cd78))

## [13.18.3](https://github.com/googleapis/release-please/compare/v13.18.2...v13.18.3) (2022-06-08)


### Bug Fixes

* handle malformed manifest JSON and throw ConfigurationError ([#1469](https://github.com/googleapis/release-please/issues/1469)) ([e3af138](https://github.com/googleapis/release-please/commit/e3af1383d8ba5c127a1e19187081353565e673f8))

## [13.18.2](https://github.com/googleapis/release-please/compare/v13.18.1...v13.18.2) (2022-06-08)


### Bug Fixes

* factory errors for unknown types throw ConfigurationError instead of Error ([#1467](https://github.com/googleapis/release-please/issues/1467)) ([faa5d25](https://github.com/googleapis/release-please/commit/faa5d25fa2075d27d42238adf34e54f6a1bc39a4))

## [13.18.1](https://github.com/googleapis/release-please/compare/v13.18.0...v13.18.1) (2022-06-08)


### Bug Fixes

* set default bootstrap path to . ([#1464](https://github.com/googleapis/release-please/issues/1464)) ([c2bfbe5](https://github.com/googleapis/release-please/commit/c2bfbe5affe504f4a5183f79e338f9e7d48a8386)), closes [#1450](https://github.com/googleapis/release-please/issues/1450)

## [13.18.0](https://github.com/googleapis/release-please/compare/v13.17.1...v13.18.0) (2022-06-01)


### Features

* add support for generic yaml updater ([#1452](https://github.com/googleapis/release-please/issues/1452)) ([002231a](https://github.com/googleapis/release-please/commit/002231acfa49b3859a7eaee184a2b520eb6611d3))


### Bug Fixes

* fix parsing of tags with major versions higher than 9 ([#1451](https://github.com/googleapis/release-please/issues/1451)) ([5fc402a](https://github.com/googleapis/release-please/commit/5fc402ae41cd5aba4be5155f90fbc39f9369817d))

### [13.17.1](https://github.com/googleapis/release-please/compare/v13.17.0...v13.17.1) (2022-05-27)


### Bug Fixes

* **deps:** headings are now always H2 ([#1454](https://github.com/googleapis/release-please/issues/1454)) ([32a2fe4](https://github.com/googleapis/release-please/commit/32a2fe497b51be7def2646c1aceebd9c5c6a167e)), closes [#1389](https://github.com/googleapis/release-please/issues/1389)

## [13.17.0](https://github.com/googleapis/release-please/compare/v13.16.6...v13.17.0) (2022-05-24)


### Features

* add maven-workspace plugin ([#1446](https://github.com/googleapis/release-please/issues/1446)) ([ef4d728](https://github.com/googleapis/release-please/commit/ef4d7283143d6ca70c3b894322975a9a2852dfaa))
* PomXml updater can update dependency versions ([ef4d728](https://github.com/googleapis/release-please/commit/ef4d7283143d6ca70c3b894322975a9a2852dfaa))

### [13.16.6](https://github.com/googleapis/release-please/compare/v13.16.5...v13.16.6) (2022-05-24)


### Bug Fixes

* allow brackets in custom pull request title ([#1445](https://github.com/googleapis/release-please/issues/1445)) ([5cdbc5b](https://github.com/googleapis/release-please/commit/5cdbc5b6735392a64ae93d578e287b27c0b34d05)), closes [#1444](https://github.com/googleapis/release-please/issues/1444)
* **deps:** update dependency code-suggester to v3 ([#1441](https://github.com/googleapis/release-please/issues/1441)) ([8473c99](https://github.com/googleapis/release-please/commit/8473c99e12311b9a65441ff11d46990a1a494c6a))

### [13.16.5](https://github.com/googleapis/release-please/compare/v13.16.4...v13.16.5) (2022-05-18)


### Bug Fixes

* all release tag matching if includeComponentInTag is false ([#1442](https://github.com/googleapis/release-please/issues/1442)) ([82a7c71](https://github.com/googleapis/release-please/commit/82a7c7186cf7c30530ce179b42b439400c539b52))

### [13.16.4](https://github.com/googleapis/release-please/compare/v13.16.3...v13.16.4) (2022-05-17)


### Bug Fixes

* add release labels if release PR was completed ([#1433](https://github.com/googleapis/release-please/issues/1433)) ([072498c](https://github.com/googleapis/release-please/commit/072498c8ce2f89bc86eb33445d87491e3ab31fbd))
* CommitSplit with includeEmpty should add commit to all packages ([#1432](https://github.com/googleapis/release-please/issues/1432)) ([19629cb](https://github.com/googleapis/release-please/commit/19629cb42da625d6c62e67f1e9edf7f3cf14d6ee)), closes [#1360](https://github.com/googleapis/release-please/issues/1360)
* Manifest.fromConfig should find branch component ([#1436](https://github.com/googleapis/release-please/issues/1436)) ([628a562](https://github.com/googleapis/release-please/commit/628a562a21245ed02546aa0c40c97a0e3d50a0c7))

### [13.16.3](https://github.com/googleapis/release-please/compare/v13.16.2...v13.16.3) (2022-05-17)


### Bug Fixes

* add release labels if release PR was completed ([#1433](https://github.com/googleapis/release-please/issues/1433)) ([072498c](https://github.com/googleapis/release-please/commit/072498c8ce2f89bc86eb33445d87491e3ab31fbd))
* CommitSplit with includeEmpty should add commit to all packages ([#1432](https://github.com/googleapis/release-please/issues/1432)) ([19629cb](https://github.com/googleapis/release-please/commit/19629cb42da625d6c62e67f1e9edf7f3cf14d6ee)), closes [#1360](https://github.com/googleapis/release-please/issues/1360)
* workspace plugins should update manifest versions ([#1429](https://github.com/googleapis/release-please/issues/1429)) ([ab802a9](https://github.com/googleapis/release-please/commit/ab802a924704044b26017b40a2da48657022faad))

### [13.16.3](https://github.com/googleapis/release-please/compare/v13.16.2...v13.16.3) (2022-05-13)


### Bug Fixes

* workspace plugins should update manifest versions ([#1429](https://github.com/googleapis/release-please/issues/1429)) ([ab802a9](https://github.com/googleapis/release-please/commit/ab802a924704044b26017b40a2da48657022faad))

### [13.16.3](https://github.com/googleapis/release-please/compare/v13.16.2...v13.16.3) (2022-05-13)


### Bug Fixes

* workspace plugins should update manifest versions ([#1429](https://github.com/googleapis/release-please/issues/1429)) ([ab802a9](https://github.com/googleapis/release-please/commit/ab802a924704044b26017b40a2da48657022faad))

### [13.16.2](https://github.com/googleapis/release-please/compare/v13.16.1...v13.16.2) (2022-05-12)


### Bug Fixes

* throw ConfigurationError when required manifest config file is missing ([#1422](https://github.com/googleapis/release-please/issues/1422)) ([83e461e](https://github.com/googleapis/release-please/commit/83e461e8947d16fbd92d57a0d9c64d37ab0dfa42))

### [13.16.1](https://github.com/googleapis/release-please/compare/v13.16.0...v13.16.1) (2022-05-10)


### Bug Fixes

* release tagging can find branch components ([#1425](https://github.com/googleapis/release-please/issues/1425)) ([2947d1e](https://github.com/googleapis/release-please/commit/2947d1e9bc49cc25e7c5eef022ba4106d72e829f))

## [13.16.0](https://github.com/googleapis/release-please/compare/v13.15.1...v13.16.0) (2022-05-06)


### Features

* allow configuring separate-pull-requests per component ([#1412](https://github.com/googleapis/release-please/issues/1412)) ([d274421](https://github.com/googleapis/release-please/commit/d2744219fbbd6c58a10b177a824fb3715039162a))

### [13.15.1](https://github.com/googleapis/release-please/compare/v13.15.0...v13.15.1) (2022-05-05)


### Bug Fixes

* **cargo-workspace:** stop defaulting to updating all components ([#1414](https://github.com/googleapis/release-please/issues/1414)) ([532637c](https://github.com/googleapis/release-please/commit/532637c399d38962e1c0a8622656d61e0fe7e405))
* node-workspace should not bump versions for peer dependencies ([#1413](https://github.com/googleapis/release-please/issues/1413)) ([cc4eaaa](https://github.com/googleapis/release-please/commit/cc4eaaa864b7a6444e4dc72d1c75a596932d7b62)), closes [#1403](https://github.com/googleapis/release-please/issues/1403)

## [13.15.0](https://github.com/googleapis/release-please/compare/v13.14.0...v13.15.0) (2022-04-27)


### Features

* allow configuring changelog-host ([#1408](https://github.com/googleapis/release-please/issues/1408)) ([d7d525f](https://github.com/googleapis/release-please/commit/d7d525f283f931dd999ca69228e71dd6adf9e0c3))

## [13.14.0](https://github.com/googleapis/release-please/compare/v13.13.0...v13.14.0) (2022-04-20)


### Features

* Support sequential-calls manifest field that disables concurrency when creating multiple pull requests or releases ([#1401](https://github.com/googleapis/release-please/issues/1401)) ([50f5c99](https://github.com/googleapis/release-please/commit/50f5c990b99d991b874ba88556386c6b940743f6))

## [13.13.0](https://github.com/googleapis/release-please/compare/v13.12.0...v13.13.0) (2022-04-18)


### Features

* add a flag to disable adding labels to new pull requests ([#1399](https://github.com/googleapis/release-please/issues/1399)) ([3957ef5](https://github.com/googleapis/release-please/commit/3957ef542512eb1ae2c3353b3c2a7fde4540c731))

## [13.12.0](https://github.com/googleapis/release-please/compare/v13.11.1...v13.12.0) (2022-04-15)


### Features

* allow configuring `release-search-depth` and `commit-search-depth` ([#1396](https://github.com/googleapis/release-please/issues/1396)) ([102d650](https://github.com/googleapis/release-please/commit/102d650394140667d17d84726bd962477d69562c)), closes [#1394](https://github.com/googleapis/release-please/issues/1394)


### Bug Fixes

* Allow an empty value for --label ([#1397](https://github.com/googleapis/release-please/issues/1397)) ([f5aff97](https://github.com/googleapis/release-please/commit/f5aff97dbb20086a26b846dde89b289a4540dba1))

### [13.11.1](https://github.com/googleapis/release-please/compare/v13.11.0...v13.11.1) (2022-04-15)


### Bug Fixes

* **deps:** switch from `xmldom` to `@xmldom/xmldom` and update to v0.8.2 ([#1393](https://github.com/googleapis/release-please/issues/1393)) ([b6af677](https://github.com/googleapis/release-please/commit/b6af677da635493230d7e3a632aeedb5cfd1edb7))

## [13.11.0](https://github.com/googleapis/release-please/compare/v13.10.2...v13.11.0) (2022-04-15)


### Features

* **cli:** show file diff for release-pr command with --dry-run and --trace ([fa2cc34](https://github.com/googleapis/release-please/commit/fa2cc343c327864a98ab896ddc92ced89db9ae73))
* introduce extensible factories ([#1342](https://github.com/googleapis/release-please/issues/1342)) ([b54e90e](https://github.com/googleapis/release-please/commit/b54e90e09751945914feb987508561c39f27cbe3))

### [13.10.2](https://github.com/googleapis/release-please/compare/v13.10.1...v13.10.2) (2022-04-14)


### Bug Fixes

* **java:** snapshots should bump versionsMap versions ([#1386](https://github.com/googleapis/release-please/issues/1386)) ([558331c](https://github.com/googleapis/release-please/commit/558331c160a066daeda476438f6524bf958f8d41)), closes [#1381](https://github.com/googleapis/release-please/issues/1381)
* **ruby-yoshi:** Remove bolded scope and fix link removal ([#1382](https://github.com/googleapis/release-please/issues/1382)) ([f6b3202](https://github.com/googleapis/release-please/commit/f6b32024998c4e414b723a4071166f253e95b1d2))

### [13.10.1](https://github.com/googleapis/release-please/compare/v13.10.0...v13.10.1) (2022-04-13)


### Bug Fixes

* bump retries for pull request iterator from 1 to 3 ([#1377](https://github.com/googleapis/release-please/issues/1377)) ([b2b7ff8](https://github.com/googleapis/release-please/commit/b2b7ff8ce98714ac591857b194ba0d51d9c2a641)), closes [#1376](https://github.com/googleapis/release-please/issues/1376)
* don't crash when pull request iterator GraphQL returns no response ([b2b7ff8](https://github.com/googleapis/release-please/commit/b2b7ff8ce98714ac591857b194ba0d51d9c2a641))
* fixed maxResults check in tag and release iterators ([#1378](https://github.com/googleapis/release-please/issues/1378)) ([6492a86](https://github.com/googleapis/release-please/commit/6492a86c56bbbb9b85f96bdf7edba910f1d66fc0))
* GraphQL retry now uses exponential backoff ([b2b7ff8](https://github.com/googleapis/release-please/commit/b2b7ff8ce98714ac591857b194ba0d51d9c2a641))

## [13.10.0](https://github.com/googleapis/release-please/compare/v13.9.0...v13.10.0) (2022-04-12)


### Features

* enable overriding release-as ([ffa0f7c](https://github.com/googleapis/release-please/commit/ffa0f7c7b0d0d2b65ce6285b62802ac08951a43c))
* support selecting a single path when releasing from a manifest ([#1362](https://github.com/googleapis/release-please/issues/1362)) ([ffa0f7c](https://github.com/googleapis/release-please/commit/ffa0f7c7b0d0d2b65ce6285b62802ac08951a43c))


### Bug Fixes

* **rust:** update Cargo.lock for single Rust crate ([#1374](https://github.com/googleapis/release-please/issues/1374)) ([e3571d3](https://github.com/googleapis/release-please/commit/e3571d32c44ae2bef8bac7dd8cdc3556a9d621c7))

## [13.9.0](https://github.com/googleapis/release-please/compare/v13.8.1...v13.9.0) (2022-04-12)


### Features

* added java strategy ([#1333](https://github.com/googleapis/release-please/issues/1333)) ([25f9c85](https://github.com/googleapis/release-please/commit/25f9c85a8472208a83dfd5cc4014c84adc3c771f))

### [13.8.1](https://github.com/googleapis/release-please/compare/v13.8.0...v13.8.1) (2022-04-11)


### Bug Fixes

* Restore v12 changelog formatting for ruby-yoshi ([#1361](https://github.com/googleapis/release-please/issues/1361)) ([ff87c7d](https://github.com/googleapis/release-please/commit/ff87c7df00b652512641454ead34bb2cede2f67e))

## [13.8.0](https://github.com/googleapis/release-please/compare/v13.7.1...v13.8.0) (2022-03-31)


### Features

* add dotnet-yoshi strategy ([#1346](https://github.com/googleapis/release-please/issues/1346)) ([3086e51](https://github.com/googleapis/release-please/commit/3086e5148e596751a2c2b82c28a7b3d3c1b960f2))
* allow configuring tag without "v" ([3086e51](https://github.com/googleapis/release-please/commit/3086e5148e596751a2c2b82c28a7b3d3c1b960f2))


### Bug Fixes

* **php-yoshi:** correctly ignore non-client directories ([#1358](https://github.com/googleapis/release-please/issues/1358)) ([58647dd](https://github.com/googleapis/release-please/commit/58647dd22d994ba670e762a2cef6b99b4b234af8)), closes [#1356](https://github.com/googleapis/release-please/issues/1356)

### [13.7.1](https://github.com/googleapis/release-please/compare/v13.7.0...v13.7.1) (2022-03-30)


### Bug Fixes

* use lerna typings provided by DefinitelyTyped project ([#1351](https://github.com/googleapis/release-please/issues/1351)) ([86dccdf](https://github.com/googleapis/release-please/commit/86dccdf9dd2fbd8c517a88f4422412c18a944e07))

## [13.7.0](https://github.com/googleapis/release-please/compare/v13.6.0...v13.7.0) (2022-03-24)


### Features

* allow snoozing release pull requests ([#1345](https://github.com/googleapis/release-please/issues/1345)) ([ea69708](https://github.com/googleapis/release-please/commit/ea6970813a11cebe2394c19d8d006d352c8fb306)), closes [#1339](https://github.com/googleapis/release-please/issues/1339)

## [13.6.0](https://github.com/googleapis/release-please/compare/v13.5.0...v13.6.0) (2022-03-16)


### Features

* add linked-versions plugin for grouping components ([#1327](https://github.com/googleapis/release-please/issues/1327)) ([f398bdf](https://github.com/googleapis/release-please/commit/f398bdffdae69772c61a82cd7158cca3478c2110))
* introduce generic json updater ([#1332](https://github.com/googleapis/release-please/issues/1332)) ([ecbfcf0](https://github.com/googleapis/release-please/commit/ecbfcf03f7854ced3ace5eafd95f7872ddee1d14))
* introduce generic xml updater ([#1337](https://github.com/googleapis/release-please/issues/1337)) ([02ef78b](https://github.com/googleapis/release-please/commit/02ef78b4d6a855236ff80fc139fd00a46f88d445))

## [13.5.0](https://github.com/googleapis/release-please/compare/v13.4.15...v13.5.0) (2022-03-08)


### Features

* **ocaml:** update opam `project.opam.locked` files ([#1325](https://github.com/googleapis/release-please/issues/1325)) ([858199e](https://github.com/googleapis/release-please/commit/858199e4fac71ce2574c4195b85dc4e8bf26e0f7))


### Bug Fixes

* fix regex for parsing major version update ([#1330](https://github.com/googleapis/release-please/issues/1330)) ([afadec9](https://github.com/googleapis/release-please/commit/afadec95aa62aa32372512455326c4cdf8943f70))

### [13.4.15](https://github.com/googleapis/release-please/compare/v13.4.14...v13.4.15) (2022-03-02)


### Bug Fixes

* tagging many GitHub releases should not require a file touched check ([#1321](https://github.com/googleapis/release-please/issues/1321)) ([ab99242](https://github.com/googleapis/release-please/commit/ab9924215e68838e6ec62d283b5712cbff6e6a4c))

### [13.4.14](https://github.com/googleapis/release-please/compare/v13.4.13...v13.4.14) (2022-03-01)


### Bug Fixes

* node-workspace plugin should update package.json versions ([#1319](https://github.com/googleapis/release-please/issues/1319)) ([e2aaacb](https://github.com/googleapis/release-please/commit/e2aaacbab59c7660abe572c5e6ce31ad666a90c5))

### [13.4.13](https://github.com/googleapis/release-please/compare/v13.4.12...v13.4.13) (2022-02-28)


### Bug Fixes

* handle failures during multiple release creation ([#1315](https://github.com/googleapis/release-please/issues/1315)) ([fc856ae](https://github.com/googleapis/release-please/commit/fc856aed1d95def38170eff6381829cd6d7d1e0b))

### [13.4.12](https://github.com/googleapis/release-please/compare/v13.4.11...v13.4.12) (2022-02-22)


### Bug Fixes

* address false-positive matches for autorelease branch naming ([#1311](https://github.com/googleapis/release-please/issues/1311)) ([c5e76dc](https://github.com/googleapis/release-please/commit/c5e76dc8202958ed5af0f3635188261b8845f561)), closes [#1310](https://github.com/googleapis/release-please/issues/1310)
* catch FileNotFound error when building changeset ([#1306](https://github.com/googleapis/release-please/issues/1306)) ([3944b17](https://github.com/googleapis/release-please/commit/3944b17f33500cecc63a1ff63db81cdbd50ce1a1))
* manifest config should allow overriding labels ([#1303](https://github.com/googleapis/release-please/issues/1303)) ([f4d0314](https://github.com/googleapis/release-please/commit/f4d0314d1a394389a233ba9e1383852f0875dcd1)), closes [#1302](https://github.com/googleapis/release-please/issues/1302)

### [13.4.11](https://github.com/googleapis/release-please/compare/v13.4.10...v13.4.11) (2022-02-18)


### Bug Fixes

* introduce file cache to simplify fetching files including file mode ([#1280](https://github.com/googleapis/release-please/issues/1280)) ([d7280b7](https://github.com/googleapis/release-please/commit/d7280b7eac3056e28399a0b80ea26002f0dff1b4))

### [13.4.10](https://github.com/googleapis/release-please/compare/v13.4.9...v13.4.10) (2022-02-16)


### Bug Fixes

* **go-yoshi:** dynamically load list of ignored submodules for google-cloud-go ([#1291](https://github.com/googleapis/release-please/issues/1291)) ([36f6ad9](https://github.com/googleapis/release-please/commit/36f6ad94fe471e5a46cc46ebd6f5b5c581a29c2c))
* manifest release can handle componentless entry ([#1300](https://github.com/googleapis/release-please/issues/1300)) ([6b58573](https://github.com/googleapis/release-please/commit/6b585734fe7b49f0e351b73b27260a304d6c80dd))
* return uploadUrl and body when creating release ([#1298](https://github.com/googleapis/release-please/issues/1298)) ([5d767c5](https://github.com/googleapis/release-please/commit/5d767c536594a8e24d274a4268cda1f1aa3babff))

### [13.4.9](https://github.com/googleapis/release-please/compare/v13.4.8...v13.4.9) (2022-02-14)


### Bug Fixes

* standalone releases should only be released by its matching component ([#1296](https://github.com/googleapis/release-please/issues/1296)) ([75dd686](https://github.com/googleapis/release-please/commit/75dd686a667da397b54498f543128d4cc6bb784e))

### [13.4.8](https://github.com/googleapis/release-please/compare/v13.4.7...v13.4.8) (2022-02-08)


### Bug Fixes

* allow configuring includeComponentInTag and tagSeparator from manifest config ([71d9b6d](https://github.com/googleapis/release-please/commit/71d9b6d5775bb1a35157c7ec512ef4d1d9f7feec))
* check recent commits and latest releases for latest version ([#1267](https://github.com/googleapis/release-please/issues/1267)) ([f931842](https://github.com/googleapis/release-please/commit/f931842a117c97dd117f161c89beb1c9e2257fa2))
* correctly fetch full list of files ([71d9b6d](https://github.com/googleapis/release-please/commit/71d9b6d5775bb1a35157c7ec512ef4d1d9f7feec))
* **go-yoshi:** allows using go-yoshi with manifest ([#1287](https://github.com/googleapis/release-please/issues/1287)) ([71d9b6d](https://github.com/googleapis/release-please/commit/71d9b6d5775bb1a35157c7ec512ef4d1d9f7feec))
* **go-yoshi:** should not always skip modules ([71d9b6d](https://github.com/googleapis/release-please/commit/71d9b6d5775bb1a35157c7ec512ef4d1d9f7feec))
* Manifest should be able to find tagged versions without a release ([71d9b6d](https://github.com/googleapis/release-please/commit/71d9b6d5775bb1a35157c7ec512ef4d1d9f7feec))
* provide pull request to commit parser allow overrides ([#1285](https://github.com/googleapis/release-please/issues/1285)) ([e54028b](https://github.com/googleapis/release-please/commit/e54028bb39c4535f42b0b90c60b7f331847d005c))

### [13.4.7](https://github.com/googleapis/release-please/compare/v13.4.6...v13.4.7) (2022-02-02)


### Bug Fixes

* php-yoshi strategy should handle custom changelog secctions ([#1277](https://github.com/googleapis/release-please/issues/1277)) ([bd74a5b](https://github.com/googleapis/release-please/commit/bd74a5b7b622a6cec0d64cbf9b9e01102dc835b2))

### [13.4.6](https://github.com/googleapis/release-please/compare/v13.4.5...v13.4.6) (2022-02-01)


### Bug Fixes

* cargo workspace cargo lock handling ([#1260](https://github.com/googleapis/release-please/issues/1260)) ([55e9d38](https://github.com/googleapis/release-please/commit/55e9d3822d4d36d3123231f22dccacf35910929e))
* krm blueprints should update yaml files ([#1269](https://github.com/googleapis/release-please/issues/1269)) ([d6ef98a](https://github.com/googleapis/release-please/commit/d6ef98a7031b599e38a505af2ffc51e85b3c6da6)), closes [#1268](https://github.com/googleapis/release-please/issues/1268)

### [13.4.5](https://github.com/googleapis/release-please/compare/v13.4.4...v13.4.5) (2022-02-01)


### Bug Fixes

* read packageName from config ([#1270](https://github.com/googleapis/release-please/issues/1270)) ([e953e1a](https://github.com/googleapis/release-please/commit/e953e1a387f6124fbacb7952b5451ca43bd498fa))

### [13.4.4](https://github.com/googleapis/release-please/compare/v13.4.3...v13.4.4) (2022-01-26)


### Bug Fixes

* delegate empty commit handling to strategies ([#1254](https://github.com/googleapis/release-please/issues/1254)) ([757f2a9](https://github.com/googleapis/release-please/commit/757f2a9304aec164632ee081b09d22595c5f1e67))
* extra file should include strategy path ([#1187](https://github.com/googleapis/release-please/issues/1187)) ([c8fffb0](https://github.com/googleapis/release-please/commit/c8fffb0bca7be83487e9d2e3257277e8650cdfaf))

### [13.4.3](https://github.com/googleapis/release-please/compare/v13.4.2...v13.4.3) (2022-01-24)


### Bug Fixes

* multi-component manifest release notes for single component release ([#1247](https://github.com/googleapis/release-please/issues/1247)) ([16aee09](https://github.com/googleapis/release-please/commit/16aee099c79d75853e565f83017745eef13b57fa))
* release notes should parse initial version heading ([#1248](https://github.com/googleapis/release-please/issues/1248)) ([71dc495](https://github.com/googleapis/release-please/commit/71dc4954e2393f74c4442c021fcf6c8ee530b4ae))

### [13.4.2](https://github.com/googleapis/release-please/compare/v13.4.1...v13.4.2) (2022-01-21)


### Bug Fixes

* Manifest.fromFile no longer ignores manifestFile arg ([#1243](https://github.com/googleapis/release-please/issues/1243)) ([04a44ab](https://github.com/googleapis/release-please/commit/04a44ab08e8ce3911ad814744cebb79aab2ef8aa))

### [13.4.1](https://github.com/googleapis/release-please/compare/v13.4.0...v13.4.1) (2022-01-20)


### Bug Fixes

* handle windows newlines in pull request body ([#1239](https://github.com/googleapis/release-please/issues/1239)) ([69a424f](https://github.com/googleapis/release-please/commit/69a424ff2671ccfb661efd376aede155caee42ce))
* **python:** fix version regex to find multiple digit patch versions ([#1238](https://github.com/googleapis/release-please/issues/1238)) ([e03a3bf](https://github.com/googleapis/release-please/commit/e03a3bf81f0706b96bc76f217ab420a0f90b4152)), closes [#1237](https://github.com/googleapis/release-please/issues/1237)
* **python:** restore default changelog config for python ([#1240](https://github.com/googleapis/release-please/issues/1240)) ([54007ea](https://github.com/googleapis/release-please/commit/54007ea6d7d6c12f5757eeb2b5abdf13a8b524be))

## [13.4.0](https://github.com/googleapis/release-please/compare/v13.3.2...v13.4.0) (2022-01-18)


### Features

* add grouped manifest pr title pattern option ([#1184](https://github.com/googleapis/release-please/issues/1184)) ([df1332f](https://github.com/googleapis/release-please/commit/df1332f3b95e622752d351a29fc0a1b5083963c6))


### Bug Fixes

* **go-yoshi:** restore scope-based commit filtering ([#1233](https://github.com/googleapis/release-please/issues/1233)) ([597e6dd](https://github.com/googleapis/release-please/commit/597e6dd58217c62d562070032138cee8cad5e693))
* search for files on target branch, not default branch ([#1235](https://github.com/googleapis/release-please/issues/1235)) ([d891f00](https://github.com/googleapis/release-please/commit/d891f000eb2b198bfb4331b41bc5020fff52e1da))

### [13.3.2](https://github.com/googleapis/release-please/compare/v13.3.1...v13.3.2) (2022-01-13)


### Bug Fixes

* BranchName.parse should not throw exceptions ([#1227](https://github.com/googleapis/release-please/issues/1227)) ([364f1ac](https://github.com/googleapis/release-please/commit/364f1ac996b0120820d9bb37db96bb27a79aa936))
* initial release version should respect Release-As commit ([#1222](https://github.com/googleapis/release-please/issues/1222)) ([22b9770](https://github.com/googleapis/release-please/commit/22b977028e2959aea088c09e3a021e2aa0e10f03))
* Release-As commits should appear in the changelog correctly ([#1220](https://github.com/googleapis/release-please/issues/1220)) ([ab56c82](https://github.com/googleapis/release-please/commit/ab56c82e81091cbedeb8f328451ac486d7f986a4))
* use latest Release-As commit when overriding version ([#1224](https://github.com/googleapis/release-please/issues/1224)) ([2d7cb8f](https://github.com/googleapis/release-please/commit/2d7cb8fa329d1c60b881bc0435523b81ea47a32d))

### [13.3.1](https://github.com/googleapis/release-please/compare/v13.3.0...v13.3.1) (2022-01-12)


### Bug Fixes

* pass target_commitish instead of sha ([#1219](https://github.com/googleapis/release-please/issues/1219)) ([3f26ec3](https://github.com/googleapis/release-please/commit/3f26ec3de527497d7180f2cd987983c6ae6e44cd))

## [13.3.0](https://github.com/googleapis/release-please/compare/v13.2.1...v13.3.0) (2022-01-12)


### Features

* allow configuring simple strategy version file ([#1168](https://github.com/googleapis/release-please/issues/1168)) ([08a0cf2](https://github.com/googleapis/release-please/commit/08a0cf2b2135713f856d8621cffa8f5b92fb8699))


### Bug Fixes

* ruby-yoshi strategy should put commit summary only in pull request body ([#1193](https://github.com/googleapis/release-please/issues/1193)) ([d29eda1](https://github.com/googleapis/release-please/commit/d29eda172597979cea5cb54ce6eb278a1dfb03a0)), closes [#1192](https://github.com/googleapis/release-please/issues/1192)

### [13.2.1](https://github.com/googleapis/release-please/compare/v13.2.0...v13.2.1) (2022-01-12)


### Bug Fixes

* **php-yoshi:** fix parsing of pull request body ([#1213](https://github.com/googleapis/release-please/issues/1213)) ([00702ca](https://github.com/googleapis/release-please/commit/00702ca575e5d134505280b436e1348eccb2de01))

## [13.2.0](https://github.com/googleapis/release-please/compare/v13.1.1...v13.2.0) (2022-01-11)


### Features

* allow prerelease releases on Github ([#1181](https://github.com/googleapis/release-please/issues/1181)) ([267dbfc](https://github.com/googleapis/release-please/commit/267dbfc58a50cde7ffa378b357df62066a1218c9))


### Bug Fixes

* java snapshots should update all files with :current annotations ([#1204](https://github.com/googleapis/release-please/issues/1204)) ([6f3ae8b](https://github.com/googleapis/release-please/commit/6f3ae8b58afb6673dab2f49daa3d17fbbbef352c))

### [13.1.1](https://www.github.com/googleapis/release-please/compare/v13.1.0...v13.1.1) (2022-01-03)


### Bug Fixes

* **rust:** Rust strategy should update root Cargo files in a workspace ([#1182](https://www.github.com/googleapis/release-please/issues/1182)) ([26a040c](https://www.github.com/googleapis/release-please/commit/26a040cf06a7a2cf97b9ebc3d204bb36f0b2c13b)), closes [#1170](https://www.github.com/googleapis/release-please/issues/1170) [#1096](https://www.github.com/googleapis/release-please/issues/1096)

## [13.1.0](https://www.github.com/googleapis/release-please/compare/v13.0.2...v13.1.0) (2021-12-29)


### Features

* introduce generic updater ([#1157](https://www.github.com/googleapis/release-please/issues/1157)) ([c97598c](https://www.github.com/googleapis/release-please/commit/c97598c137b5018c76f5d62137e277b991f4bfa3)), closes [#435](https://www.github.com/googleapis/release-please/issues/435) [#305](https://www.github.com/googleapis/release-please/issues/305) [#1139](https://www.github.com/googleapis/release-please/issues/1139) [#1174](https://www.github.com/googleapis/release-please/issues/1174)

### [13.0.2](https://www.github.com/googleapis/release-please/compare/v13.0.1...v13.0.2) (2021-12-29)


### Bug Fixes

* set the title when creating a release ([#1177](https://www.github.com/googleapis/release-please/issues/1177)) ([d05001f](https://www.github.com/googleapis/release-please/commit/d05001faedcdf11869cd9db06e3a8a8071af4470))

### [13.0.1](https://www.github.com/googleapis/release-please/compare/v13.0.0...v13.0.1) (2021-12-23)


### Bug Fixes

* export public interface types from index.ts ([#1169](https://www.github.com/googleapis/release-please/issues/1169)) ([cef6407](https://www.github.com/googleapis/release-please/commit/cef6407b05b8bbbc17d0c0b9d4704dc1de80ccf0))

## [13.0.0](https://www.github.com/googleapis/release-please/compare/v12.6.0...v13.0.0) (2021-12-22)


### ⚠ BREAKING CHANGES

* releasers are now "strategies", more logic moved into base classes
* Node 12 is now required
* manifest is now main entrypoint for release please, and logic is shared between mono-repo/split-repo flow
* versioning straregy now handled by VersionStrategies rather than regexes
* merge Manifest and standard PR paths (#1104)

### Features

* add `includeComponentInTag` option for strategies and hook up to `--monorepo-tags` ([#1119](https://www.github.com/googleapis/release-please/issues/1119)) ([bf9aacd](https://www.github.com/googleapis/release-please/commit/bf9aacdde3a97c453f6e3280035607c97c7dffcd))
* add ability to override merged commit message ([#1161](https://www.github.com/googleapis/release-please/issues/1161)) ([c568b57](https://www.github.com/googleapis/release-please/commit/c568b57280f2048f6dabbb716cdb4174c3386b91)), closes [#967](https://www.github.com/googleapis/release-please/issues/967)
* add GitHub changelog notes generator ([#1120](https://www.github.com/googleapis/release-please/issues/1120)) ([1470661](https://www.github.com/googleapis/release-please/commit/1470661bd76a1e731585ed3fbf7363224c7a7a3e))
* enable specifying changelog section headings in the CLI ([#1162](https://www.github.com/googleapis/release-please/issues/1162)) ([aaa8342](https://www.github.com/googleapis/release-please/commit/aaa8342cd48062c56fe87b3296904274b7fb9dbe)), closes [#511](https://www.github.com/googleapis/release-please/issues/511)
* **go:** add support for bumping a Go version file ([#1112](https://www.github.com/googleapis/release-please/issues/1112)) ([8f6e52b](https://www.github.com/googleapis/release-please/commit/8f6e52b27811e6838800c7152be74e13201eb9e1))
* reimplement custom pull request title ([#1122](https://www.github.com/googleapis/release-please/issues/1122)) ([2f3e84c](https://www.github.com/googleapis/release-please/commit/2f3e84c8c51f367cad8baae44c8d9f0727aa02a5))
* reimplement Java 1.0.0 special version bumping ([#1126](https://www.github.com/googleapis/release-please/issues/1126)) ([28bc76b](https://www.github.com/googleapis/release-please/commit/28bc76b35d9e1eff218a5be1b9b8cebb4b1e6f9d))
* return path along with created release ([#1114](https://www.github.com/googleapis/release-please/issues/1114)) ([81fc0f4](https://www.github.com/googleapis/release-please/commit/81fc0f49d75ec66ef1915be26330734abddd11d7))


### Bug Fixes

* add back version/major/minor/patch ([#1118](https://www.github.com/googleapis/release-please/issues/1118)) ([4b6ae50](https://www.github.com/googleapis/release-please/commit/4b6ae5049e39e6f5bca10b514256090ea76ef5bd))
* allow setting release-type at root of manifest config ([#1159](https://www.github.com/googleapis/release-please/issues/1159)) ([fc73b6d](https://www.github.com/googleapis/release-please/commit/fc73b6dd3f5f7ed449b9d304e53bada911e3190f))
* backfill commit files ([#1110](https://www.github.com/googleapis/release-please/issues/1110)) ([173ce70](https://www.github.com/googleapis/release-please/commit/173ce704c9413d7f0da820fdd2961166a5ff0b73))
* backfill latest release with version found in manifest ([#1131](https://www.github.com/googleapis/release-please/issues/1131)) ([94859a0](https://www.github.com/googleapis/release-please/commit/94859a0cfbc58724016daaefaca03f34a43e0473))
* **cli:** pass pull-request-title-pattern ([#1128](https://www.github.com/googleapis/release-please/issues/1128)) ([28d7727](https://www.github.com/googleapis/release-please/commit/28d7727bc827612b02a8fde58d13cd87f962a399))
* combined manifest PR should include labels ([#1137](https://www.github.com/googleapis/release-please/issues/1137)) ([d8bb7ca](https://www.github.com/googleapis/release-please/commit/d8bb7caddfa14aabd3bfa19008c10ed911638a66))
* fallback to look at releases when looking for latest release ([#1146](https://www.github.com/googleapis/release-please/issues/1146)) ([76ed1a7](https://www.github.com/googleapis/release-please/commit/76ed1a77e64f28b0af7d8125dce457b885f80e52))
* fallback to look at tags when looking for latest release ([#1160](https://www.github.com/googleapis/release-please/issues/1160)) ([e06c6ba](https://www.github.com/googleapis/release-please/commit/e06c6ba5c3ce29689275e495934d4a6785962d5b))
* GitHub#findFilesByExtension should treat prefix as a directory ([#1165](https://www.github.com/googleapis/release-please/issues/1165)) ([b48ec5b](https://www.github.com/googleapis/release-please/commit/b48ec5bc285233436d7cb1b367326a3c6dd555a9))
* **github:** correctly return maxResults releases ([#1134](https://www.github.com/googleapis/release-please/issues/1134)) ([25f6811](https://www.github.com/googleapis/release-please/commit/25f68113d0e0bfa5a181d616c11bfd5e573cfaf5))
* make PullRequest, ReleasePullRequest, Version fields readonly ([#1150](https://www.github.com/googleapis/release-please/issues/1150)) ([9659c1c](https://www.github.com/googleapis/release-please/commit/9659c1c868395394a40ff8f6caf9aaa7998fb8b8))
* Manifest.fromConfig can find latest release version without component ([#1123](https://www.github.com/googleapis/release-please/issues/1123)) ([0aeb67b](https://www.github.com/googleapis/release-please/commit/0aeb67b4c4a497b5570bdec10f5ab15e620b235d))
* merge manifest release PRs unless separatePullRequests is configured ([#1129](https://www.github.com/googleapis/release-please/issues/1129)) ([328009d](https://www.github.com/googleapis/release-please/commit/328009d10b4609441a6f8432fa0d2aa9df1f5ff0))
* only backfill files if requested ([#1151](https://www.github.com/googleapis/release-please/issues/1151)) ([ae007fe](https://www.github.com/googleapis/release-please/commit/ae007feb430e97f2995d6fd431f2825512651e3a))
* reimplement draft releases ([#1111](https://www.github.com/googleapis/release-please/issues/1111)) ([6f38b4a](https://www.github.com/googleapis/release-please/commit/6f38b4aa5a206b358468e623a020ef715257ddfe))
* **rust:** Don't update dev-dependencies lacking a version key ([#1095](https://www.github.com/googleapis/release-please/issues/1095)) ([#1152](https://www.github.com/googleapis/release-please/issues/1152)) ([56f37d9](https://www.github.com/googleapis/release-please/commit/56f37d997c75ec5bcc330b08b0e9e25c68329b7a)), closes [#1094](https://www.github.com/googleapis/release-please/issues/1094)
* switch branch delimiter to `--` ([#1127](https://www.github.com/googleapis/release-please/issues/1127)) ([26442f1](https://www.github.com/googleapis/release-please/commit/26442f14356c387c9117f5d660b532185c8084c4))


### Code Refactoring

* manifest is now main entrypoint for release please, and logic is shared between mono-repo/split-repo flow ([fd8f9fc](https://www.github.com/googleapis/release-please/commit/fd8f9fc82838f3a3a05470dfe4dab4d3b47c6fa1))
* merge Manifest and standard PR paths ([#1104](https://www.github.com/googleapis/release-please/issues/1104)) ([fd8f9fc](https://www.github.com/googleapis/release-please/commit/fd8f9fc82838f3a3a05470dfe4dab4d3b47c6fa1))
* Node 12 is now required ([fd8f9fc](https://www.github.com/googleapis/release-please/commit/fd8f9fc82838f3a3a05470dfe4dab4d3b47c6fa1))
* releasers are now "strategies", more logic moved into base classes ([fd8f9fc](https://www.github.com/googleapis/release-please/commit/fd8f9fc82838f3a3a05470dfe4dab4d3b47c6fa1))
* versioning straregy now handled by VersionStrategies rather than regexes ([fd8f9fc](https://www.github.com/googleapis/release-please/commit/fd8f9fc82838f3a3a05470dfe4dab4d3b47c6fa1))

## [12.6.0](https://www.github.com/googleapis/release-please/compare/v12.5.0...v12.6.0) (2021-10-11)


### Features

* add GraphQL URL option for Github ([#1083](https://www.github.com/googleapis/release-please/issues/1083)) ([ec661e2](https://www.github.com/googleapis/release-please/commit/ec661e22c7f5fa80e26d32d4cf0d93a4a90af4be)), closes [#1082](https://www.github.com/googleapis/release-please/issues/1082)

## [12.5.0](https://www.github.com/googleapis/release-please/compare/v12.4.0...v12.5.0) (2021-09-29)


### Features

* add java-backport releaser ([#1074](https://www.github.com/googleapis/release-please/issues/1074)) ([e98b165](https://www.github.com/googleapis/release-please/commit/e98b16549be4ee688660eb2337be6b0ed2f0a4cd))

## [12.4.0](https://www.github.com/googleapis/release-please/compare/v12.3.0...v12.4.0) (2021-09-29)


### Features

* add dart updater and releaser ([#1053](https://www.github.com/googleapis/release-please/issues/1053)) ([f0d0fb8](https://www.github.com/googleapis/release-please/commit/f0d0fb84d47b6df77bb6b5563482bfac4aec2c94))

## [12.3.0](https://www.github.com/googleapis/release-please/compare/v12.2.0...v12.3.0) (2021-09-24)


### Features

* allow forcing latest tag ([#1070](https://www.github.com/googleapis/release-please/issues/1070)) ([0549a30](https://www.github.com/googleapis/release-please/commit/0549a3035c8348c62958d2f1f037226bf2a0ce21))
* **manifest:** add option to skip creating github release ([#1048](https://www.github.com/googleapis/release-please/issues/1048)) ([59f3094](https://www.github.com/googleapis/release-please/commit/59f309429586200f835fdffe07ed9860a1901e31))
* **python:** support src/packagename/__init__.py ([#1062](https://www.github.com/googleapis/release-please/issues/1062)) ([598667d](https://www.github.com/googleapis/release-please/commit/598667da5a623c3fb057874840b3c308d225c627))

## [12.2.0](https://www.github.com/googleapis/release-please/compare/v12.1.0...v12.2.0) (2021-09-23)


### Features

* add signoff options to sign off commits ([#1033](https://www.github.com/googleapis/release-please/issues/1033)) ([7d5f1b8](https://www.github.com/googleapis/release-please/commit/7d5f1b835fa3e822eb26dfefb1c8c2ed877bfe1f))

## [12.1.0](https://www.github.com/googleapis/release-please/compare/v12.0.1...v12.1.0) (2021-09-22)


### Features

* github-release can customize the label applied to the pull request ([#1060](https://www.github.com/googleapis/release-please/issues/1060)) ([6c7bb95](https://www.github.com/googleapis/release-please/commit/6c7bb95660a8078bb1d6a5fc51105d72e4d82fb4))

### [12.0.1](https://www.github.com/googleapis/release-please/compare/v12.0.0...v12.0.1) (2021-09-22)


### Bug Fixes

* add missing comma at EOL for mix exs version ([#1061](https://www.github.com/googleapis/release-please/issues/1061)) ([61b616a](https://www.github.com/googleapis/release-please/commit/61b616a9a937cebbe3b2fa59540deced6d938fb9))

## [12.0.0](https://www.github.com/googleapis/release-please/compare/v11.24.2...v12.0.0) (2021-09-15)


### ⚠ BREAKING CHANGES

* **manifest:** force local linking in node-workspaces w/ config to disable (#1036)

### Features

* **manifest:** force local linking in node-workspaces w/ config to disable ([#1036](https://www.github.com/googleapis/release-please/issues/1036)) ([a47d7f7](https://www.github.com/googleapis/release-please/commit/a47d7f7cbbb065d994fa972101f2f36d6f86a235))

### [11.24.2](https://www.github.com/googleapis/release-please/compare/v11.24.1...v11.24.2) (2021-09-14)


### Bug Fixes

* limit PR description to 65536 characters ([#1054](https://www.github.com/googleapis/release-please/issues/1054)) ([25df811](https://www.github.com/googleapis/release-please/commit/25df811b8e7c756c22cae76328497c831cdbac82))

### [11.24.1](https://www.github.com/googleapis/release-please/compare/v11.24.0...v11.24.1) (2021-09-13)


### Bug Fixes

* typo in `--bump-patch-for-minor-pre-major` option ([#1050](https://www.github.com/googleapis/release-please/issues/1050)) ([cf569a5](https://www.github.com/googleapis/release-please/commit/cf569a58c24e1c547e30efa58a08da5e9431e565))

## [11.24.0](https://www.github.com/googleapis/release-please/compare/v11.23.1...v11.24.0) (2021-09-09)


### Features

* **python:** support packagename/__init__.py without pyproject.toml ([#1026](https://www.github.com/googleapis/release-please/issues/1026)) ([f461ff7](https://www.github.com/googleapis/release-please/commit/f461ff7284f8fdc2c1c6f4959341fe40cfb50501))

### [11.23.1](https://www.github.com/googleapis/release-please/compare/v11.23.0...v11.23.1) (2021-09-08)


### Bug Fixes

* **ruby:** The Ruby releaser defaults to the correct version.rb path ([#1041](https://www.github.com/googleapis/release-please/issues/1041)) ([fd904c0](https://www.github.com/googleapis/release-please/commit/fd904c0a8a23dd12db55106f9e60a0cf5e3f796c))

## [11.23.0](https://www.github.com/googleapis/release-please/compare/v11.22.0...v11.23.0) (2021-09-07)


### Features

* add elixir updater and releaser ([#1030](https://www.github.com/googleapis/release-please/issues/1030)) ([67db408](https://www.github.com/googleapis/release-please/commit/67db40896a09ac93f5e6fc4b5a436b6c12ca20c8))

## [11.22.0](https://www.github.com/googleapis/release-please/compare/v11.21.0...v11.22.0) (2021-08-13)


### Features

* added support for php package ([#1008](https://www.github.com/googleapis/release-please/issues/1008)) ([2c2360a](https://www.github.com/googleapis/release-please/commit/2c2360af1a51ea6e44f74cea353352d266e7b58a))
* handle single quotes in version-rb ([#1019](https://www.github.com/googleapis/release-please/issues/1019)) ([c699cc6](https://www.github.com/googleapis/release-please/commit/c699cc60da3bb3de090accc22c2ef9ecc59f12bb))

## [11.21.0](https://www.github.com/googleapis/release-please/compare/v11.20.3...v11.21.0) (2021-08-12)


### Features

* use original json's indentation and style ([#923](https://www.github.com/googleapis/release-please/issues/923)) ([820702c](https://www.github.com/googleapis/release-please/commit/820702c63615f3904c2987bacb37f3502f6397cc))

### [11.20.3](https://www.github.com/googleapis/release-please/compare/v11.20.2...v11.20.3) (2021-08-11)


### Bug Fixes

* krm releaser manifest mode ([#1011](https://www.github.com/googleapis/release-please/issues/1011)) ([be00905](https://www.github.com/googleapis/release-please/commit/be0090591b8711c3fde673e747df41a7d7b096ab))

### [11.20.2](https://www.github.com/googleapis/release-please/compare/v11.20.1...v11.20.2) (2021-08-05)


### Bug Fixes

* PathNotFoundError throwing for optional files ([#1004](https://www.github.com/googleapis/release-please/issues/1004)) ([947ed84](https://www.github.com/googleapis/release-please/commit/947ed844f39d2b8c760ce3ab83491a914895b190))

### [11.20.1](https://www.github.com/googleapis/release-please/compare/v11.20.0...v11.20.1) (2021-08-04)


### Bug Fixes

* **github-release:** private repo not found error ([#982](https://www.github.com/googleapis/release-please/issues/982)) ([90da806](https://www.github.com/googleapis/release-please/commit/90da806516c8cf2deedb7aaac956026282b8de68))

## [11.20.0](https://www.github.com/googleapis/release-please/compare/v11.19.0...v11.20.0) (2021-08-04)


### Features

* **prerelease:** support "normal" form for python pre-releases ([#1000](https://www.github.com/googleapis/release-please/issues/1000)) ([3be1ba8](https://www.github.com/googleapis/release-please/commit/3be1ba89e098682ec9008d03dc55437c7dacbf91))

## [11.19.0](https://www.github.com/googleapis/release-please/compare/v11.18.0...v11.19.0) (2021-07-30)


### Features

* **manifest:** support hard-coded last-release-sha ([#989](https://www.github.com/googleapis/release-please/issues/989)) ([f72acd5](https://www.github.com/googleapis/release-please/commit/f72acd5094ef15d52add466c16e29e58013f4f1a))


### Bug Fixes

* **java:** find pre-release versions when looking for latestTag ([#993](https://www.github.com/googleapis/release-please/issues/993)) ([2393f67](https://www.github.com/googleapis/release-please/commit/2393f6783965e53df388d84db8c78afb75ef8f29))

## [11.18.0](https://www.github.com/googleapis/release-please/compare/v11.17.0...v11.18.0) (2021-07-28)


### Features

* **go:** default to CHANGELOG.md ([#986](https://www.github.com/googleapis/release-please/issues/986)) ([5ab2069](https://www.github.com/googleapis/release-please/commit/5ab2069c22f3b5d5aba9dbd34f061a4de871e07c)), closes [#924](https://www.github.com/googleapis/release-please/issues/924)

## [11.17.0](https://www.github.com/googleapis/release-please/compare/v11.16.2...v11.17.0) (2021-07-20)


### Features

* add krm-blueprint releaser ([#976](https://www.github.com/googleapis/release-please/issues/976)) ([deb0d7e](https://www.github.com/googleapis/release-please/commit/deb0d7e6322529d5a14db6ac3e1a17b42e137283))

### [11.16.2](https://www.github.com/googleapis/release-please/compare/v11.16.1...v11.16.2) (2021-07-19)


### Bug Fixes

* switch searching for pending release PR to use pull request API ([#977](https://www.github.com/googleapis/release-please/issues/977)) ([31786db](https://www.github.com/googleapis/release-please/commit/31786db3e0086b3770ebcaf7247c4b65e42c0cb4)), closes [#826](https://www.github.com/googleapis/release-please/issues/826)

### [11.16.1](https://www.github.com/googleapis/release-please/compare/v11.16.0...v11.16.1) (2021-07-15)


### Bug Fixes

* **go-yoshi:** Release-As should only apply to the correct file scope ([#969](https://www.github.com/googleapis/release-please/issues/969)) ([fa317b2](https://www.github.com/googleapis/release-please/commit/fa317b2ef88bd153001b85984b8f457a4d9eec1e)), closes [#878](https://www.github.com/googleapis/release-please/issues/878)

## [11.16.0](https://www.github.com/googleapis/release-please/compare/v11.15.0...v11.16.0) (2021-07-14)


### Features

* add new ConfigurationError types so consumers can handle errors ([#964](https://www.github.com/googleapis/release-please/issues/964)) ([5f7ca9d](https://www.github.com/googleapis/release-please/commit/5f7ca9daa9608a3bf4f7945491a04d560e590e95)), closes [#960](https://www.github.com/googleapis/release-please/issues/960)


### Bug Fixes

* JavaYoshi releasers now throw `MissingRequiredFileError` if missing required `versions.txt` file. ([5f7ca9d](https://www.github.com/googleapis/release-please/commit/5f7ca9daa9608a3bf4f7945491a04d560e590e95))

## [11.15.0](https://www.github.com/googleapis/release-please/compare/v11.14.2...v11.15.0) (2021-07-13)


### Features

* **rust:** Support manifest releaser ([#954](https://www.github.com/googleapis/release-please/issues/954)) ([fed5c35](https://www.github.com/googleapis/release-please/commit/fed5c35d2cfd709b455afffcec88aa188e3753e4))


### Bug Fixes

* throw custom error class for missing release notes error ([#963](https://www.github.com/googleapis/release-please/issues/963)) ([100dc14](https://www.github.com/googleapis/release-please/commit/100dc14898167ea35b8be8a0069a3fb91fac8237)), closes [#947](https://www.github.com/googleapis/release-please/issues/947)

### [11.14.2](https://www.github.com/googleapis/release-please/compare/v11.14.1...v11.14.2) (2021-07-12)


### Bug Fixes

* debug logging for node-workspaces plugin ([#958](https://www.github.com/googleapis/release-please/issues/958)) ([d8854a8](https://www.github.com/googleapis/release-please/commit/d8854a8141a15d1d1025362dc3595c7702d2eb43))

### [11.14.1](https://www.github.com/googleapis/release-please/compare/v11.14.0...v11.14.1) (2021-07-07)


### Bug Fixes

* finding commits to non-existent branch should return empty array ([#956](https://www.github.com/googleapis/release-please/issues/956)) ([6dc3b48](https://www.github.com/googleapis/release-please/commit/6dc3b48549c5beb9f1cc4d5a359fee5dfca591eb)), closes [#944](https://www.github.com/googleapis/release-please/issues/944)

## [11.14.0](https://www.github.com/googleapis/release-please/compare/v11.13.2...v11.14.0) (2021-07-07)


### Features

* wrap GitHub errors ([#949](https://www.github.com/googleapis/release-please/issues/949)) ([b25274d](https://www.github.com/googleapis/release-please/commit/b25274dd2770a7953c5bca718d17c3f35468f9f3)), closes [#932](https://www.github.com/googleapis/release-please/issues/932) [#945](https://www.github.com/googleapis/release-please/issues/945)

### [11.13.2](https://www.github.com/googleapis/release-please/compare/v11.13.1...v11.13.2) (2021-07-01)


### Bug Fixes

* convert unnecessary error logs to warnings ([#942](https://www.github.com/googleapis/release-please/issues/942)) ([5741164](https://www.github.com/googleapis/release-please/commit/574116406f16fe625ab8cee08e26f43c6d942424))

### [11.13.1](https://www.github.com/googleapis/release-please/compare/v11.13.0...v11.13.1) (2021-06-18)


### Bug Fixes

* **ruby-yoshi:** Fix the initial release of new Ruby-Yoshi libraries ([#933](https://www.github.com/googleapis/release-please/issues/933)) ([86f96c9](https://www.github.com/googleapis/release-please/commit/86f96c92befcf5ca062c27052a69b76b3ea488dc))

## [11.13.0](https://www.github.com/googleapis/release-please/compare/v11.12.1...v11.13.0) (2021-05-26)


### Features

* add `gcf-owl-bot[bot]` to `ignoreAuthors` ([#910](https://www.github.com/googleapis/release-please/issues/910)) ([e5cd486](https://www.github.com/googleapis/release-please/commit/e5cd48618532fb5b627da53537c15a122832622b))


### Bug Fixes

* update simple releaser for monorepo pkg path ([#917](https://www.github.com/googleapis/release-please/issues/917)) ([9170e53](https://www.github.com/googleapis/release-please/commit/9170e530781d8705d27cea51053c2825f111f12b))

### [11.12.1](https://www.github.com/googleapis/release-please/compare/v11.12.0...v11.12.1) (2021-05-11)


### Bug Fixes

* correctly find Java LTS latestTag version strings ([#905](https://www.github.com/googleapis/release-please/issues/905)) ([3aa23f8](https://www.github.com/googleapis/release-please/commit/3aa23f8d4bf081da7e9631142ed9c780b8be0a42))

## [11.12.0](https://www.github.com/googleapis/release-please/compare/v11.11.0...v11.12.0) (2021-05-11)


### Features

* allow overriding release label ([#900](https://www.github.com/googleapis/release-please/issues/900)) ([1af2623](https://www.github.com/googleapis/release-please/commit/1af26231857509244935034d68e3d031f2dbbebd))


### Bug Fixes

* **manifest:** node-workspace plugin respects release-as ([#901](https://www.github.com/googleapis/release-please/issues/901)) ([2d4ee9e](https://www.github.com/googleapis/release-please/commit/2d4ee9eaed8efb96a0a42ce989d37325d1722eed))

## [11.11.0](https://www.github.com/googleapis/release-please/compare/v11.10.0...v11.11.0) (2021-05-04)


### Features

* add custom logger interface ([#884](https://www.github.com/googleapis/release-please/issues/884)) ([74ac982](https://www.github.com/googleapis/release-please/commit/74ac982e5603ae007d608aa9860f56c212b0111a))
* **python:** support pyproject.toml ([#894](https://www.github.com/googleapis/release-please/issues/894)) ([38eb4cb](https://www.github.com/googleapis/release-please/commit/38eb4cbb029824976162ae3f1abcbda0f0546b95))

## [11.10.0](https://www.github.com/googleapis/release-please/compare/v11.9.0...v11.10.0) (2021-05-03)


### Features

* add generic go releaser ([#890](https://www.github.com/googleapis/release-please/issues/890)) ([79cce57](https://www.github.com/googleapis/release-please/commit/79cce579ad256a162e221d76e70e45a351d795c7))


### Bug Fixes

* **release-as:** commits with Release-As footer now create release ([#891](https://www.github.com/googleapis/release-please/issues/891)) ([f722b0c](https://www.github.com/googleapis/release-please/commit/f722b0c679c6b7c5ba80f20ba88be1bb7484126e))

## [11.9.0](https://www.github.com/googleapis/release-please/compare/v11.8.1...v11.9.0) (2021-04-28)


### Features

* **node:** update npm-shrinkwrap file ([#887](https://www.github.com/googleapis/release-please/issues/887)) ([1696c10](https://www.github.com/googleapis/release-please/commit/1696c104027e2fe69bb65d00eba0db109bb5de1d))

### [11.8.1](https://www.github.com/googleapis/release-please/compare/v11.8.0...v11.8.1) (2021-04-23)


### Bug Fixes

* Java replacer should handle `-sp.1` version replacements ([#874](https://www.github.com/googleapis/release-please/issues/874)) ([81131e5](https://www.github.com/googleapis/release-please/commit/81131e5f5b5263b487216d7643b34c27ccd51e1f)), closes [#873](https://www.github.com/googleapis/release-please/issues/873)
* **manifest:** dynamic importing does not work with build for action ([#871](https://www.github.com/googleapis/release-please/issues/871)) ([e702c35](https://www.github.com/googleapis/release-please/commit/e702c35cc4f7cfede39a42e921de3a6b01332cb1))
* **octokit:** address regression in internal octokit types ([#880](https://www.github.com/googleapis/release-please/issues/880)) ([d32f114](https://www.github.com/googleapis/release-please/commit/d32f1148d2380a3040fd043ace2d8a08627cd2e7))

## [11.8.0](https://www.github.com/googleapis/release-please/compare/v11.7.0...v11.8.0) (2021-04-19)


### Features

* **manifest:** node workspace package dependency updates ([#844](https://www.github.com/googleapis/release-please/issues/844)) ([9ebd422](https://www.github.com/googleapis/release-please/commit/9ebd422b6abd0d49e6d3d740d33bf1bbd58ec6a4))
* **ocaml:** Add dune-project updater ([81422dc](https://www.github.com/googleapis/release-please/commit/81422dc7279d4999703a9c34ce1a559361be6953))


### Bug Fixes

* adjust patch rule for Java LTS strategy ([#857](https://www.github.com/googleapis/release-please/issues/857)) ([7f78dc5](https://www.github.com/googleapis/release-please/commit/7f78dc566a708ce3f98ba315685c79a37c4706f8))
* **ocaml:** Avoid hardcoding changelogSections to allow configuration ([81422dc](https://www.github.com/googleapis/release-please/commit/81422dc7279d4999703a9c34ce1a559361be6953))
* **ocaml:** Improve OCaml releaser for monorepos ([#867](https://www.github.com/googleapis/release-please/issues/867)) ([81422dc](https://www.github.com/googleapis/release-please/commit/81422dc7279d4999703a9c34ce1a559361be6953))
* **ocaml:** Pass the path prefix when searching for files ([81422dc](https://www.github.com/googleapis/release-please/commit/81422dc7279d4999703a9c34ce1a559361be6953))

## [11.7.0](https://www.github.com/googleapis/release-please/compare/v11.6.0...v11.7.0) (2021-04-09)


### Features

* add ability to specify extra files for releasers to consider ([#850](https://www.github.com/googleapis/release-please/issues/850)) ([f7079fd](https://www.github.com/googleapis/release-please/commit/f7079fd7bb07104e9ed249d870f7ae59b1cdf15a))

## [11.6.0](https://www.github.com/googleapis/release-please/compare/v11.5.0...v11.6.0) (2021-04-07)


### Features

* allow "standard" pre 1.0.0 patch bumps ([#847](https://www.github.com/googleapis/release-please/issues/847)) ([a5e2cc2](https://www.github.com/googleapis/release-please/commit/a5e2cc2020c71b2bc0f61add2abf2d7fdbe8920e))


### Bug Fixes

* **manifest:** package paths sharing same prefix being shadowed in commit-split ([#848](https://www.github.com/googleapis/release-please/issues/848)) ([29ba3b5](https://www.github.com/googleapis/release-please/commit/29ba3b598a4862b3d15a490712cf383a8838b502))

## [11.5.0](https://www.github.com/googleapis/release-please/compare/v11.4.1...v11.5.0) (2021-03-30)


### Features

* **manifest:** include default branch name in PR title ([#843](https://www.github.com/googleapis/release-please/issues/843)) ([16f00dc](https://www.github.com/googleapis/release-please/commit/16f00dc4562d370b217da81476fba4d42407c567))


### Bug Fixes

* **manifest:** split commits on exact package path prefix ([#842](https://www.github.com/googleapis/release-please/issues/842)) ([2728bfe](https://www.github.com/googleapis/release-please/commit/2728bfe73717490326b5f1121d7da8cdd88e18a3))

### [11.4.1](https://www.github.com/googleapis/release-please/compare/v11.4.0...v11.4.1) (2021-03-25)


### Bug Fixes

* **java:** lts -> sp versioning numbers ([#837](https://www.github.com/googleapis/release-please/issues/837)) ([183b235](https://www.github.com/googleapis/release-please/commit/183b235798bfeedc0ee421d7cbd172efc91f1e12))
* **manifest:** do not group changes under "." ([#841](https://www.github.com/googleapis/release-please/issues/841)) ([47b8b43](https://www.github.com/googleapis/release-please/commit/47b8b432d4c5e4130d47b1f9b97b61c19bdeff0e))

## [11.4.0](https://www.github.com/googleapis/release-please/compare/v11.3.0...v11.4.0) (2021-03-24)


### Features

* **manifest:** add support for releasing root module ([#833](https://www.github.com/googleapis/release-please/issues/833)) ([7ec1037](https://www.github.com/googleapis/release-please/commit/7ec103725ab96eb869c9bb8b83538efdf2e482b6))


### Bug Fixes

* **deps:** update dependency type-fest to v1 ([#834](https://www.github.com/googleapis/release-please/issues/834)) ([f06894c](https://www.github.com/googleapis/release-please/commit/f06894ce84317230e3b86fe2005d306f12c43c2d))

## [11.3.0](https://www.github.com/googleapis/release-please/compare/v11.2.1...v11.3.0) (2021-03-22)


### Features

* **manifest:** factory/cli integration ([#824](https://www.github.com/googleapis/release-please/issues/824)) ([f3aad4d](https://www.github.com/googleapis/release-please/commit/f3aad4d5aeff263f7427f3884125fae317fd1d3e))

### [11.2.1](https://www.github.com/googleapis/release-please/compare/v11.2.0...v11.2.1) (2021-03-12)


### Bug Fixes

* **changelog:** monorepoTags links in changelog ([#822](https://www.github.com/googleapis/release-please/issues/822)) ([405ac9d](https://www.github.com/googleapis/release-please/commit/405ac9df779031ce60294d5f88ec11d698aae492))

## [11.2.0](https://www.github.com/googleapis/release-please/compare/v11.1.1...v11.2.0) (2021-03-09)


### Features

* **java:** add LTS versioning scheme and releaser ([#810](https://www.github.com/googleapis/release-please/issues/810)) ([89e5bed](https://www.github.com/googleapis/release-please/commit/89e5bedf00cccc756dbbe6c61013a5a54a724be9))


### Bug Fixes

* associated pull requests should match merge commit sha ([#817](https://www.github.com/googleapis/release-please/issues/817)) ([c144f8b](https://www.github.com/googleapis/release-please/commit/c144f8b8dd090b6133e73546a03ce55ebf08b68b))
* update templated tf versions ([#812](https://www.github.com/googleapis/release-please/issues/812)) ([d222746](https://www.github.com/googleapis/release-please/commit/d22274690c3a2117d620af76537b7e641e4734fd))

### [11.1.1](https://www.github.com/googleapis/release-please/compare/v11.1.0...v11.1.1) (2021-03-01)


### Bug Fixes

* commit-split paths validation ([#806](https://www.github.com/googleapis/release-please/issues/806)) ([0b1da99](https://www.github.com/googleapis/release-please/commit/0b1da99c3c7e395f98c7625e2664845b58111a09))
* **node:** PackageJson updater sets this.contents ([#803](https://www.github.com/googleapis/release-please/issues/803)) ([732e453](https://www.github.com/googleapis/release-please/commit/732e453e7f00c93bcc0e39c66dd600fb1e9386e6))

## [11.1.0](https://www.github.com/googleapis/release-please/compare/v11.0.1...v11.1.0) (2021-02-24)


### Features

* support custom pull request title ([#784](https://www.github.com/googleapis/release-please/issues/784)) ([d34e069](https://www.github.com/googleapis/release-please/commit/d34e069b6c8262a69d97309791d3b371c4dbbb0d))


### Bug Fixes

* bug in Terraform version updater  ([#795](https://www.github.com/googleapis/release-please/issues/795)) ([24d5b8b](https://www.github.com/googleapis/release-please/commit/24d5b8bde7f8b3d261c7d010719f6b2f697ccb5f))

### [11.0.1](https://www.github.com/googleapis/release-please/compare/v11.0.0...v11.0.1) (2021-02-23)


### Bug Fixes

* js-yaml should be a dependency not devDependency ([#792](https://www.github.com/googleapis/release-please/issues/792)) ([eaf031f](https://www.github.com/googleapis/release-please/commit/eaf031fb29ceb8ac7503c21bf730130fb29a2b95))

## [11.0.0](https://www.github.com/googleapis/release-please/compare/v10.1.0...v11.0.0) (2021-02-23)


### ⚠ BREAKING CHANGES

* move changelogPath down to ReleasePR (#790)
* move fork down to GitHub (#770)
* factory.run becomes factory.call
* remove GitHubRelease.labels in favor of ReleasePR.labels
* normalize configuration accross classes (#763)
* move latestTag logic to ReleasePR (#758)

### Features

* add async interator for searching commit history ([#759](https://www.github.com/googleapis/release-please/issues/759)) ([f42bab1](https://www.github.com/googleapis/release-please/commit/f42bab11d9d737d64f8b4a7184b58951fc6a9d44))
* add latest-tag command which will print out the detected latest tag for a branch ([#765](https://www.github.com/googleapis/release-please/issues/765)) ([07e2969](https://www.github.com/googleapis/release-please/commit/07e29696c13b323ff8c79bfa350809f8d6b91230))
* add support for helm ([#748](https://www.github.com/googleapis/release-please/issues/748)) ([c9fbf78](https://www.github.com/googleapis/release-please/commit/c9fbf78832c65425d5efdace2fc0f24233749f6e))
* expose the release body to consumers ([#789](https://www.github.com/googleapis/release-please/issues/789)) ([6848e8e](https://www.github.com/googleapis/release-please/commit/6848e8e635a710925bdf78ca0b1eb246d7a1836d))
* pull request title resource ([#780](https://www.github.com/googleapis/release-please/issues/780)) ([4e7f524](https://www.github.com/googleapis/release-please/commit/4e7f524d0ce2a9560998de57f8c0d3a14815b4d5))


### Bug Fixes

* **deps:** update dependency type-fest to ^0.21.0 ([#768](https://www.github.com/googleapis/release-please/issues/768)) ([eb68033](https://www.github.com/googleapis/release-please/commit/eb68033095777b1687275947c7117601ad2e333a))
* do not change format of Python version files ([#782](https://www.github.com/googleapis/release-please/issues/782)) ([10f7ab9](https://www.github.com/googleapis/release-please/commit/10f7ab98ce1a277864a383959a6f7338985f0bfa))
* find first associate pull request ([#764](https://www.github.com/googleapis/release-please/issues/764)) ([b277b89](https://www.github.com/googleapis/release-please/commit/b277b8909e78047797796c0428f545ce482a0b2a))
* **github-release:** release name is packageName ([#757](https://www.github.com/googleapis/release-please/issues/757)) ([869f1a1](https://www.github.com/googleapis/release-please/commit/869f1a1ad7395dd6889033ddc103f99a310ac06b))
* only add the target branch to PR title for non-default branches ([#781](https://www.github.com/googleapis/release-please/issues/781)) ([00ca2ad](https://www.github.com/googleapis/release-please/commit/00ca2ad9953baeb69f7ed28fc7958f7868ee127f))
* **pagination:** looking for pending PRs had no pagination limit ([#791](https://www.github.com/googleapis/release-please/issues/791)) ([9b36d25](https://www.github.com/googleapis/release-please/commit/9b36d25451f988ec921b9abd54ff94fa8f5da295))
* **release-pr:** update default initial version ([#776](https://www.github.com/googleapis/release-please/issues/776)) ([5f62443](https://www.github.com/googleapis/release-please/commit/5f624439cafe6702ac45d70ad39a2330258dfe03))


### Code Refactoring

* move changelogPath down to ReleasePR ([#790](https://www.github.com/googleapis/release-please/issues/790)) ([65c4147](https://www.github.com/googleapis/release-please/commit/65c41479c0a12c900b0850591f5223d436062e45))
* move fork down to GitHub ([#770](https://www.github.com/googleapis/release-please/issues/770)) ([d25f490](https://www.github.com/googleapis/release-please/commit/d25f49028092602190535bd94c5b17d0e984a3bc))
* move latestTag logic to ReleasePR ([#758](https://www.github.com/googleapis/release-please/issues/758)) ([746d1c8](https://www.github.com/googleapis/release-please/commit/746d1c893a95894420a5fe65706a438492e6605c))
* normalize configuration accross classes ([#763](https://www.github.com/googleapis/release-please/issues/763)) ([44a3fd2](https://www.github.com/googleapis/release-please/commit/44a3fd2ef61b7083f6bbc88d20c51d57b4f7998e))
* remove GitHubRelease.labels in favor of ReleasePR.labels ([44a3fd2](https://www.github.com/googleapis/release-please/commit/44a3fd2ef61b7083f6bbc88d20c51d57b4f7998e))
* rename factory.run -> call ([#767](https://www.github.com/googleapis/release-please/issues/767)) ([24ecc3e](https://www.github.com/googleapis/release-please/commit/24ecc3e1a1e986cfdd10f069f4705ce869297787))

## [10.1.0](https://www.github.com/googleapis/release-please/compare/v10.0.0...v10.1.0) (2021-02-08)


### Features

* add GitHub#commitsSince and GitHub#findMergeCommit ([#741](https://www.github.com/googleapis/release-please/issues/741)) ([27eb7b1](https://www.github.com/googleapis/release-please/commit/27eb7b13daedaf6d44374bdce9bc70ec14ab026d))
* allow explicitly empty packageName when creating a release ([#743](https://www.github.com/googleapis/release-please/issues/743)) ([c3580c6](https://www.github.com/googleapis/release-please/commit/c3580c60c26af8c197f2ed3ee83736523c48f8fe))
* tagging the release also comments on the release PR ([#751](https://www.github.com/googleapis/release-please/issues/751)) ([f78fc93](https://www.github.com/googleapis/release-please/commit/f78fc93d1a96ee419bc99e9b3b2a46abc507131f))

## [10.0.0](https://www.github.com/googleapis/release-please/compare/v9.4.1...v10.0.0) (2021-02-03)


### ⚠ BREAKING CHANGES

* remove deprecated JavaAuthYoshi releaser (#736)
* helpers in factory class renamed.
* more options pulled to top level (some types changed in process)
* GitHub release now uses "run" rather than "createRelease" to execute
* drop unused proxy-key parameter.
* **cli:** refactor factory/CLI to be more testable (#725)
* removed per page parameter from GitHub#findMergedReleasePR and moved some internal helpers

### Features

* **cli:** refactor factory/CLI to be more testable ([#725](https://www.github.com/googleapis/release-please/issues/725)) ([713bfc5](https://www.github.com/googleapis/release-please/commit/713bfc591bef8c5df71de67e7aca44cbc0457344))
* packageName parameter is now optional ([713bfc5](https://www.github.com/googleapis/release-please/commit/713bfc591bef8c5df71de67e7aca44cbc0457344))
* support stable release branch names ([#720](https://www.github.com/googleapis/release-please/issues/720)) ([36cae96](https://www.github.com/googleapis/release-please/commit/36cae96eebd4ee00a00f9ccc6b7382f879d97a39))


### Bug Fixes

* remove deprecated JavaAuthYoshi releaser ([#736](https://www.github.com/googleapis/release-please/issues/736)) ([fc86755](https://www.github.com/googleapis/release-please/commit/fc867556c071218390d58d6d978d2a6687026d1b))


### Code Refactoring

* drop unused proxy-key parameter. ([713bfc5](https://www.github.com/googleapis/release-please/commit/713bfc591bef8c5df71de67e7aca44cbc0457344))
* GitHub release now uses "run" rather than "createRelease" to execute ([713bfc5](https://www.github.com/googleapis/release-please/commit/713bfc591bef8c5df71de67e7aca44cbc0457344))
* helpers in factory class renamed. ([713bfc5](https://www.github.com/googleapis/release-please/commit/713bfc591bef8c5df71de67e7aca44cbc0457344))
* more options pulled to top level (some types changed in process) ([713bfc5](https://www.github.com/googleapis/release-please/commit/713bfc591bef8c5df71de67e7aca44cbc0457344))

### [9.4.1](https://www.github.com/googleapis/release-please/compare/v9.4.0...v9.4.1) (2021-02-02)


### Bug Fixes

* **revert:** use resolove to find imports in tests [#715](https://www.github.com/googleapis/release-please/issues/715) ([#731](https://www.github.com/googleapis/release-please/issues/731)) ([ab74aea](https://www.github.com/googleapis/release-please/commit/ab74aea90dd131a994a192dacceefa8fd8414146))

## [9.4.0](https://www.github.com/googleapis/release-please/compare/v9.3.0...v9.4.0) (2021-02-01)


### Features

* **github-release:** create a draft release ([#703](https://www.github.com/googleapis/release-please/issues/703)) ([bd83c03](https://www.github.com/googleapis/release-please/commit/bd83c032d2b678430e09e15283949bc8ee777471))

## [9.3.0](https://www.github.com/googleapis/release-please/compare/v9.2.0...v9.3.0) (2021-01-22)


### Features

* add add GitHub helpers for findFilesByFilenameAndRef and findFilesByExtensionAndRef ([#712](https://www.github.com/googleapis/release-please/issues/712)) ([0258bd6](https://www.github.com/googleapis/release-please/commit/0258bd6fe4aca5e988aa993156bccd37c53130eb))
* **rust:** Update Cargo.lock, preserve formatting in Cargo.{toml,lock} ([#705](https://www.github.com/googleapis/release-please/issues/705)) ([198c327](https://www.github.com/googleapis/release-please/commit/198c32787d5f41104f7d19c59df28bfbdee2d85d))


### Bug Fixes

* **go:** support processing footers in gapics ([#711](https://www.github.com/googleapis/release-please/issues/711)) ([08d8986](https://www.github.com/googleapis/release-please/commit/08d8986f4fa9544f77d931847a3d54ab967c17fd))
* **pagination:** when tagging release, use updated, vs., created ([#708](https://www.github.com/googleapis/release-please/issues/708)) ([9ae5620](https://www.github.com/googleapis/release-please/commit/9ae5620274836acd39662ef0fb55502d06585423))
* return PRs by last updated ([#706](https://www.github.com/googleapis/release-please/issues/706)) ([e0c7b00](https://www.github.com/googleapis/release-please/commit/e0c7b00034837d728770fb27ddf6d746c3dd181e))

## [9.2.0](https://www.github.com/googleapis/release-please/compare/v9.1.0...v9.2.0) (2021-01-12)


### Features

* add ocaml releaser and esy/opam updaters ([#697](https://www.github.com/googleapis/release-please/issues/697)) ([5e94767](https://www.github.com/googleapis/release-please/commit/5e947674683bbe512343848e52327255c331cdc4))

## [9.1.0](https://www.github.com/googleapis/release-please/compare/v9.0.0...v9.1.0) (2021-01-12)


### Features

* add addFilesByExtension method & allow leading slash in path ([#694](https://www.github.com/googleapis/release-please/issues/694)) ([0d63813](https://www.github.com/googleapis/release-please/commit/0d638138caa4299fda723008dfa6975c0b816ebd))


### Bug Fixes

* **github-release:** increasae page size finding release ([#698](https://www.github.com/googleapis/release-please/issues/698)) ([c156950](https://www.github.com/googleapis/release-please/commit/c1569508bf2d5b9071df0c7bebe75f3322ff1b4a))
* **monorepos:** github-release not created ([#669](https://www.github.com/googleapis/release-please/issues/669)) ([9f69f41](https://www.github.com/googleapis/release-please/commit/9f69f416ad4d228b40ac6d7f7d86c652d01e57d6)), closes [#668](https://www.github.com/googleapis/release-please/issues/668)

## [9.0.0](https://www.github.com/googleapis/release-please/compare/v8.2.0...v9.0.0) (2021-01-08)


### ⚠ BREAKING CHANGES

* support multiple commits in footer (#686)

### Features

* support multiple commits in footer ([#686](https://www.github.com/googleapis/release-please/issues/686)) ([b3f96d8](https://www.github.com/googleapis/release-please/commit/b3f96d8dd988b7d482223e8a7868a45043db4880))


### Bug Fixes

* `findFilesByfilename` respects `path` option ([#665](https://www.github.com/googleapis/release-please/issues/665)) ([a3a1df6](https://www.github.com/googleapis/release-please/commit/a3a1df690f48b38c539ee5aab5ae046d640c6811))

## [8.2.0](https://www.github.com/googleapis/release-please/compare/v8.1.0...v8.2.0) (2021-01-06)


### Features

* add rust releaser & cargo-toml updater ([#684](https://www.github.com/googleapis/release-please/issues/684)) ([fe05ff4](https://www.github.com/googleapis/release-please/commit/fe05ff47f1eb523d47bf3f6f11587105270744ee))

## [8.1.0](https://www.github.com/googleapis/release-please/compare/v8.0.1...v8.1.0) (2021-01-05)


### Features

* support @ and / when falling back to tags ([#673](https://www.github.com/googleapis/release-please/issues/673)) ([243d6d9](https://www.github.com/googleapis/release-please/commit/243d6d9a5e719e6ebccb232b35fcab1f9f3db24f))


### Bug Fixes

* **go:** pass monorepo-tags to open-pr; omit commits when publishing gapic submodule ([#659](https://www.github.com/googleapis/release-please/issues/659)) ([9ba60ee](https://www.github.com/googleapis/release-please/commit/9ba60ee3f8f3bfc9c0dee3180dce3b16386aa1b1))
* **go:** submodules should bump patch ([#661](https://www.github.com/googleapis/release-please/issues/661)) ([f441676](https://www.github.com/googleapis/release-please/commit/f441676b2f57ce716e8a0b2b34ecc300dfee1f90))
* **webpack:** make release-please webpackable ([#670](https://www.github.com/googleapis/release-please/issues/670)) ([ae4f500](https://www.github.com/googleapis/release-please/commit/ae4f5007749a1cf1fa23f3af9ea3d8c20f35a800))

### [8.0.1](https://www.github.com/googleapis/release-please/compare/v8.0.0...v8.0.1) (2020-12-07)


### Bug Fixes

* **ruby:** use same tagging scheme as go ([#657](https://www.github.com/googleapis/release-please/issues/657)) ([fc8862b](https://www.github.com/googleapis/release-please/commit/fc8862bb3af35a7cd93cbb13515c03ab2062fe41))

## [8.0.0](https://www.github.com/googleapis/release-please/compare/v7.0.0...v8.0.0) (2020-12-07)


### ⚠ BREAKING CHANGES

* simplify go approach (#654)

### Bug Fixes

* do not close stale PRs for submodules ([#651](https://www.github.com/googleapis/release-please/issues/651)) ([582fdf6](https://www.github.com/googleapis/release-please/commit/582fdf687ba23fdb554cb8de44af694a877d4ed9))


### Code Refactoring

* simplify go approach ([#654](https://www.github.com/googleapis/release-please/issues/654)) ([c5fc472](https://www.github.com/googleapis/release-please/commit/c5fc47261817f4abd6fa3badd8d5446d9cdedaba))

## [7.0.0](https://www.github.com/googleapis/release-please/compare/v6.9.1...v7.0.0) (2020-12-03)


### ⚠ BREAKING CHANGES

* reverts adding clean option (#647)
* return major/minor/patch when creating GitHub release (#642)
* **github-release:** packageName now used to specify submodule (#636)

### Features

* **conventional-commits:** support googleapis extension ([#646](https://www.github.com/googleapis/release-please/issues/646)) ([80cd63c](https://www.github.com/googleapis/release-please/commit/80cd63c1d202bf21509d1828ce15aa9220c8b1d5))
* allow cleanup steps to be turned off ([#643](https://www.github.com/googleapis/release-please/issues/643)) ([055cd3a](https://www.github.com/googleapis/release-please/commit/055cd3aa72276eb11637ff9cfb99fb50f11db5f1))
* return major/minor/patch when creating GitHub release ([#642](https://www.github.com/googleapis/release-please/issues/642)) ([bb946dd](https://www.github.com/googleapis/release-please/commit/bb946dd1d0b683162e9be27a4b324ab02602d871))
* return pr number, if one was opened ([#638](https://www.github.com/googleapis/release-please/issues/638)) ([ee8ae41](https://www.github.com/googleapis/release-please/commit/ee8ae414ae16e456c4604d3b1f68546e3ef603e5))
* **github-release:** packageName now used to specify submodule ([#636](https://www.github.com/googleapis/release-please/issues/636)) ([3b8e9b3](https://www.github.com/googleapis/release-please/commit/3b8e9b3df3c537b9476dfe20050de45ca72491d7))
* **monorepos:** support submodules in nested folders ([#633](https://www.github.com/googleapis/release-please/issues/633)) ([6b654ae](https://www.github.com/googleapis/release-please/commit/6b654ae17cb00f79103b8b58ed73d081d0b85c9a))


### Bug Fixes

* add back upload_url ([#644](https://www.github.com/googleapis/release-please/issues/644)) ([3e77519](https://www.github.com/googleapis/release-please/commit/3e77519a2f7651e2e9d653522f122051c31d79ce))
* do not add labels when running on fork ([#645](https://www.github.com/googleapis/release-please/issues/645)) ([581e93e](https://www.github.com/googleapis/release-please/commit/581e93e33ba83d7d234c23519b068ad6cb10773a))
* logic was throwing out merge commits ([#649](https://www.github.com/googleapis/release-please/issues/649)) ([e01cf05](https://www.github.com/googleapis/release-please/commit/e01cf0514a35427d7f87ebb39f02746da2529f35))
* Recursively update version in Terraform submodule README files ([#640](https://www.github.com/googleapis/release-please/issues/640)) ([a1d3408](https://www.github.com/googleapis/release-please/commit/a1d3408541d80e896803b3f41ecd46ab305e1d02))
* **deps:** update dependency type-fest to ^0.20.0 ([#641](https://www.github.com/googleapis/release-please/issues/641)) ([178bfb6](https://www.github.com/googleapis/release-please/commit/178bfb6ed4e22a0ee6d05d63e6e1babf6936db68))


### Reverts

* reverts adding clean option ([#647](https://www.github.com/googleapis/release-please/issues/647)) ([ca82b9a](https://www.github.com/googleapis/release-please/commit/ca82b9a4fd758cc4a7bc762b3282c2f665e46426))

### [6.9.1](https://www.github.com/googleapis/release-please/compare/v6.9.0...v6.9.1) (2020-11-20)


### Bug Fixes

* pass gh instance to submodule ([#631](https://www.github.com/googleapis/release-please/issues/631)) ([7b3e61c](https://www.github.com/googleapis/release-please/commit/7b3e61c89971918803b7fab2bb310d32442052ef))

## [6.9.0](https://www.github.com/googleapis/release-please/compare/v6.8.3...v6.9.0) (2020-11-17)


### Features

* **terraform:** Add TF versions updater ([#629](https://www.github.com/googleapis/release-please/issues/629)) ([6f2007c](https://www.github.com/googleapis/release-please/commit/6f2007cfb740f4d711b20637c43cb8d63dbbda91))

### [6.8.3](https://www.github.com/googleapis/release-please/compare/v6.8.2...v6.8.3) (2020-11-16)


### Bug Fixes

* include multi-line breaking changes ([#627](https://www.github.com/googleapis/release-please/issues/627)) ([bff05e1](https://www.github.com/googleapis/release-please/commit/bff05e1659bf71e2324bd70319e364e347bc025f))
* **deps:** update dependency type-fest to ^0.19.0 ([#625](https://www.github.com/googleapis/release-please/issues/625)) ([e2b38ee](https://www.github.com/googleapis/release-please/commit/e2b38eea6424f647c807e76d894d0a618b61eea1))

### [6.8.2](https://www.github.com/googleapis/release-please/compare/v6.8.1...v6.8.2) (2020-11-12)


### Bug Fixes

* **nodejs:** do not include org in branch name ([#623](https://www.github.com/googleapis/release-please/issues/623)) ([fde5db4](https://www.github.com/googleapis/release-please/commit/fde5db4b71a7421d546dabea5969610e84d65e9c))

### [6.8.1](https://www.github.com/googleapis/release-please/compare/v6.8.0...v6.8.1) (2020-11-10)


### Bug Fixes

* **go:** we should not include - in the suffix ([#621](https://www.github.com/googleapis/release-please/issues/621)) ([a8fa0bd](https://www.github.com/googleapis/release-please/commit/a8fa0bd6d1e617f067a67fe85139a9b18ee7a6ec))

## [6.8.0](https://www.github.com/googleapis/release-please/compare/v6.7.0...v6.8.0) (2020-11-09)


### Features

* **go:** add support for mono-repo google-cloud-go repo ([#617](https://www.github.com/googleapis/release-please/issues/617)) ([7121575](https://www.github.com/googleapis/release-please/commit/7121575ca8229bc849d1e9e015b1c81f02a7b1c5))

## [6.7.0](https://www.github.com/googleapis/release-please/compare/v6.6.0...v6.7.0) (2020-10-29)


### Features

* **java:** support special case of promotion to 1.0.0 ([#610](https://www.github.com/googleapis/release-please/issues/610)) ([5b5edac](https://www.github.com/googleapis/release-please/commit/5b5edace650666db76c4f5d92881f8230c74464a))

## [6.6.0](https://www.github.com/googleapis/release-please/compare/v6.5.2...v6.6.0) (2020-10-28)


### Features

* Support the Ruby releaser from the static ReleasePRFactory ([#608](https://www.github.com/googleapis/release-please/issues/608)) ([8e4e49c](https://www.github.com/googleapis/release-please/commit/8e4e49c30e12ab2912fc1d3f740d91c549cdacb7))

### [6.5.2](https://www.github.com/googleapis/release-please/compare/v6.5.1...v6.5.2) (2020-10-28)


### Bug Fixes

* **graphql:** graphql query requested pagination at wrong level/did n… ([#606](https://www.github.com/googleapis/release-please/issues/606)) ([0d9c1e1](https://www.github.com/googleapis/release-please/commit/0d9c1e1268b00ca441077fb39355fa4de1773ff1))

### [6.5.1](https://www.github.com/googleapis/release-please/compare/v6.5.0...v6.5.1) (2020-10-27)


### Bug Fixes

* **go:** ignore tags with prefix, if no prefix provided ([#604](https://www.github.com/googleapis/release-please/issues/604)) ([e35b38f](https://www.github.com/googleapis/release-please/commit/e35b38fd3be822dca36cab80271fb66d46d2a6ea))

## [6.5.0](https://www.github.com/googleapis/release-please/compare/v6.4.4...v6.5.0) (2020-10-27)


### Features

* **go:** generalize to also support google-api-go-client  ([#554](https://www.github.com/googleapis/release-please/issues/554)) ([609164c](https://www.github.com/googleapis/release-please/commit/609164ce23ddb9af369b01855581157e9ea891e3))

### [6.4.4](https://www.github.com/googleapis/release-please/compare/v6.4.3...v6.4.4) (2020-10-21)


### Bug Fixes

* pagination logic broken in merge ([#594](https://www.github.com/googleapis/release-please/issues/594)) ([b3c8dd2](https://www.github.com/googleapis/release-please/commit/b3c8dd2891db5e35b0bb8778a7923851ce1c7cdf))

### [6.4.3](https://www.github.com/googleapis/release-please/compare/v6.4.2...v6.4.3) (2020-10-16)


### Bug Fixes

* issues found by testing with the GCP ruby repo ([#587](https://www.github.com/googleapis/release-please/issues/587)) ([ab9f97c](https://www.github.com/googleapis/release-please/commit/ab9f97c7a6fdd0e03ea7370d90839004490228ce))

### [6.4.2](https://www.github.com/googleapis/release-please/compare/v6.4.1...v6.4.2) (2020-10-14)


### Bug Fixes

* **deps:** update dependency type-fest to ^0.18.0 ([#589](https://www.github.com/googleapis/release-please/issues/589)) ([66f44ef](https://www.github.com/googleapis/release-please/commit/66f44ef23dece7c366eb17db4bf09dcb43fcc41a))

### [6.4.1](https://www.github.com/googleapis/release-please/compare/v6.4.0...v6.4.1) (2020-10-08)


### Bug Fixes

* sort commits from graphql output by descending commit date so we get fresh results ([#585](https://www.github.com/googleapis/release-please/issues/585)) ([05897e7](https://www.github.com/googleapis/release-please/commit/05897e7219fcf3d65eceaf64284d3d97daaeeaa4))

## [6.4.0](https://www.github.com/googleapis/release-please/compare/v6.3.0...v6.4.0) (2020-10-08)


### Features

* add support for releasing from non-master branches for legacy support ([#429](https://www.github.com/googleapis/release-please/issues/429)) ([6278b1d](https://www.github.com/googleapis/release-please/commit/6278b1d2a8cb1d3759fb2c1f599377b1182078d7))

## [6.3.0](https://www.github.com/googleapis/release-please/compare/v6.2.0...v6.3.0) (2020-10-05)


### Features

* add support for versioning by version.py for python packages ([#560](https://www.github.com/googleapis/release-please/issues/560)) ([a185192](https://www.github.com/googleapis/release-please/commit/a1851929a89c135e5feff2e040d224aea05610e6))


### Bug Fixes

* **deps:** update dependency type-fest to ^0.17.0 ([#556](https://www.github.com/googleapis/release-please/issues/556)) ([e9ddbfb](https://www.github.com/googleapis/release-please/commit/e9ddbfb9f941f5dbde16500e249d7114c6e8520f))

## [6.2.0](https://www.github.com/googleapis/release-please/compare/v6.1.0...v6.2.0) (2020-09-11)


### Features

* add option to create PR from fork ([#547](https://www.github.com/googleapis/release-please/issues/547)) ([5057818](https://www.github.com/googleapis/release-please/commit/5057818c9029cb2054c2279183044c17c607699f))
* adds support for Data API in Github#getFileContents ([#551](https://www.github.com/googleapis/release-please/issues/551)) ([40a9c68](https://www.github.com/googleapis/release-please/commit/40a9c684347331756aae87639e0fa18d218ce16b)), closes [#546](https://www.github.com/googleapis/release-please/issues/546)
* support pre-releases ([#550](https://www.github.com/googleapis/release-please/issues/550)) ([320448b](https://www.github.com/googleapis/release-please/commit/320448b22eb5c3c7c7a6eaa96ac77b8cc73bc48a))


### Bug Fixes

* **deps:** update dependency yargs to v16 ([#544](https://www.github.com/googleapis/release-please/issues/544)) ([ab092c8](https://www.github.com/googleapis/release-please/commit/ab092c83a284517b00b5827a6136cd32c8fd9e7e))

## [6.1.0](https://www.github.com/googleapis/release-please/compare/v6.0.0...v6.1.0) (2020-09-08)


### Features

*  pass an array of change log section options to the node releaser ([#538](https://www.github.com/googleapis/release-please/issues/538)) ([e9874f4](https://www.github.com/googleapis/release-please/commit/e9874f469dbe2ef76c9469f4db78e0eb9ece921e))


### Bug Fixes

* forks do not work for GitHub Actions or apps ([#542](https://www.github.com/googleapis/release-please/issues/542)) ([6676c26](https://www.github.com/googleapis/release-please/commit/6676c266128e967b9f6ad57acf45f9c82c506154))
* return 0 rather than -1 if PR not found ([#541](https://www.github.com/googleapis/release-please/issues/541)) ([1247635](https://www.github.com/googleapis/release-please/commit/124763588b8a182f3a86240de2d9c8de458a712d))

## [6.0.0](https://www.github.com/googleapis/release-please/compare/v5.9.1...v6.0.0) (2020-09-04)


### ⚠ BREAKING CHANGES

* **code-suggester:** move to code-suggester for PR management (#536)

### Features

* **code-suggester:** move to code-suggester for PR management ([#536](https://www.github.com/googleapis/release-please/issues/536)) ([de347b8](https://www.github.com/googleapis/release-please/commit/de347b89c5db8f410abe0730a6c0e48fb4665b2e))

### [5.9.1](https://www.github.com/googleapis/release-please/compare/v5.9.0...v5.9.1) (2020-09-02)


### Bug Fixes

* **simple:** create version.txt if it does not exist ([#534](https://www.github.com/googleapis/release-please/issues/534)) ([cf906f2](https://www.github.com/googleapis/release-please/commit/cf906f29f2d738104207fa682cda9146eaba64c5))

## [5.9.0](https://www.github.com/googleapis/release-please/compare/v5.8.0...v5.9.0) (2020-08-20)


### Features

* **release-as:** release-as now supports pre-release ([#529](https://www.github.com/googleapis/release-please/issues/529)) ([e8b1105](https://www.github.com/googleapis/release-please/commit/e8b1105e068cf037173d3d74a8555ace85a1bfcc))

## [5.8.0](https://www.github.com/googleapis/release-please/compare/v5.7.3...v5.8.0) (2020-08-18)


### Features

* add typescript exports from index ([#525](https://www.github.com/googleapis/release-please/issues/525)) ([8b28640](https://www.github.com/googleapis/release-please/commit/8b286404489da09c68c63278bae2acca24377b68))
* allow CHANGELOG path to be  set ([#527](https://www.github.com/googleapis/release-please/issues/527)) ([1a72cc2](https://www.github.com/googleapis/release-please/commit/1a72cc2916baba7b7a0d71aaa8274bc99ebcba53))

### [5.7.3](https://www.github.com/googleapis/release-please/compare/v5.7.2...v5.7.3) (2020-08-18)


### Bug Fixes

* **yoshi-go:** store the sha of the first commit ([#523](https://www.github.com/googleapis/release-please/issues/523)) ([6c313c1](https://www.github.com/googleapis/release-please/commit/6c313c151c749273d3d73bf4aeae6f4a2f9dffd3))

### [5.7.2](https://www.github.com/googleapis/release-please/compare/v5.7.1...v5.7.2) (2020-08-14)


### Bug Fixes

* **go:** Update scope matching and regen regex ([#520](https://www.github.com/googleapis/release-please/issues/520)) ([aa045ce](https://www.github.com/googleapis/release-please/commit/aa045cec26ae8588f7aea78fd220dca72f83ea88))

### [5.7.1](https://www.github.com/googleapis/release-please/compare/v5.7.0...v5.7.1) (2020-08-12)


### Bug Fixes

* **java:** detect need for snapshot unless a snapshot is explicitly requested ([#518](https://www.github.com/googleapis/release-please/issues/518)) ([1e73a28](https://www.github.com/googleapis/release-please/commit/1e73a28898d8dd0eb3e6f5a3ff00564fe4004fa7))

## [5.7.0](https://www.github.com/googleapis/release-please/compare/v5.6.2...v5.7.0) (2020-08-12)


### Features

* **go:** add support for releasing yoshi gapic go libraries ([#514](https://www.github.com/googleapis/release-please/issues/514)) ([25a234a](https://www.github.com/googleapis/release-please/commit/25a234aa61c629e0cc3013f9c86b828c9b0f1d35))

### [5.6.2](https://www.github.com/googleapis/release-please/compare/v5.6.1...v5.6.2) (2020-08-04)


### Bug Fixes

* looser parsing of versions.txt ([#512](https://www.github.com/googleapis/release-please/issues/512)) ([e4c77f4](https://www.github.com/googleapis/release-please/commit/e4c77f4c155295b60d7c6bb765f486325d3cfb3c)), closes [#500](https://www.github.com/googleapis/release-please/issues/500)

### [5.6.1](https://www.github.com/googleapis/release-please/compare/v5.6.0...v5.6.1) (2020-07-28)


### Bug Fixes

* **java-snapshot:** handle no new commits since release ([#504](https://www.github.com/googleapis/release-please/issues/504)) ([deb625f](https://www.github.com/googleapis/release-please/commit/deb625ff5b00cbd523c0dcc1160716cce31b18da)), closes [#500](https://www.github.com/googleapis/release-please/issues/500)

## [5.6.0](https://www.github.com/googleapis/release-please/compare/v5.5.2...v5.6.0) (2020-07-27)


### Features

* add support for monorepos/releasing from alternate folders ([#501](https://www.github.com/googleapis/release-please/issues/501)) ([64268ba](https://www.github.com/googleapis/release-please/commit/64268ba55d994dd350fe7e04123daafdca379ad0))

### [5.5.2](https://www.github.com/googleapis/release-please/compare/v5.5.1...v5.5.2) (2020-07-23)


### Bug Fixes

* missing authorization header for repos.get() ([#490](https://www.github.com/googleapis/release-please/issues/490)) ([895b91c](https://www.github.com/googleapis/release-please/commit/895b91c5ff42d01fa96499f7021fa5ede98ff52e)), closes [#474](https://www.github.com/googleapis/release-please/issues/474)
* **node:** reorder files added, so that skip logic works ([#495](https://www.github.com/googleapis/release-please/issues/495)) ([55d7be6](https://www.github.com/googleapis/release-please/commit/55d7be6fdba12b83285462c8946426a8618f4d2b))
* use conventional commits for our own commits ([#498](https://www.github.com/googleapis/release-please/issues/498)) ([7c63bbf](https://www.github.com/googleapis/release-please/commit/7c63bbf978d4cf88d12c95de2412ab1124c748dc))

### [5.5.1](https://www.github.com/googleapis/release-please/compare/v5.5.0...v5.5.1) (2020-07-07)


### Bug Fixes

* exception was thrown when 0 commits found ([#484](https://www.github.com/googleapis/release-please/issues/484)) ([ae26670](https://www.github.com/googleapis/release-please/commit/ae26670b51c0d7a221c1becf147a4cb839374554))

## [5.5.0](https://www.github.com/googleapis/release-please/compare/v5.4.0...v5.5.0) (2020-07-01)


### Features

* **snapshot:** skip snapshot releases for releasers that lack this concept ([#479](https://www.github.com/googleapis/release-please/issues/479)) ([8305a2d](https://www.github.com/googleapis/release-please/commit/8305a2d7855988f175ac1b1d63513f7153e7e185))


### Bug Fixes

* **deps:** update dependency type-fest to ^0.16.0 ([#475](https://www.github.com/googleapis/release-please/issues/475)) ([be5ea39](https://www.github.com/googleapis/release-please/commit/be5ea39be3d45bb73ee4a78c2abae6a80fc9a6be))
* skip Java releases if snapshot is specified, but does not match repo state ([#481](https://www.github.com/googleapis/release-please/issues/481)) ([ba6e358](https://www.github.com/googleapis/release-please/commit/ba6e35884b7e14d991618b9648b9d49fff1b4733))
* update node issue template ([#472](https://www.github.com/googleapis/release-please/issues/472)) ([746f088](https://www.github.com/googleapis/release-please/commit/746f088b7c7c0a6ed7f118f39fa3cd4b825dc429))

## [5.4.0](https://www.github.com/googleapis/release-please/compare/v5.3.0...v5.4.0) (2020-06-17)


### Features

* detect default branch ([#468](https://www.github.com/googleapis/release-please/issues/468)) ([301a08a](https://www.github.com/googleapis/release-please/commit/301a08a1afdac48fd81b55816316f14d42aba23c))
* **node:** update version number in package-lock.json ([#467](https://www.github.com/googleapis/release-please/issues/467)) ([2d69956](https://www.github.com/googleapis/release-please/commit/2d69956bb80619097f92c6d5eb809f8083381acb))


### Bug Fixes

* list commits of type `docs` for python ([#460](https://www.github.com/googleapis/release-please/issues/460)) ([ba06649](https://www.github.com/googleapis/release-please/commit/ba06649fc17843d3dcff16bef5cdf0f33f0d5fc4)), closes [#459](https://www.github.com/googleapis/release-please/issues/459)
* **deps:** update dependency @octokit/rest to v18 ([#465](https://www.github.com/googleapis/release-please/issues/465)) ([ffbf2eb](https://www.github.com/googleapis/release-please/commit/ffbf2eb1109897fb0d7d98a9056fb8052a5cc4f9))

## [5.3.0](https://www.github.com/googleapis/release-please/compare/v5.2.1...v5.3.0) (2020-06-11)


### Features

* **java-yoshi:** handle build.gradle and dependencies.properties files ([#457](https://www.github.com/googleapis/release-please/issues/457)) ([c8094f8](https://www.github.com/googleapis/release-please/commit/c8094f84134ee2ada28e9abf83ebbd13f6036dba))

### [5.2.1](https://www.github.com/googleapis/release-please/compare/v5.2.0...v5.2.1) (2020-06-06)


### Bug Fixes

* **deps:** update dependency type-fest to ^0.14.0 ([#447](https://www.github.com/googleapis/release-please/issues/447)) ([7b618e8](https://www.github.com/googleapis/release-please/commit/7b618e86b485e1e10c26f1a92315586d2664afa3))
* **deps:** update dependency type-fest to ^0.15.0 ([#450](https://www.github.com/googleapis/release-please/issues/450)) ([ed5e462](https://www.github.com/googleapis/release-please/commit/ed5e4626ec5c47c89090a0d38eda8629c5cc07ea))
* merge commits now handled ([#452](https://www.github.com/googleapis/release-please/issues/452)) ([8f89e74](https://www.github.com/googleapis/release-please/commit/8f89e74e5f32d78e027f949ab1e6cbab32187a4e))

## [5.2.0](https://www.github.com/googleapis/release-please/compare/v5.1.0...v5.2.0) (2020-05-20)


### Features

* a flag to skip CI ([#443](https://www.github.com/googleapis/release-please/issues/443)) ([17e0636](https://www.github.com/googleapis/release-please/commit/17e063656079c0f76dba7343f58f7595b132d7e3))

## [5.1.0](https://www.github.com/googleapis/release-please/compare/v5.0.0...v5.1.0) (2020-05-20)


### Features

* introduce static factory helper ([#442](https://www.github.com/googleapis/release-please/issues/442)) ([2f1e09c](https://www.github.com/googleapis/release-please/commit/2f1e09c4f2bf435f3a797aaa2c7afa8d03983617))

## [5.0.0](https://www.github.com/googleapis/release-please/compare/v4.2.2...v5.0.0) (2020-05-19)


### ⚠ BREAKING CHANGES

* dynamically load releasers in ./releasers directory (#439)

### Features

* return the release created by createRelease() ([#438](https://www.github.com/googleapis/release-please/issues/438)) ([a270337](https://www.github.com/googleapis/release-please/commit/a270337f8195359fb7ae869d3225ab38ae282ae9))
* simple version.txt releaser ([#436](https://www.github.com/googleapis/release-please/issues/436)) ([83e8165](https://www.github.com/googleapis/release-please/commit/83e8165b3dd78459a97c444878e69705e66bdcb8))


### Code Refactoring

* dynamically load releasers in ./releasers directory ([#439](https://www.github.com/googleapis/release-please/issues/439)) ([e3b13a9](https://www.github.com/googleapis/release-please/commit/e3b13a98d20856f506afdef634a808bdaf09ac08))

### [4.2.2](https://www.github.com/googleapis/release-please/compare/v4.2.1...v4.2.2) (2020-05-05)


### Bug Fixes

* **java:** logging message should not crash when there's no latestTag ([#424](https://www.github.com/googleapis/release-please/issues/424)) ([860c613](https://www.github.com/googleapis/release-please/commit/860c613cf770fe594536ca6ef89483982a8db502))
* don't include pre-release in latestTag calculation ([#427](https://www.github.com/googleapis/release-please/issues/427)) ([1ddb18a](https://www.github.com/googleapis/release-please/commit/1ddb18a5d38940fe5bcc6f73f520635bab0f6e9b))

### [4.2.1](https://www.github.com/googleapis/release-please/compare/v4.2.0...v4.2.1) (2020-04-29)


### Bug Fixes

* version should be passed to to cc.suggestBump ([#417](https://www.github.com/googleapis/release-please/issues/417)) ([878bebe](https://www.github.com/googleapis/release-please/commit/878bebe429530c42f45580cf79a0f1d2ecbcd8bb))

## [4.2.0](https://www.github.com/googleapis/release-please/compare/v4.1.1...v4.2.0) (2020-04-14)


### Features

* add Java BOM versioning strategy ([#407](https://www.github.com/googleapis/release-please/issues/407)) ([8a971cd](https://www.github.com/googleapis/release-please/commit/8a971cd5b65ddcda306eacdace1e2da8e6144548))

### [4.1.1](https://www.github.com/googleapis/release-please/compare/v4.1.0...v4.1.1) (2020-04-10)


### Bug Fixes

* stop parsing BREAKING CHANGE message after two newlines ([#404](https://www.github.com/googleapis/release-please/issues/404)) ([32d07cb](https://www.github.com/googleapis/release-please/commit/32d07cb00f455f50e877cc4050521be934d59718))

## [4.1.0](https://www.github.com/googleapis/release-please/compare/v4.0.3...v4.1.0) (2020-04-08)


### Features

* handle multiline bulleted commit messages ([#396](https://www.github.com/googleapis/release-please/issues/396)) ([670d872](https://www.github.com/googleapis/release-please/commit/670d872bebdb72fc6bd490caefdd3210a39ef64e))


### Bug Fixes

* **deps:** update dependency type-fest to ^0.13.0 ([#398](https://www.github.com/googleapis/release-please/issues/398)) ([09c5966](https://www.github.com/googleapis/release-please/commit/09c5966bbd1196f290ba65a7cb37517b770ebe78))
* don't sleep in test ([#395](https://www.github.com/googleapis/release-please/issues/395)) ([0e2c74e](https://www.github.com/googleapis/release-please/commit/0e2c74e9f6dd098b015cb85b8a6b919e0370d281))
* snapshots will now be taken from the latest commit ([#400](https://www.github.com/googleapis/release-please/issues/400)) ([274f852](https://www.github.com/googleapis/release-please/commit/274f8527d7ba7553daa41742d56ff55f0e21d1e8))

### [4.0.3](https://www.github.com/googleapis/release-please/compare/v4.0.2...v4.0.3) (2020-04-03)


### Bug Fixes

* **deps:** update dependency chalk to v4 ([#392](https://www.github.com/googleapis/release-please/issues/392)) ([a56ea70](https://www.github.com/googleapis/release-please/commit/a56ea70feb124d1db66f25327b8db291d4815351))
* continue using latestTag.sha as base; make delay actually work ([#394](https://www.github.com/googleapis/release-please/issues/394)) ([9e9acb0](https://www.github.com/googleapis/release-please/commit/9e9acb09e1dbdb2333007dba84ffc1fe25710298))

### [4.0.2](https://www.github.com/googleapis/release-please/compare/v4.0.1...v4.0.2) (2020-04-02)


### Bug Fixes

* **java:** fix git base sha for snapshot releases ([#388](https://www.github.com/googleapis/release-please/issues/388)) ([7e75f7f](https://www.github.com/googleapis/release-please/commit/7e75f7f3c91b08452262c1d2e3ce4218f607b3b7))
* delay snapshots temporarily ([#391](https://www.github.com/googleapis/release-please/issues/391)) ([77ba820](https://www.github.com/googleapis/release-please/commit/77ba820f08188f62578b2ed4bc435d46ba5ddf55))

### [4.0.1](https://www.github.com/googleapis/release-please/compare/v4.0.0...v4.0.1) (2020-03-27)


### Bug Fixes

* we were not compiling src/bin ([#384](https://www.github.com/googleapis/release-please/issues/384)) ([5d86054](https://www.github.com/googleapis/release-please/commit/5d86054ddfe13b2e9b13bed9f2a99235e21a5f47))

## [4.0.0](https://www.github.com/googleapis/release-please/compare/v3.3.0...v4.0.0) (2020-03-27)


### ⚠ BREAKING CHANGES

* upgrade octokit/gts/typescript (#381)

### Code Refactoring

* upgrade octokit/gts/typescript ([#381](https://www.github.com/googleapis/release-please/issues/381)) ([4e0bf11](https://www.github.com/googleapis/release-please/commit/4e0bf11b7f4217b5c6b8cd1aa9ea4db1bce06b89))

## [3.3.0](https://www.github.com/googleapis/release-please/compare/v3.2.3...v3.3.0) (2020-03-20)


### Features

* **python:** Add support to change version in setup.cfg ([#374](https://www.github.com/googleapis/release-please/issues/374)) ([4a9ef3d](https://www.github.com/googleapis/release-please/commit/4a9ef3dc7d846e3f0a137cc2ab89f843ab602355))

### [3.2.3](https://www.github.com/googleapis/release-please/compare/v3.2.2...v3.2.3) (2020-03-16)


### Bug Fixes

* handle additional content after release-as: footer ([#369](https://www.github.com/googleapis/release-please/issues/369)) ([dcdc054](https://www.github.com/googleapis/release-please/commit/dcdc054beb0ad0944e08bba41c5da6d36236a6cf))

### [3.2.2](https://www.github.com/googleapis/release-please/compare/v3.2.1...v3.2.2) (2020-02-13)


### Bug Fixes

* support changelog types for PHP components ([#359](https://www.github.com/googleapis/release-please/issues/359)) ([c73dc13](https://www.github.com/googleapis/release-please/commit/c73dc131041c8d6bfaa887ffb3144ed4f8e5415f))

### [3.2.1](https://www.github.com/googleapis/release-please/compare/v3.2.0...v3.2.1) (2020-02-12)


### Bug Fixes

* process label was causing PRs to be closed ([#358](https://www.github.com/googleapis/release-please/issues/358)) ([de3d557](https://www.github.com/googleapis/release-please/commit/de3d557c49dbded349a630fa6f5aa8cd5a2a2112))
* release version of library with up-to-date octokit deps ([#355](https://www.github.com/googleapis/release-please/issues/355)) ([b8709f1](https://www.github.com/googleapis/release-please/commit/b8709f1a89e1baedb74e86057b27ab70b62677f6))

## [3.2.0](https://www.github.com/googleapis/release-please/compare/v3.1.1...v3.2.0) (2020-02-03)


### Features

* include docs and chores in PHP releases and changelogs ([#352](https://www.github.com/googleapis/release-please/issues/352)) ([4dffd81](https://www.github.com/googleapis/release-please/commit/4dffd81c37afadd6b2c71f8502cc6227f260d1e3))

### [3.1.1](https://www.github.com/googleapis/release-please/compare/v3.1.0...v3.1.1) (2020-01-28)


### Bug Fixes

* in some cases prEdge.node.number can reference missing data ([#344](https://www.github.com/googleapis/release-please/issues/344)) ([26af55e](https://www.github.com/googleapis/release-please/commit/26af55ead9b4ca50b97492c5ecde7d57044ccf3e))

## [3.1.0](https://www.github.com/googleapis/release-please/compare/v3.0.0...v3.1.0) (2020-01-28)


### Features

* add releaser for Terraform modules ([#337](https://www.github.com/googleapis/release-please/issues/337)) ([b6cd7d4](https://www.github.com/googleapis/release-please/commit/b6cd7d4449bf920742f4e6bd2499482ddad91df5))

## [3.0.0](https://www.github.com/googleapis/release-please/compare/v2.16.2...v3.0.0) (2020-01-02)


### ⚠ BREAKING CHANGES

* add autorelease: tagged label when creating GitHub release (#329)

### Features

* add autorelease: tagged label when creating GitHub release ([#329](https://www.github.com/googleapis/release-please/issues/329)) ([0dd1c51](https://www.github.com/googleapis/release-please/commit/0dd1c516dba52f0a6312798d65b54db1c4844d59))


### Bug Fixes

* **python:** set initial version to 0.1.0 ([#325](https://www.github.com/googleapis/release-please/issues/325)) ([3fbfbdc](https://www.github.com/googleapis/release-please/commit/3fbfbdc278da828f1f7f2c275bfcf4bdbb611136))

### [2.16.2](https://www.github.com/googleapis/release-please/compare/v2.16.1...v2.16.2) (2019-12-16)


### Bug Fixes

* handle null prEdge.node.mergeCommit ([#313](https://www.github.com/googleapis/release-please/issues/313)) ([60d7616](https://www.github.com/googleapis/release-please/commit/60d76165de1b817624a39a028545faefa2790c48))
* **deps:** update dependency chalk to v3 ([#323](https://www.github.com/googleapis/release-please/issues/323)) ([f9a8ac4](https://www.github.com/googleapis/release-please/commit/f9a8ac4489cae24cef4655fe60aa82abc1fa8b50))
* **deps:** update dependency semver to v7 ([#324](https://www.github.com/googleapis/release-please/issues/324)) ([c46e63b](https://www.github.com/googleapis/release-please/commit/c46e63bba5213ae91a7cb117ada71ae167fc3bd8))
* **docs:** add jsdoc-region-tag plugin ([#314](https://www.github.com/googleapis/release-please/issues/314)) ([3874b23](https://www.github.com/googleapis/release-please/commit/3874b23a251c48dff28e0131258a175b476c6df9))

### [2.16.1](https://www.github.com/googleapis/release-please/compare/v2.16.0...v2.16.1) (2019-12-05)


### Bug Fixes

* **deps:** pin TypeScript below 3.7.0 ([#320](https://www.github.com/googleapis/release-please/issues/320)) ([c1c3818](https://www.github.com/googleapis/release-please/commit/c1c38181eeb80f6d8199dd6df739d5fcef386fd2))
* **deps:** update dependency yargs to v15 ([#317](https://www.github.com/googleapis/release-please/issues/317)) ([6526362](https://www.github.com/googleapis/release-please/commit/6526362c3b2a841ade2fceef62600a3082934588))

## [2.16.0](https://www.github.com/googleapis/release-please/compare/v2.15.0...v2.16.0) (2019-11-07)


### Features

* **logging:** add logging to track Java snapshot bug ([#307](https://www.github.com/googleapis/release-please/issues/307)) ([a072311](https://www.github.com/googleapis/release-please/commit/a072311c0d7913d6ec4bdbda6d40e423c5fa2a69))

## [2.15.0](https://www.github.com/googleapis/release-please/compare/v2.14.0...v2.15.0) (2019-11-04)


### Features

* update GoogleUtils.java ([#304](https://www.github.com/googleapis/release-please/issues/304)) ([e84d9e3](https://www.github.com/googleapis/release-please/commit/e84d9e30b8c293680da1e0cbe3d0475c91d0af81))

## [2.14.0](https://www.github.com/googleapis/release-please/compare/v2.13.0...v2.14.0) (2019-10-31)


### Features

* octokit passed to GitHub release now configurable ([#302](https://www.github.com/googleapis/release-please/issues/302)) ([9f02944](https://www.github.com/googleapis/release-please/commit/9f029441e5af00698b0ee348fd9b5e68535b5eaa))

## [2.13.0](https://www.github.com/googleapis/release-please/compare/v2.12.1...v2.13.0) (2019-10-28)


### Features

* add strategy for non-mono-repo Ruby releases ([#300](https://www.github.com/googleapis/release-please/issues/300)) ([8e71380](https://www.github.com/googleapis/release-please/commit/8e71380c4488897ba331b1621489563a1162af0f))

### [2.12.1](https://www.github.com/googleapis/release-please/compare/v2.12.0...v2.12.1) (2019-10-24)


### Bug Fixes

* **java:** handle version manifest snapshot release version ([#297](https://www.github.com/googleapis/release-please/issues/297)) ([623fde6](https://www.github.com/googleapis/release-please/commit/623fde60613a77992058a1dd48bbcf5605fe4356))

## [2.12.0](https://www.github.com/googleapis/release-please/compare/v2.11.0...v2.12.0) (2019-10-23)


### Features

* adds support for release-as footer ([#294](https://www.github.com/googleapis/release-please/issues/294)) ([7161339](https://www.github.com/googleapis/release-please/commit/71613396e6176d12a1fc2aca396a6c2984753e36))

## [2.11.0](https://www.github.com/googleapis/release-please/compare/v2.10.1...v2.11.0) (2019-10-17)


### Features

* populate packageName from package.json ([#290](https://www.github.com/googleapis/release-please/issues/290)) ([e9a01e7](https://www.github.com/googleapis/release-please/commit/e9a01e77a951dfad3cc33933bca1a676cc5377b8))

### [2.10.1](https://www.github.com/googleapis/release-please/compare/v2.10.0...v2.10.1) (2019-10-09)


### Bug Fixes

* **java:** snapshot bumps should not autorelease ([#282](https://www.github.com/googleapis/release-please/issues/282)) ([eaf048e](https://www.github.com/googleapis/release-please/commit/eaf048e))
* versions were not being updated in the root composer.json file ([#281](https://www.github.com/googleapis/release-please/issues/281)) ([85f056b](https://www.github.com/googleapis/release-please/commit/85f056b))

## [2.10.0](https://www.github.com/googleapis/release-please/compare/v2.9.0...v2.10.0) (2019-09-18)


### Features

* add initial support for Python libraries ([#270](https://www.github.com/googleapis/release-please/issues/270)) ([00eeb32](https://www.github.com/googleapis/release-please/commit/00eeb32))

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
