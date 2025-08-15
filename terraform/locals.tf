locals {
  prefix = var.environment == "ephemeral" && var.pr_number != null ? "pr-${var.pr_number}" : var.environment == "production" || var.environment == "production-alt" ? "prod" : "dev"
  domain = var.environment == "production" || var.environment == "production-alt" ? var.cloudflare_zone : "${local.prefix}.${var.cloudflare_zone}"
  
  # Use app_name variable for resource naming
  worker_name = "${var.app_name}-${var.environment == "ephemeral" ? local.prefix : var.environment}-web"
}