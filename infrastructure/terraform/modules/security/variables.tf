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
