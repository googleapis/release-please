exports['README.md updateContent updates version in README.md 1'] = `
# Terraform Module

## Usage

\`\`\`hcl
module "vpc" {
    source  = "terraform-google-modules/mine/google"
    version = "~> 2.1"
}
\`\`\`

`
