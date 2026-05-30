output "api_endpoint" {
  value       = module.api.api_endpoint
  description = "Base URL for HTTP API (append /v1/health)"
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_client_id" {
  value = module.cognito.client_id
}

output "cognito_issuer" {
  value = module.cognito.issuer
}

output "cognito_hosted_ui_domain" {
  value = module.cognito.hosted_ui_domain
}

output "github_actions_role_arn" {
  value = module.security.github_actions_role_arn
}

output "secrets_backend" {
  description = "Active secrets store for this environment"
  value       = module.security.secrets_backend
}

output "sentry_config_name" {
  description = "Set Sentry DSN here (SSM parameter or Secrets Manager secret name)"
  value       = module.security.sentry_config_name
}

output "app_config_name" {
  description = "App config secret/parameter name"
  value       = module.security.app_config_name
}

output "cloudwatch_dashboard" {
  description = "CloudWatch dashboard name when enabled; null in dev by default"
  value       = module.observability.dashboard_name
}
