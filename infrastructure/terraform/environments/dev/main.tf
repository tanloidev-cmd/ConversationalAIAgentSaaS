terraform {
  required_version = ">= 1.5.0"
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

locals {
  name_prefix  = "conversational-ai-${var.environment}"
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = "conversational-ai"
  })
  lambda_health_path = "${path.module}/../../../../apps/api/dist/lambda/health.js"
  lambda_me_path     = "${path.module}/../../../../apps/api/dist/lambda/me.js"
}

module "security" {
  source = "../../modules/security"

  name_prefix         = local.name_prefix
  environment         = var.environment
  tags                = local.common_tags
  github_repository   = var.github_repository
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

module "api" {
  source = "../../modules/api"

  name_prefix               = local.name_prefix
  environment               = var.environment
  lambda_execution_role_arn = module.security.lambda_execution_role_arn
  lambda_zip_path           = local.lambda_health_path
  me_lambda_zip_path        = local.lambda_me_path
  cognito_issuer            = module.cognito.issuer
  cognito_audience          = module.cognito.client_id
  cors_allow_origins        = var.cors_allow_origins
  throttle_burst_limit      = var.api_throttle_burst_limit
  throttle_rate_limit       = var.api_throttle_rate_limit
  tags                      = local.common_tags

  depends_on = [module.cognito, module.security]
}

module "observability" {
  source = "../../modules/observability"

  name_prefix           = local.name_prefix
  api_id                = module.api.api_id
  health_lambda_name    = module.api.health_lambda_name
  health_log_group_name = module.api.health_log_group
  tags                  = local.common_tags
}

module "waf" {
  source = "../../modules/waf"

  name_prefix = local.name_prefix
  api_arn     = module.api.api_stage_arn
  enabled     = var.waf_enabled
  rate_limit  = var.waf_rate_limit
  tags        = local.common_tags
}
