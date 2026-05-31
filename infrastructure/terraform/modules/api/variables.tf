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

variable "sessions_lambda_zip_path" {
  type        = string
  description = "Path to sessions Lambda bundle"
  default     = ""
}

variable "chat_lambda_zip_path" {
  type        = string
  description = "Path to chat Lambda bundle"
  default     = ""
}

variable "chat_stream_lambda_zip_path" {
  type        = string
  description = "Path to chat stream Lambda bundle"
  default     = ""
}

variable "workflow_runner_lambda_zip_path" {
  type        = string
  description = "Path to workflow runner Lambda bundle"
  default     = ""
}

variable "sessions_table_name" {
  type        = string
  description = "DynamoDB sessions table name"
  default     = ""
}

variable "bedrock_model_id_light" {
  type    = string
  default = "amazon.nova-micro-v1:0"
}

variable "bedrock_model_id_reasoning" {
  type    = string
  default = "anthropic.claude-3-5-haiku-20241022-v1:0"
}

variable "agent_state_machine_arn" {
  type        = string
  description = "Step Functions state machine ARN for workflow mode"
  default     = ""
}
