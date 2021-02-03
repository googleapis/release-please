exports['GitHubRelease createRelease attempts to guess package name for release 1'] = {
  "tag_name": "v1.0.3",
  "body": "\n* entry",
  "name": "@google-cloud/foo v1.0.3",
  "draft": false
}

exports['GitHubRelease createRelease attempts to guess package name for release 2'] = {
  "labels": [
    "autorelease: tagged"
  ]
}

exports['GitHubRelease createRelease creates and labels release on GitHub 1'] = {
  "tag_name": "v1.0.3",
  "body": "\n* entry",
  "name": "foo v1.0.3",
  "draft": false
}

exports['GitHubRelease createRelease creates and labels release on GitHub 2'] = {
  "labels": [
    "autorelease: tagged"
  ]
}

exports['GitHubRelease createRelease supports submodules in nested folders 1'] = {
  "tag_name": "foo/v1.0.3",
  "body": "\n* entry",
  "name": "foo foo/v1.0.3",
  "draft": false
}

exports['GitHubRelease createRelease supports submodules in nested folders 2'] = {
  "labels": [
    "autorelease: tagged"
  ]
}

exports['GitHubRelease createRelease creates releases for submodule in monorepo 1'] = {
  "tag_name": "bigquery/v1.0.3",
  "body": "\n* entry",
  "name": "bigquery bigquery/v1.0.3",
  "draft": false
}

exports['GitHubRelease createRelease creates releases for submodule in monorepo 2'] = {
  "labels": [
    "autorelease: tagged"
  ]
}

exports['GitHubRelease createRelease attempts to guess package name for submodule release 1'] = {
  "tag_name": "@google-cloud/foo-v1.0.3",
  "body": "\n* entry",
  "name": "@google-cloud/foo @google-cloud/foo-v1.0.3",
  "draft": false
}

exports['GitHubRelease createRelease attempts to guess package name for submodule release 2'] = {
  "labels": [
    "autorelease: tagged"
  ]
}

exports['GitHubRelease createRelease creates a draft release 1'] = {
  "tag_name": "v1.0.3",
  "body": "\n* entry",
  "name": "foo v1.0.3",
  "draft": true
}

exports['GitHubRelease createRelease creates a draft release 2'] = {
  "labels": [
    "autorelease: tagged"
  ]
}
