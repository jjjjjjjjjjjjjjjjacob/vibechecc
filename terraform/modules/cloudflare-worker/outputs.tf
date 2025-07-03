output "frontend_a_record_id" {
  description = "The ID of the A record for the frontend."
  value       = cloudflare_dns_record.frontend_a.id
}

output "frontend_aaaa_record_id" {
  description = "The ID of the AAAA record for the frontend."
  value       = cloudflare_dns_record.frontend_aaaa.id
}