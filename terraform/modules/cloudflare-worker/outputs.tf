# terraform/modules/cloudflare-worker/outputs.tf

output "worker_url" {
  description = "The final URL of the deployed worker."
  value       = "https://${var.worker_hostname}"
}

output "worker_name" {
  description = "The name of the Cloudflare worker script."
  value       = cloudflare_worker_script.main.name
}
