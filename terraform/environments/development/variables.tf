variable "github_repository" {
  description = "The GitHub repository (e.g., 'my-org/my-repo')"
  type        = string
  default     = "your-github-org/your-repo"
}

variable "amplify_oauth_token" {
  description = "The GitHub OAuth token for Amplify"
  type        = string
  sensitive   = true
}
