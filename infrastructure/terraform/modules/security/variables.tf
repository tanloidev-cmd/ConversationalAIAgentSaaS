variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "github_repository" {
  type        = string
  description = "GitHub repo in org/name form for OIDC trust"
  default     = ""
}

variable "secrets_backend" {
  type        = string
  description = "secrets_manager (rotation-ready) or ssm (Parameter Store Standard SecureString, no storage fee)"
  default     = "secrets_manager"

  validation {
    condition     = contains(["secrets_manager", "ssm"], var.secrets_backend)
    error_message = "secrets_backend must be secrets_manager or ssm"
  }
}

variable "use_customer_managed_kms" {
  type        = bool
  description = "When secrets_backend is secrets_manager, encrypt with a dedicated CMK (~$1/mo); otherwise use the AWS-managed Secrets Manager key"
  default     = false
}
