exports['Node buildReleasePullRequest updates changelog.json if present 1'] = `
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
        },
        {
          "type": "fix",
          "sha": "08ca01180a91c0a1ba8992b491db9212",
          "message": "update dependency com.google.cloud:google-cloud-spanner to v1.50.0",
          "issues": [],
          "scope": "deps"
        }
      ],
      "version": "0.0.1",
      "language": "JAVASCRIPT",
      "artifactName": "node-test-repo",
      "id": "abc-123-efd-qwerty",
      "createTime": "2023-01-05T16:42:33.446Z"
    }
  ],
  "updateTime": "2023-01-05T16:42:33.446Z"
}
`
