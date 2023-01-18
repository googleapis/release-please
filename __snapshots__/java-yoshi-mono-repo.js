exports['JavaYoshi buildUpdates does not update changelog.json if no artifacts matched in artifact-map.json 1'] = `
{"entries":[]}
`

exports['JavaYoshi buildUpdates updates changelog.json 1'] = `
{
  "entries": [
    {
      "changes": [
        {
          "type": "fix",
          "sha": "845db1381b3d5d20151cad2588f85feb",
          "message": "update dependency com.google.cloud:google-cloud-storage to v1.120.0",
          "scope": "deps"
        }
      ],
      "version": "0.1.0",
      "language": "JAVA",
      "artifactName": "cloud.google.com/foo",
      "id": "abc-123-efd-qwerty",
      "createTime": "2023-01-05T16:42:33.446Z"
    }
  ],
  "updateTime": "2023-01-05T16:42:33.446Z"
}
`
