workflow "Candidate Issue" {
  on = "schedule(*/5 * * * *)"
  resolves = ["./.github/action/candidate-issue"]
}

action "./.github/action/candidate-issue" {
  uses = "./.github/action/candidate-issue"
  env = {
    PACKAGE_NAME = "release-please"
  }
  secrets = ["GITHUB_TOKEN"]
}
