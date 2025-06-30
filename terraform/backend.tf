# This file defines the Cloudflare R2 bucket that will be used for storing
# the Terraform state itself. We will initially run this with a local backend
# to create the bucket, and then re-configure the backend to use R2.

resource "cloudflare_r2_bucket" "terraform_state" {
  # The account ID will be provided via a variable
  account_id = var.cloudflare_account_id
  name       = "vibechecc-terraform-state"
  location   = "auto"
}

# Output the bucket name for reference
output "terraform_state_bucket_name" {
  value = cloudflare_r2_bucket.terraform_state.name
}