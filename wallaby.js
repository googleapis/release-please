module.exports = wallaby => {
  const path = require('path');

  process.env.NODE_PATH +=
    path.delimiter + path.join(wallaby.projectCacheDir, 'src');

  return {
    autoDetect: false,
    files: [
      'src/**/*.ts',
      {pattern: 'package.json', instrument: false},
      {pattern: 'test/**/*.json', instrument: false},
      {pattern: 'test/**/fixtures/**/*', instrument: false},
      {pattern: '__snapshots__/**/*', instrument: false},
    ],
    tests: ['test/**/*.ts'],
    env: {
      type: 'node',
      runner: 'node',
      params: {
        env: 'INFO=nock.*',
      },
    },

    testFramework: 'mocha',

    compilers: {
      '**/*.ts': wallaby.compilers.typeScript(),
    },

    setup: wallaby => {
      const mocha = wallaby.testFramework;

      const sinon = require('sinon');

      // setup sinon hooks
      mocha.suite.beforeEach('sinon before', function () {
        if (null === this.sinon) {
          this.sinon = sinon.createSandbox();
        }
      });
      mocha.suite.afterEach('sinon after', function () {
        if (this.sinon && 'function' === typeof this.sinon.restore) {
          this.sinon.restore();
        }
      });

      global.expect = require('chai').expect;
    },

    workers: {recycle: true},
    debug: false,
  };
};
