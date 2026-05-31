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
  function_name    = "${var.name_prefix}-health"
  role             = var.lambda_execution_role_arn
  handler          = "health.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  filename         = data.archive_file.health_lambda.output_path
  source_code_hash = data.archive_file.health_lambda.output_base64sha256
  timeout          = 10
  memory_size      = 256

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
  function_name    = "${var.name_prefix}-me"
  role             = var.lambda_execution_role_arn
  handler          = "me.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  filename         = data.archive_file.me_lambda.output_path
  source_code_hash = data.archive_file.me_lambda.output_base64sha256
  timeout          = 10
  memory_size      = 256

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
      requestId     = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      routeKey      = "$context.routeKey"
      status        = "$context.status"
      responseLen   = "$context.responseLength"
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

locals {
  sessions_enabled = var.sessions_lambda_zip_path != ""

  lambda_env_common = {
    ENVIRONMENT                = var.environment
    NODE_ENV                   = "production"
    SESSIONS_TABLE_NAME        = var.sessions_table_name
    BEDROCK_MODEL_ID_LIGHT     = var.bedrock_model_id_light
    BEDROCK_MODEL_ID_REASONING = var.bedrock_model_id_reasoning
    BEDROCK_MOCK               = "false"
    AGENT_STATE_MACHINE_ARN    = var.agent_state_machine_arn
  }
}

data "archive_file" "sessions_lambda" {
  count       = local.sessions_enabled ? 1 : 0
  type        = "zip"
  source_file = var.sessions_lambda_zip_path
  output_path = "${path.module}/.build/sessions.zip"
}

data "archive_file" "chat_lambda" {
  count       = local.sessions_enabled ? 1 : 0
  type        = "zip"
  source_file = var.chat_lambda_zip_path
  output_path = "${path.module}/.build/chat.zip"
}

data "archive_file" "chat_stream_lambda" {
  count       = local.sessions_enabled ? 1 : 0
  type        = "zip"
  source_file = var.chat_stream_lambda_zip_path
  output_path = "${path.module}/.build/chatStream.zip"
}

data "archive_file" "workflow_runner_lambda" {
  count       = local.sessions_enabled && var.workflow_runner_lambda_zip_path != "" ? 1 : 0
  type        = "zip"
  source_file = var.workflow_runner_lambda_zip_path
  output_path = "${path.module}/.build/workflowRunner.zip"
}

resource "aws_lambda_function" "sessions" {
  count            = local.sessions_enabled ? 1 : 0
  function_name    = "${var.name_prefix}-sessions"
  role             = var.lambda_execution_role_arn
  handler          = "sessions.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  filename         = data.archive_file.sessions_lambda[0].output_path
  source_code_hash = data.archive_file.sessions_lambda[0].output_base64sha256
  timeout          = 30
  memory_size      = 512

  environment {
    variables = local.lambda_env_common
  }

  tracing_config { mode = "Active" }
  tags = var.tags
}

resource "aws_lambda_function" "chat" {
  count            = local.sessions_enabled ? 1 : 0
  function_name    = "${var.name_prefix}-chat"
  role             = var.lambda_execution_role_arn
  handler          = "chat.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  filename         = data.archive_file.chat_lambda[0].output_path
  source_code_hash = data.archive_file.chat_lambda[0].output_base64sha256
  timeout          = 60
  memory_size      = 1024

  environment {
    variables = local.lambda_env_common
  }

  tracing_config { mode = "Active" }
  tags = var.tags
}

resource "aws_lambda_function" "chat_stream" {
  count            = local.sessions_enabled ? 1 : 0
  function_name    = "${var.name_prefix}-chat-stream"
  role             = var.lambda_execution_role_arn
  handler          = "chatStream.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  filename         = data.archive_file.chat_stream_lambda[0].output_path
  source_code_hash = data.archive_file.chat_stream_lambda[0].output_base64sha256
  timeout          = 60
  memory_size      = 1024

  environment {
    variables = local.lambda_env_common
  }

  tracing_config { mode = "Active" }
  tags = var.tags
}

resource "aws_lambda_function" "workflow_runner" {
  count            = local.sessions_enabled && var.workflow_runner_lambda_zip_path != "" ? 1 : 0
  function_name    = "${var.name_prefix}-workflow-runner"
  role             = var.lambda_execution_role_arn
  handler          = "workflowRunner.handler"
  runtime          = "nodejs20.x"
  architectures    = ["arm64"]
  filename         = data.archive_file.workflow_runner_lambda[0].output_path
  source_code_hash = data.archive_file.workflow_runner_lambda[0].output_base64sha256
  timeout          = 120
  memory_size      = 1024

  environment {
    variables = local.lambda_env_common
  }

  tracing_config { mode = "Active" }
  tags = var.tags
}

resource "aws_apigatewayv2_integration" "sessions" {
  count                  = local.sessions_enabled ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.sessions[0].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "chat" {
  count                  = local.sessions_enabled ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.chat[0].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "chat_stream" {
  count                  = local.sessions_enabled ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.chat_stream[0].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "sessions_post" {
  count              = local.sessions_enabled ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "POST /v1/sessions"
  target             = "integrations/${aws_apigatewayv2_integration.sessions[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "sessions_get" {
  count              = local.sessions_enabled ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "GET /v1/sessions/{sessionId}"
  target             = "integrations/${aws_apigatewayv2_integration.sessions[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "chat_post" {
  count              = local.sessions_enabled ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "POST /v1/sessions/{sessionId}/messages"
  target             = "integrations/${aws_apigatewayv2_integration.chat[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "chat_stream_post" {
  count              = local.sessions_enabled ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "POST /v1/sessions/{sessionId}/messages/stream"
  target             = "integrations/${aws_apigatewayv2_integration.chat_stream[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "sessions" {
  count         = local.sessions_enabled ? 1 : 0
  statement_id  = "AllowAPIGatewayInvokeSessions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sessions[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "chat" {
  count         = local.sessions_enabled ? 1 : 0
  statement_id  = "AllowAPIGatewayInvokeChat"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "chat_stream" {
  count         = local.sessions_enabled ? 1 : 0
  statement_id  = "AllowAPIGatewayInvokeChatStream"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat_stream[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "workflow_runner_sfn" {
  count         = local.sessions_enabled && length(aws_lambda_function.workflow_runner) > 0 ? 1 : 0
  statement_id  = "AllowStepFunctionsInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.workflow_runner[0].function_name
  principal     = "states.amazonaws.com"
  source_arn    = var.agent_state_machine_arn != "" ? "${var.agent_state_machine_arn}:*" : "*"
}

resource "aws_cloudwatch_log_group" "sessions_lambda" {
  count             = local.sessions_enabled ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.sessions[0].function_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "chat_lambda" {
  count             = local.sessions_enabled ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.chat[0].function_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "chat_stream_lambda" {
  count             = local.sessions_enabled ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.chat_stream[0].function_name}"
  retention_in_days = 14
  tags              = var.tags
}
