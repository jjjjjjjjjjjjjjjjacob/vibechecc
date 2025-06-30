variable "secret_name" {
  description = "The name of the secret"
  type        = string
}

variable "secret_string" {
  description = "The value of the secret"
  type        = string
  sensitive   = true
}