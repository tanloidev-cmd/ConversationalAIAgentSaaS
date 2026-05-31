variable "name_prefix" {
  type = string
}

variable "workflow_runner_lambda_arn" {
  type = string
}

variable "lambda_execution_role_name" {
  type        = string
  description = "Lambda execution role to grant states:StartExecution"
  default     = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
