# This file declares the versions of the providers that are used in the
# terraform configuration.

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }
}
