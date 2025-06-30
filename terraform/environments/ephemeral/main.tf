terraform {
  backend "s3" {
    # These will be replaced by the CI/CD pipeline
    bucket         = "vibechecc-terraform-state-ephemeral-${var.pr_number}"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "vibechecc-terraform-state-lock-ephemeral-${var.pr_number}"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

module "github_oidc" {
  source            = "../../modules/github-oidc"
  github_repository = var.github_repository
}

module "amplify" {
  source      = "../../modules/amplify"
  app_name    = "vibechecc-pr-${var.pr_number}"
  repository  = "https://github.com/${var.github_repository}"
  oauth_token = var.amplify_oauth_token
}
