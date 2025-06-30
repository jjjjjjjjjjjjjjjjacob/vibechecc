# terraform/modules/cloudflare-worker/variables.tf

variable "environment" {
  description = "The deployment environment (e.g., 'production', 'development')."
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

variable "zone_name" {
  description = "The root domain name (e.g., 'vibechecc.app')."
  type        = string
}

variable "worker_hostname" {
  description = "The full hostname for the worker (e.g., 'vibechecc.app' or 'dev.vibechecc.app')."
  type        = string
}
