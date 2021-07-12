# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/release-please?activeTab=versions

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
