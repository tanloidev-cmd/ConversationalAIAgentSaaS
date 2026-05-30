variable "name_prefix" {
  type = string
}

variable "api_id" {
  type = string
}

variable "health_lambda_name" {
  type = string
}

variable "health_log_group_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
