exports['changelog.json adds latest release to front of list 1'] = `
[
  {
    "version": "14.0.0",
    "artifact_name": "foo-artifact",
    "id": "abc-123-efd-qwerty",
    "breaking_change_notes": [],
    "changes": [
      {
        "type": "feat",
        "scope": null,
        "sha": "81228f3507ad6f742242474628ff58b2",
        "message": "feat: some feature"
      },
      {
        "type": "fix",
        "scope": null,
        "sha": "26fff5655027c8e7b799cb450acca568",
        "message": "fix: some bugfix"
      },
      {
        "type": "docs",
        "scope": null,
        "sha": "abbf5480ac552b33404be825a817df2a",
        "message": "docs: some documentation"
      }
    ]
  },
  {},
  {}
]
`

exports['changelog.json appends new release to empty changelog 1'] = `
[
  {
    "version": "14.0.0",
    "artifact_name": "foo-artifact",
    "id": "abc-123-efd-qwerty",
    "breaking_change_notes": [
      "some bugfix",
      "perf: some documentation"
    ],
    "changes": [
      {
        "type": "feat",
        "scope": null,
        "sha": "81228f3507ad6f742242474628ff58b2",
        "message": "feat: some feature"
      },
      {
        "type": "fix",
        "scope": null,
        "sha": "05670cf2e850beffe53bb2691f8701c7",
        "message": "fix!: some bugfix"
      },
      {
        "type": "docs",
        "scope": "perf",
        "sha": "e0a7c3eb307bdca5f9d4c991c82338da",
        "message": "docs(perf)!: some documentation"
      }
    ]
  }
]
`
