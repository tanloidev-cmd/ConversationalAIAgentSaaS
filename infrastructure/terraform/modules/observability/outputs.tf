output "dashboard_name" {
  description = "CloudWatch dashboard name when enable_cloudwatch_dashboard is true; otherwise null"
  value       = var.enable_cloudwatch_dashboard ? aws_cloudwatch_dashboard.main[0].dashboard_name : null
}
