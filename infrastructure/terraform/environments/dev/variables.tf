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
