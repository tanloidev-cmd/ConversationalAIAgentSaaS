terraform {
  required_version = ">= 1.11.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix  = "conversational-ai-${var.environment}"
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = "conversational-ai"
  })
  lambda_root = "${path.module}/../../../../apps/api/dist/lambda"
  lambda_health_path          = "${local.lambda_root}/health.js"
  lambda_me_path              = "${local.lambda_root}/me.js"
  lambda_sessions_path        = "${local.lambda_root}/sessions.js"
  lambda_chat_path            = "${local.lambda_root}/chat.js"
  lambda_chat_stream_path     = "${local.lambda_root}/chatStream.js"
  lambda_workflow_runner_path = "${local.lambda_root}/workflowRunner.js"
  bedrock_model_arns = [
    "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_model_id_light}",
    "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_model_id_reasoning}",
  ]
  workflow_runner_lambda_arn = "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${local.name_prefix}-workflow-runner"
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  name_prefix                   = local.name_prefix
  enable_point_in_time_recovery = false
  tags                          = local.common_tags
}

module "cognito" {
  source = "../../modules/cognito"

  name_prefix   = local.name_prefix
  environment   = var.environment
  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls
  enable_oauth  = var.enable_oauth
  tags          = local.common_tags
}

module "security" {
  source = "../../modules/security"

  name_prefix              = local.name_prefix
  environment              = var.environment
  tags                     = local.common_tags
  github_repository        = var.github_repository
  secrets_backend          = var.secrets_backend
  use_customer_managed_kms = var.use_customer_managed_kms
  sessions_table_arn       = module.dynamodb.table_arn
  bedrock_model_arns       = local.bedrock_model_arns

  depends_on = [module.dynamodb]
}

module "step_functions" {
  source = "../../modules/step-functions"

  name_prefix                = local.name_prefix
  workflow_runner_lambda_arn = local.workflow_runner_lambda_arn
  lambda_execution_role_name = module.security.lambda_execution_role_name
  tags                       = local.common_tags

  depends_on = [module.security]
}

module "api" {
  source = "../../modules/api"

  name_prefix                     = local.name_prefix
  environment                     = var.environment
  lambda_execution_role_arn       = module.security.lambda_execution_role_arn
  lambda_zip_path                 = local.lambda_health_path
  me_lambda_zip_path              = local.lambda_me_path
  sessions_lambda_zip_path        = local.lambda_sessions_path
  chat_lambda_zip_path            = local.lambda_chat_path
  chat_stream_lambda_zip_path     = local.lambda_chat_stream_path
  workflow_runner_lambda_zip_path = local.lambda_workflow_runner_path
  sessions_table_name             = module.dynamodb.table_name
  bedrock_model_id_light          = var.bedrock_model_id_light
  bedrock_model_id_reasoning      = var.bedrock_model_id_reasoning
  agent_state_machine_arn         = module.step_functions.state_machine_arn
  cognito_issuer                  = module.cognito.issuer
  cognito_audience                = module.cognito.client_id
  cors_allow_origins              = var.cors_allow_origins
  throttle_burst_limit            = var.api_throttle_burst_limit
  throttle_rate_limit             = var.api_throttle_rate_limit
  tags                            = local.common_tags

  depends_on = [module.cognito, module.security, module.dynamodb, module.step_functions]
}

module "observability" {
  source = "../../modules/observability"

  name_prefix                 = local.name_prefix
  api_id                      = module.api.api_id
  health_lambda_name          = module.api.health_lambda_name
  health_log_group_name       = module.api.health_log_group
  enable_cloudwatch_dashboard = var.enable_cloudwatch_dashboard
  tags                        = local.common_tags
}

module "waf" {
  source = "../../modules/waf"

  name_prefix = local.name_prefix
  api_arn     = module.api.api_stage_arn
  enabled     = var.waf_enabled
  rate_limit  = var.waf_rate_limit
  tags        = local.common_tags
}
