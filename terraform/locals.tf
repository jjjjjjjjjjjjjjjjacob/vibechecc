locals {
  prefix = var.environment == "ephemeral" && var.pr_number != null ? "pr-${var.pr_number}" : var.environment == "production" ? "prod" : "dev"
  domain = var.environment == "production" ? var.cloudflare_zone : "${local.prefix}.${var.cloudflare_zone}"
}