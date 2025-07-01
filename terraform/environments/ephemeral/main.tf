terraform {
  backend "s3" {
    # Cloudflare R2 (S3-compatible) backend for ephemeral environments
    # These will be configured by the CI/CD pipeline
    bucket                      = "vibechecc-terraform-state"
    key                         = "ephemeral/pr-${var.pr_number}/terraform.tfstate"
    region                      = "auto"
    endpoint                    = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_metadata_api_check     = true
  }
}

# Configure the Cloudflare provider
provider "cloudflare" {}

module "vibechecc_worker" {
  source = "../../modules/cloudflare-worker"

  environment         = "ephemeral"
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id  = var.cloudflare_zone_id
  zone_name           = "vibechecc.app"
  worker_hostname     = "pr-${var.pr_number}.vibechecc.app"
}
