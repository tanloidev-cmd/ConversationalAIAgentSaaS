output "api_endpoint" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "api_id" {
  value = aws_apigatewayv2_api.http.id
}

output "health_lambda_name" {
  value = aws_lambda_function.health.function_name
}

output "health_log_group" {
  value = aws_cloudwatch_log_group.health_lambda.name
}

output "api_stage_arn" {
  value = aws_apigatewayv2_stage.default.arn
}

output "chat_lambda_arn" {
  value = try(aws_lambda_function.chat[0].arn, null)
}

output "workflow_runner_lambda_arn" {
  value = try(aws_lambda_function.workflow_runner[0].arn, null)
}
