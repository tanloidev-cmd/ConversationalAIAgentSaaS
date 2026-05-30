output "kms_key_arn" {
  description = "Customer-managed KMS key ARN when use_customer_managed_kms is true; otherwise null"
  value       = local.use_cmk ? aws_kms_key.main[0].arn : null
}

output "secrets_backend" {
  description = "Active secrets store: secrets_manager or ssm"
  value       = var.secrets_backend
}

output "lambda_execution_role_arn" {
  value = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  value = aws_iam_role.lambda_execution.name
}

output "sentry_secret_arn" {
  description = "Secrets Manager secret ARN or SSM parameter ARN for Sentry DSN"
  value       = local.use_secrets_manager ? aws_secretsmanager_secret.sentry_dsn[0].arn : aws_ssm_parameter.sentry_dsn[0].arn
}

output "sentry_config_name" {
  description = "Secrets Manager secret name or SSM parameter name for Sentry DSN"
  value       = local.use_secrets_manager ? aws_secretsmanager_secret.sentry_dsn[0].name : aws_ssm_parameter.sentry_dsn[0].name
}

output "app_config_secret_arn" {
  description = "Secrets Manager secret ARN or SSM parameter ARN for app config"
  value       = local.use_secrets_manager ? aws_secretsmanager_secret.app_config[0].arn : aws_ssm_parameter.app_config[0].arn
}

output "app_config_name" {
  description = "Secrets Manager secret name or SSM parameter name for app config"
  value       = local.use_secrets_manager ? aws_secretsmanager_secret.app_config[0].name : aws_ssm_parameter.app_config[0].name
}

output "github_actions_role_arn" {
  value = try(aws_iam_role.github_actions_deploy[0].arn, null)
}
