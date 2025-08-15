# terraform/modules/cloudflare-worker/main.tf

# The worker script that will be deployed
# This resource only provisions the script if it doesn't exist in state
# Deployment is handled via wrangler for proper bundling
resource "cloudflare_workers_script" "web" {
  account_id  = var.cloudflare_account_id
  script_name = var.worker_name

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

# The route that triggers the worker (e.g., vibechecc.io/*)
resource "cloudflare_workers_route" "web" {
  zone_id = var.cloudflare_zone_id
  pattern = "${var.cloudflare_worker_hostname}/*"
  script  = cloudflare_workers_script.web.script_name

  depends_on = [cloudflare_workers_script.web]
}

# The DNS record that points the hostname to Cloudflare's proxy
# A and AAAA records are only created for production (root domain)
resource "cloudflare_dns_record" "web_a" {
  count   = var.environment == "production" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "192.0.2.1" # Cloudflare's anycast IP for Workers
  type    = "A"
  proxied = true
  comment = "Managed by Terraform for ${var.app_name} Worker"
  ttl     = 1
}

resource "cloudflare_dns_record" "web_aaaa" {
  count   = var.environment == "production" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "AAAA"
  content = "100::" # Cloudflare's anycast IPv6 for Workers
  proxied = true
  comment = "Managed by Terraform for ${var.app_name} Worker"
  ttl     = 1
}

# CNAME record for non-production environments (dev, ephemeral)
resource "cloudflare_dns_record" "web_cname" {
  count   = var.environment != "production" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = var.prefix
  type    = "CNAME"
  content = var.cloudflare_zone
  proxied = true
  comment = "Managed by Terraform for ${var.app_name} Worker"
  ttl     = 1
}
