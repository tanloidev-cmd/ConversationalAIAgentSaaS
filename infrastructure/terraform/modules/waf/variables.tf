variable "name_prefix" {
  type = string
}

variable "api_arn" {
  type = string
}

variable "enabled" {
  type        = bool
  default     = false
  description = "Enable WAF association (off for dev)"
}

variable "rate_limit" {
  type    = number
  default = 2000
}

variable "tags" {
  type    = map(string)
  default = {}
}
