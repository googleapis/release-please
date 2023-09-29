exports['SamplesPackageJson updateContent does not fail when top level package does not exist in dependencies 1'] = `
{
  "name": "@google-cloud/firestore-samples",
  "version": "0.0.1",
  "private": true,
  "license": "Apache-2.0",
  "author": "Google Inc.",
  "repository": "googleapis/nodejs-firestore",
  "engines": {
    "node": ">=8"
  },
  "scripts": {
    "test": "mocha system-test/*.js --timeout 600000"
  },
  "devDependencies": {
    "mocha": "^6.0.0"
  }
}

`

exports['SamplesPackageJson updateContent updates package version in dependencies 1'] = `
{
  "name": "@google-cloud/firestore-samples",
  "version": "0.0.1",
  "private": true,
  "license": "Apache-2.0",
  "author": "Google Inc.",
  "repository": "googleapis/nodejs-firestore",
  "engines": {
    "node": ">=8"
  },
  "scripts": {
    "test": "mocha system-test/*.js --timeout 600000"
  },
  "dependencies": {
    "@google-cloud/firestore": "^14.0.0"
  },
  "devDependencies": {
    "mocha": "^6.0.0"
  }
}

`
