variable "name_prefix" {
  type = string
}

variable "environment" {
  type = string
}

variable "callback_urls" {
  type        = list(string)
  description = "OAuth callback URLs for the app client"
}

variable "logout_urls" {
  type        = list(string)
  description = "Sign-out redirect URLs"
}

variable "enable_oauth" {
  type        = bool
  default     = false
  description = "Enable social IdPs (deferred Phase 1)"
}

variable "tags" {
  type    = map(string)
  default = {}
}
