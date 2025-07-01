variable "cloudflare_account_id" {
  description = "The Cloudflare account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "The Cloudflare Zone ID for the domain"
  type        = string
}

variable "pr_number" {
  description = "The pull request number for the ephemeral environment"
  type        = string
}
