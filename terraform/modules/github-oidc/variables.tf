variable "github_repository" {
  description = "The GitHub repository (e.g., 'my-org/my-repo')"
  type        = string
}

variable "oidc_provider_url" {
  description = "The OIDC provider URL for GitHub"
  type        = string
  default     = "token.actions.githubusercontent.com"
}