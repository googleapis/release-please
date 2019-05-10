workflow "Mint Release" {
  on = "issue_comment"
  resolves = ["./.github/action/mint-release"]
}

action "./.github/action/mint-release" {
  uses = "./.github/action/mint-release"
  env = {
    ORGS_ACL = "GoogleCloudPlatform,google"
  }
  secrets = ["GITHUB_TOKEN"]
}

workflow "Candidate Issue" {
  on = "schedule(*/15 * * * *)"
  resolves = ["./.github/action/candidate-issue"]
}

action "./.github/action/candidate-issue" {
  uses = "./.github/action/candidate-issue"
  secrets = ["GITHUB_TOKEN"]
}
