exports['BunLock updateContent monorepo updates workspace versions 1'] = `
{
  "lockfileVersion": 1,
  "configVersion": 1,
  "workspaces": {
    "": {
      "name": "release-please",
      "version": "14.0.0",
    },
    "packages/foo": {
      "name": "release-please-foo",
      "version": "2.0.0",
      "dependencies": {
        "release-please-bar": "workspace:*",
      },
    },
    "packages/bar": {
      "name": "release-please-bar",
      "version": "3.0.0",
    },
  },
}

`
