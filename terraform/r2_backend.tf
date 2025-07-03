# This file defines the Cloudflare R2 bucket that will be used for storing
# the Terraform state itself. We will initially run this with a local backend
# to create the bucket, and then re-configure the backend to use R2.

terraform {
  backend "s3" {
    region                      = "auto"
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}
    