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
