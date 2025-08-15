module "app_worker" {
  source = "./modules/cloudflare-worker"
  providers = {
    cloudflare = cloudflare
  }

  prefix                     = local.prefix
  environment                = var.environment
  cloudflare_account_id      = var.cloudflare_account_id
  cloudflare_zone_id         = var.cloudflare_zone_id
  cloudflare_zone            = var.cloudflare_zone
  cloudflare_worker_hostname = local.domain
  app_name                   = var.app_name
  worker_name               = local.worker_name
}