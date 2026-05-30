variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "tags" {
  type = map(string)
  default = {
    ManagedBy = "terraform"
  }
}

variable "github_repository" {
  type        = string
  description = "org/repo for GitHub OIDC deploy role"
  default     = ""
}

variable "cognito_callback_urls" {
  type    = list(string)
  default = ["http://localhost:3000/callback"]
}

variable "cognito_logout_urls" {
  type    = list(string)
  default = ["http://localhost:3000"]
}

variable "enable_oauth" {
  type    = bool
  default = false
}

variable "cors_allow_origins" {
  type    = list(string)
  default = ["http://localhost:3000"]
}

variable "api_throttle_burst_limit" {
  type    = number
  default = 100
}

variable "api_throttle_rate_limit" {
  type    = number
  default = 50
}

variable "waf_enabled" {
  type    = bool
  default = false
}

variable "waf_rate_limit" {
  type    = number
  default = 2000
}

variable "enable_cloudwatch_dashboard" {
  type        = bool
  description = "Create CloudWatch overview dashboard (off by default in dev to avoid cost)"
  default     = false
}

variable "secrets_backend" {
  type        = string
  description = "secrets_manager or ssm (Parameter Store Standard SecureString, free tier storage)"
  default     = "ssm"

  validation {
    condition     = contains(["secrets_manager", "ssm"], var.secrets_backend)
    error_message = "secrets_backend must be secrets_manager or ssm"
  }
}

variable "use_customer_managed_kms" {
  type        = bool
  description = "Use a dedicated CMK for Secrets Manager (~$1/mo); false uses the AWS-managed Secrets Manager key"
  default     = false
}
