data "archive_file" "health_lambda" {
  type        = "zip"
  source_file = var.lambda_zip_path
  output_path = "${path.module}/.build/health.zip"
}

data "archive_file" "me_lambda" {
  type        = "zip"
  source_file = var.me_lambda_zip_path
  output_path = "${path.module}/.build/me.zip"
}

resource "aws_lambda_function" "health" {
  function_name = "${var.name_prefix}-health"
  role          = var.lambda_execution_role_arn
  handler       = "health.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  filename      = data.archive_file.health_lambda.output_path
  source_code_hash = data.archive_file.health_lambda.output_base64sha256
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      ENVIRONMENT  = var.environment
      APP_VERSION  = "0.1.0"
      NODE_ENV     = "production"
      OTEL_ENABLED = "true"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = var.tags
}

resource "aws_lambda_function" "me" {
  function_name = "${var.name_prefix}-me"
  role          = var.lambda_execution_role_arn
  handler       = "me.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  filename      = data.archive_file.me_lambda.output_path
  source_code_hash = data.archive_file.me_lambda.output_base64sha256
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      ENVIRONMENT = var.environment
      NODE_ENV    = "production"
    }
  }

  tracing_config {
    mode = "Active"
  }

  tags = var.tags
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.name_prefix}-http"
  protocol_type = "HTTP"
  tags          = var.tags

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["authorization", "content-type", "x-correlation-id"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.name_prefix}-jwt"

  jwt_configuration {
    audience = [var.cognito_audience]
    issuer   = var.cognito_issuer
  }
}

resource "aws_apigatewayv2_integration" "health" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.health.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "me" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.me.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /v1/health"
  target    = "integrations/${aws_apigatewayv2_integration.health.id}"
}

resource "aws_apigatewayv2_route" "me" {
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "GET /v1/me"
  target             = "integrations/${aws_apigatewayv2_integration.me.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "health" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "me" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.me.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/${var.name_prefix}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = var.environment
  auto_deploy = true
  tags        = var.tags

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format = jsonencode({
      requestId    = "$context.requestId"
      ip           = "$context.identity.sourceIp"
      requestTime  = "$context.requestTime"
      httpMethod   = "$context.httpMethod"
      routeKey     = "$context.routeKey"
      status       = "$context.status"
      responseLen  = "$context.responseLength"
      correlationId = "$request.header.x-correlation-id"
    })
  }

  default_route_settings {
    throttling_burst_limit = var.throttle_burst_limit
    throttling_rate_limit  = var.throttle_rate_limit
  }
}

resource "aws_cloudwatch_log_group" "health_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.health.function_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "me_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.me.function_name}"
  retention_in_days = 14
  tags              = var.tags
}
