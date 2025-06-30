# terraform/modules/cloudflare-worker/main.tf

# The Cloudflare Worker script resource
resource "cloudflare_worker_script" "main" {
  account_id = var.cloudflare_account_id
  name       = "vibechecc-${var.environment}" # e.g., vibechecc-production

  # The content is deployed via CI/CD, so we use a placeholder
  content = "export default { fetch: () => new Response('worker placeholder') };"

  nodejs_compat_v2_enabled = true

  # Pass secrets and variables to the worker
  # Note: We will add secret_text_binding and plain_text_binding here later
}

# The route that triggers the worker (e.g., vibechecc.app/*)
resource "cloudflare_worker_route" "main" {
  zone_id     = var.cloudflare_zone_id
  pattern     = var.worker_hostname == var.zone_name ? "${var.worker_hostname}/*" : var.worker_hostname
  script_name = cloudflare_worker_script.main.name
}

# The DNS record that points the hostname to Cloudflare's proxy
resource "cloudflare_record" "main" {
  zone_id = var.cloudflare_zone_id
  name    = var.worker_hostname == var.zone_name ? "@" : split(".", var.worker_hostname)[0] # Use '@' for root domain
  value   = "192.0.2.1" # Placeholder IP for proxied CNAME-like behavior
  type    = "A"
  proxied = true
  comment = "Managed by Terraform for Vibechek Worker"
}
