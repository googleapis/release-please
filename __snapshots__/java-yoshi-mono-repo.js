exports['JavaYoshiMonoRepo buildUpdates does not update changelog.json if no .repo-metadata.json is found 1'] = `
{"entries":[]}
`

exports['JavaYoshiMonoRepo buildUpdates omits non-breaking chores from changelog.json 1'] = `
{
  "entries": [
    {
      "changes": [
        {
          "type": "fix",
          "sha": "845db1381b3d5d20151cad2588f85feb",
          "message": "update dependency com.google.cloud:google-cloud-storage to v1.120.0",
          "issues": [],
          "scope": "deps"
        },
        {
          "type": "chore",
          "sha": "b3f8966b023b8f21ce127142aa91841c",
          "message": "update a very important dep",
          "issues": [],
          "breakingChangeNote": "update a very important dep"
        }
      ],
      "version": "0.0.1",
      "language": "JAVA",
      "artifactName": "cloud.google.com:foo",
      "id": "abc-123-efd-qwerty",
      "createTime": "2023-01-05T16:42:33.446Z"
    }
  ],
  "updateTime": "2023-01-05T16:42:33.446Z"
}
`

exports['JavaYoshiMonoRepo buildUpdates updates changelog.json 1'] = `
{
  "entries": [
    {
      "changes": [
        {
          "type": "fix",
          "sha": "845db1381b3d5d20151cad2588f85feb",
          "message": "update dependency com.google.cloud:google-cloud-storage to v1.120.0",
          "issues": [],
          "scope": "deps"
        }
      ],
      "version": "0.0.1",
      "language": "JAVA",
      "artifactName": "cloud.google.com:foo",
      "id": "abc-123-efd-qwerty",
      "createTime": "2023-01-05T16:42:33.446Z"
    }
  ],
  "updateTime": "2023-01-05T16:42:33.446Z"
}
`
