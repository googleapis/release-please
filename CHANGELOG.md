# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/release-please?activeTab=versions

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
