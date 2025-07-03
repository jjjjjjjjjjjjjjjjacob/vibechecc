# This file provisions providers for the terraform configuration.

# This is the provider for the Cloudflare API.
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
