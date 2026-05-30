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

output "cloudwatch_dashboard" {
  value = module.observability.dashboard_name
}
