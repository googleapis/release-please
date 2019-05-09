workflow "Mint Release" {
  on = "issue_comment"
  resolves = ["./.github/action/mint-release"]
}

action "./.github/action/mint-release" {
  uses = "./.github/action/mint-release"
  secrets = ["GITHUB_TOKEN"]
}
