exports['PackageLockJson updateContent v1 updates the package version 1'] = `
{
  "name": "release-please",
  "version": "14.0.0",
  "lockfileVersion": 1,
  "requires": true
}

`

exports['PackageLockJson updateContent v2 updates the package version 1'] = `
{
  "name": "release-please",
  "version": "14.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "release-please",
      "version": "14.0.0"
    }
  }
}

`

exports['PackageLockJson updateContent v3 monorepo updates the package version 1'] = `
{
  "name": "release-please",
  "version": "14.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "release-please",
      "version": "14.0.0"
    },
    "node_modules/release-please-foo": {
      "resolved": "packages/foo",
      "link": true
    },
    "node_modules/release-please-bar": {
      "resolved": "packages/bar",
      "link": true
    },
    "packages/foo": {
      "name": "release-please-foo",
      "version": "2.0.0",
      "dependencies": {
        "release-please-bar": "3.0.0"
      }
    },
    "packages/bar": {
      "name": "release-please-bar",
      "version": "3.0.0"
    }
  }
}

`

exports['PackageLockJson updateContent v3 updates the package version 1'] = `
{
  "name": "release-please",
  "version": "14.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "release-please",
      "version": "14.0.0"
    }
  }
}

`
