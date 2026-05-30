variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "lambda_execution_role_arn" {
  type = string
}

variable "lambda_zip_path" {
  type        = string
  description = "Path to health Lambda bundle (relative to module or absolute)"
}

variable "me_lambda_zip_path" {
  type        = string
  description = "Path to me Lambda bundle"
}

variable "cognito_issuer" {
  type = string
}

variable "cognito_audience" {
  type = string
}

variable "cors_allow_origins" {
  type = list(string)
}

variable "throttle_burst_limit" {
  type    = number
  default = 100
}

variable "throttle_rate_limit" {
  type    = number
  default = 50
}

variable "tags" {
  type    = map(string)
  default = {}
}
