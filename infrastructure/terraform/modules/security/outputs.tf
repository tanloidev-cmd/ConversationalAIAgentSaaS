output "kms_key_arn" {
  value = aws_kms_key.main.arn
}

output "lambda_execution_role_arn" {
  value = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  value = aws_iam_role.lambda_execution.name
}

output "sentry_secret_arn" {
  value = aws_secretsmanager_secret.sentry_dsn.arn
}

output "app_config_secret_arn" {
  value = aws_secretsmanager_secret.app_config.arn
}

output "github_actions_role_arn" {
  value = try(aws_iam_role.github_actions_deploy[0].arn, null)
}
