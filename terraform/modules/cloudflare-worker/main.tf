# terraform/modules/cloudflare-worker/main.tf

# The worker script that will be deployed
# This resource only provisions the script if it doesn't exist in state
# Deployment is handled via wrangler for proper bundling
resource "cloudflare_workers_script" "frontend" {
  account_id  = var.cloudflare_account_id
  script_name = "viberatr-${var.environment == "ephemeral" ? var.prefix : var.environment}-frontend"

  # Use a placeholder script for initial provisioning
  # Actual deployment is handled by wrangler
  content = <<-EOT
    addEventListener('fetch', event => {
      event.respondWith(handleRequest(event.request))
    })

    async function handleRequest(request) {
      console.log('Happy test - worker initialized via Terraform')
      return new Response('Worker initialized successfully', {
        headers: { 'content-type': 'text/plain' }
      })
    }
  EOT

  compatibility_date = "2025-07-06"

  lifecycle {
    # Prevent Terraform from updating the content after initial creation
    # This allows wrangler to manage the actual script content
    ignore_changes = all
  }
}

# The route that triggers the worker (e.g., viberatr.io/*)
resource "cloudflare_workers_route" "frontend" {
  zone_id = var.cloudflare_zone_id
  pattern = "${var.cloudflare_worker_hostname}/*"
  script  = cloudflare_workers_script.frontend.script_name

  depends_on = [cloudflare_workers_script.frontend]
}

# The DNS record that points the hostname to Cloudflare's proxy
resource "cloudflare_dns_record" "frontend_a" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "141.101.64.0"
  type    = "A"
  proxied = true
  comment = "Managed by Terraform for viberatr Worker"
  ttl     = 1
}

resource "cloudflare_dns_record" "frontend_aaaa" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "AAAA"
  content = "2400:cb00::"
  proxied = true
  comment = "Managed by Terraform for viberatr Worker"
  ttl     = 1
}

resource "cloudflare_dns_record" "frontend_cname" {
  # Only create CNAME record for non-production environments
  count   = var.environment == "production" ? 0 : 1
  zone_id = var.cloudflare_zone_id
  name    = var.prefix
  type    = "CNAME"
  content = var.cloudflare_zone
  proxied = true
  comment = "Managed by Terraform for viberatr Worker"
  ttl     = 1
}
