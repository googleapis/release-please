exports['PackageJson updateContent updates the package version 1'] = `
{
  "name": "yargs-parser",
  "version": "14.0.0",
  "description": "the mighty option parser used by yargs",
  "main": "index.js",
  "scripts": {
    "test": "nyc mocha test/*.js",
    "posttest": "standard",
    "coverage": "nyc report --reporter=text-lcov | coveralls",
    "release": "standard-version"
  },
  "repository": {
    "url": "git@github.com:yargs/yargs-parser.git"
  },
  "keywords": [
    "argument",
    "parser",
    "yargs",
    "command",
    "cli",
    "parsing",
    "option",
    "args",
    "argument"
  ],
  "author": "Ben Coe <ben@npmjs.com>",
  "license": "ISC",
  "devDependencies": {
    "chai": "^4.2.0",
    "coveralls": "^3.0.2",
    "mocha": "^5.2.0",
    "nyc": "^13.0.1",
    "standard": "^12.0.1",
    "standard-version": "^4.4.0"
  },
  "dependencies": {
    "camelcase": "^5.0.0",
    "decamelize": "^1.2.0"
  },
  "files": [
    "lib",
    "index.js"
  ],
  "engine": {
    "node": ">=6"
  }
}

`;
