# Global variables will be defined here.

variable "environment" {
  description = "The deployment environment (e.g., 'production', 'development', 'ephemeral')."
  type        = string
}

variable "cloudflare_api_token" {
  description = "The API token for the Cloudflare account."
  type        = string
}

variable "cloudflare_account_id" {
  description = "The Cloudflare account ID."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "The Cloudflare Zone ID for the domain."
  type        = string
}

variable "cloudflare_zone" {
  description = "The Cloudflare Zone name for the domain (e.g., 'vibechecc.app')."
  type        = string
}

variable "pr_number" {
  description = "The pull request number for the ephemeral environment. This is used to create a unique domain for the ephemeral environment."
  type        = string
  default     = null
}