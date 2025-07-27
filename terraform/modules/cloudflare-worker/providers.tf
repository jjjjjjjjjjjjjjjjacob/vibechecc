# This file provisions providers for the terraform configuration.

# This is the provider for the Cloudflare API.
terraform {
  required_providers {
    cloudflare = {
      source                = "cloudflare/cloudflare"
      version               = "~> 5"
      configuration_aliases = [cloudflare]
    }
  }
}
