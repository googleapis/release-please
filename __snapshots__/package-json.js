exports['PackageJson updateContent does not update peer dependencies by default 1'] = `
{
\t"name": "yargs-parser",
\t"version": "14.0.0",
\t"description": "the mighty option parser used by yargs",
\t"main": "index.js",
\t"scripts": {
\t\t"test": "nyc mocha test/*.js",
\t\t"posttest": "standard",
\t\t"coverage": "nyc report --reporter=text-lcov | coveralls",
\t\t"release": "standard-version"
\t},
\t"repository": {
\t\t"url": "git@github.com:yargs/yargs-parser.git"
\t},
\t"keywords": [
\t\t"argument",
\t\t"parser",
\t\t"yargs",
\t\t"command",
\t\t"cli",
\t\t"parsing",
\t\t"option",
\t\t"args",
\t\t"argument"
\t],
\t"author": "Ben Coe <ben@npmjs.com>",
\t"license": "ISC",
\t"devDependencies": {
\t\t"chai": "^4.2.1",
\t\t"coveralls": "^3.0.2",
\t\t"mocha": "^5.2.0",
\t\t"nyc": "^13.0.1",
\t\t"standard": "^12.0.1"
\t},
\t"dependencies": {
\t\t"camelcase": "^6.0.0",
\t\t"decamelize": "^1.2.0"
\t},
\t"optionalDependencies": {
\t\t"foo": "~0.1.0"
\t},
\t"peerDependencies": {
\t\t"bar": ">= 1.0.0"
\t},
\t"files": [
\t\t"lib",
\t\t"index.js"
\t],
\t"engine": {
\t\t"node": ">=6"
\t}
}

`

exports['PackageJson updateContent does not update versions of dependencies that are protocols 1'] = `
{
\t"name": "yargs-parser",
\t"version": "14.0.0",
\t"description": "the mighty option parser used by yargs",
\t"main": "index.js",
\t"scripts": {
\t\t"test": "nyc mocha test/*.js",
\t\t"posttest": "standard",
\t\t"coverage": "nyc report --reporter=text-lcov | coveralls",
\t\t"release": "standard-version"
\t},
\t"repository": {
\t\t"url": "git@github.com:yargs/yargs-parser.git"
\t},
\t"keywords": [
\t\t"argument",
\t\t"parser",
\t\t"yargs",
\t\t"command",
\t\t"cli",
\t\t"parsing",
\t\t"option",
\t\t"args",
\t\t"argument"
\t],
\t"author": "Ben Coe <ben@npmjs.com>",
\t"license": "ISC",
\t"devDependencies": {
\t\t"chai": "^4.2.0",
\t\t"coveralls": "^3.0.2",
\t\t"mocha": "^5.2.0",
\t\t"nyc": "workspace:*",
\t\t"standard": "link:../standard"
\t},
\t"dependencies": {
\t\t"camelcase": "^5.0.0",
\t\t"decamelize": "portal:../decamelize"
\t},
\t"optionalDependencies": {
\t\t"foo": "~0.1.0"
\t},
\t"peerDependencies": {
\t\t"bar": "workspace:^"
\t},
\t"files": [
\t\t"lib",
\t\t"index.js"
\t],
\t"engine": {
\t\t"node": ">=6"
\t}
}

`

exports['PackageJson updateContent updates dependency versions 1'] = `
{
\t"name": "yargs-parser",
\t"version": "14.0.0",
\t"description": "the mighty option parser used by yargs",
\t"main": "index.js",
\t"scripts": {
\t\t"test": "nyc mocha test/*.js",
\t\t"posttest": "standard",
\t\t"coverage": "nyc report --reporter=text-lcov | coveralls",
\t\t"release": "standard-version"
\t},
\t"repository": {
\t\t"url": "git@github.com:yargs/yargs-parser.git"
\t},
\t"keywords": [
\t\t"argument",
\t\t"parser",
\t\t"yargs",
\t\t"command",
\t\t"cli",
\t\t"parsing",
\t\t"option",
\t\t"args",
\t\t"argument"
\t],
\t"author": "Ben Coe <ben@npmjs.com>",
\t"license": "ISC",
\t"devDependencies": {
\t\t"chai": "^4.2.1",
\t\t"coveralls": "^3.0.2",
\t\t"mocha": "^5.2.0",
\t\t"nyc": "^13.0.1",
\t\t"standard": "^12.0.1"
\t},
\t"dependencies": {
\t\t"camelcase": "^6.0.0",
\t\t"decamelize": "^1.2.0"
\t},
\t"optionalDependencies": {
\t\t"foo": "~0.1.0"
\t},
\t"peerDependencies": {
\t\t"bar": ">=2.3.4"
\t},
\t"files": [
\t\t"lib",
\t\t"index.js"
\t],
\t"engine": {
\t\t"node": ">=6"
\t}
}

`

exports['PackageJson updateContent updates the package version 1'] = `
{
\t"name": "yargs-parser",
\t"version": "14.0.0",
\t"description": "the mighty option parser used by yargs",
\t"main": "index.js",
\t"scripts": {
\t\t"test": "nyc mocha test/*.js",
\t\t"posttest": "standard",
\t\t"coverage": "nyc report --reporter=text-lcov | coveralls",
\t\t"release": "standard-version"
\t},
\t"repository": {
\t\t"url": "git@github.com:yargs/yargs-parser.git"
\t},
\t"keywords": [
\t\t"argument",
\t\t"parser",
\t\t"yargs",
\t\t"command",
\t\t"cli",
\t\t"parsing",
\t\t"option",
\t\t"args",
\t\t"argument"
\t],
\t"author": "Ben Coe <ben@npmjs.com>",
\t"license": "ISC",
\t"devDependencies": {
\t\t"chai": "^4.2.0",
\t\t"coveralls": "^3.0.2",
\t\t"mocha": "^5.2.0",
\t\t"nyc": "^13.0.1",
\t\t"standard": "^12.0.1"
\t},
\t"dependencies": {
\t\t"camelcase": "^5.0.0",
\t\t"decamelize": "^1.2.0"
\t},
\t"files": [
\t\t"lib",
\t\t"index.js"
\t],
\t"engine": {
\t\t"node": ">=6"
\t}
}

`
