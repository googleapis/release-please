workflow "Candidate Issue" {
  on = "schedule(*/5 * * * *)"
  resolves = ["candidate-issue"]
}

action "candidate-issue" {
  uses = "googleapis/release-please/.github/action/release-please@master"
  env = {
    PACKAGE_NAME = "release-please"
    RELEASE_PLEASE_COMMAND = "candidate-issue"
  }
  secrets = ["GITHUB_TOKEN"]
}
