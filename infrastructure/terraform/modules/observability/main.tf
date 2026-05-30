resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Gateway 4xx/5xx"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/ApiGateway", "4xx", "ApiId", var.api_id],
            [".", "5xx", ".", "."],
          ]
          stat   = "Sum"
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Health Lambda"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.health_lambda_name],
            [".", "Errors", ".", "."],
            [".", "Throttles", ".", "."],
          ]
          stat   = "Average"
          period = 300
        }
      },
    ]
  })
}

resource "aws_cloudwatch_log_metric_filter" "health_errors" {
  name           = "${var.name_prefix}-health-errors"
  log_group_name = var.health_log_group_name
  pattern        = "{ $.level = \"error\" || $.level = \"50\" }"

  metric_transformation {
    name      = "${var.name_prefix}-HealthErrors"
    namespace = "ConversationalAI"
    value     = "1"
  }
}

data "aws_region" "current" {}
