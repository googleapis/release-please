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
