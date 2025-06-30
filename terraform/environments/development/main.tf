# terraform/environments/development/main.tf

# Configure the Cloudflare provider
provider "cloudflare" {}

# Configure the Terraform backend to use R2 for state storage
terraform {
  backend "s3" {
    # We will configure this later after creating the bucket
  }
}

module "vibechecc_worker" {
  source = "../../modules/cloudflare-worker"

  environment         = "development"
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id  = var.cloudflare_zone_id
  zone_name           = "vibechecc.app"
  worker_hostname     = "dev.vibechecc.app"
}
