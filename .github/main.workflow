workflow "Candidate Issue" {
  on = "schedule(*/8 * * * *)"
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

workflow "Detect Checked" {
  on = "schedule(*/4 * * * *)"
  resolves = ["detect-checked"]
}

action "detect-checked" {
  uses = "googleapis/release-please/.github/action/release-please@master"
  env = {
    PACKAGE_NAME = "release-please"
    RELEASE_PLEASE_COMMAND = "detect-checked"
  }
  secrets = ["GITHUB_TOKEN"]
}
