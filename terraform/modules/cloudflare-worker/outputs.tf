output "web_a_record_id" {
  description = "The ID of the A record for the web app (production only)."
  value       = var.environment == "production" ? cloudflare_dns_record.web_a[0].id : null
}

output "web_aaaa_record_id" {
  description = "The ID of the AAAA record for the web app (production only)."
  value       = var.environment == "production" ? cloudflare_dns_record.web_aaaa[0].id : null
}

output "web_cname_record_id" {
  description = "The ID of the CNAME record for the web app (non-production only)."
  value       = var.environment != "production" ? cloudflare_dns_record.web_cname[0].id : null
}

output "worker_script_name" {
  description = "The name of the deployed Worker script."
  value       = cloudflare_workers_script.web.script_name
}