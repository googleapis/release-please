workflow "Candidate Issue" {
  on = "schedule(*/5 * * * *)"
  resolves = ["./.github/action/candidate-issue"]
}

action "./.github/action/candidate-issue" {
  uses = "googleapis/release-please/.github/action/candidate-issue@master"
  env = {
    PACKAGE_NAME = "release-please"
  }
  secrets = ["GITHUB_TOKEN"]
}
