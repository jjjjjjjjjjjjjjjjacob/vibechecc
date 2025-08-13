output "frontend_a_record_id" {
  description = "The ID of the A record for the frontend (production only)."
  value       = var.environment == "production" ? cloudflare_dns_record.frontend_a[0].id : null
}

output "frontend_aaaa_record_id" {
  description = "The ID of the AAAA record for the frontend (production only)."
  value       = var.environment == "production" ? cloudflare_dns_record.frontend_aaaa[0].id : null
}

output "frontend_cname_record_id" {
  description = "The ID of the CNAME record for the frontend (non-production only)."
  value       = var.environment != "production" ? cloudflare_dns_record.frontend_cname[0].id : null
}

output "worker_script_name" {
  description = "The name of the deployed Worker script."
  value       = cloudflare_workers_script.web.script_name
}