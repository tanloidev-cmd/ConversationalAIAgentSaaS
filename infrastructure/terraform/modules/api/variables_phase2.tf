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
