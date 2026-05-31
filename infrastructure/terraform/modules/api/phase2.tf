locals {
  phase2_enabled = var.sessions_lambda_zip_path != ""

  lambda_env_common = {
    ENVIRONMENT                  = var.environment
    NODE_ENV                     = "production"
    SESSIONS_TABLE_NAME          = var.sessions_table_name
    BEDROCK_MODEL_ID_LIGHT       = var.bedrock_model_id_light
    BEDROCK_MODEL_ID_REASONING   = var.bedrock_model_id_reasoning
    BEDROCK_MOCK                 = "false"
    AGENT_STATE_MACHINE_ARN      = var.agent_state_machine_arn
  }
}

data "archive_file" "sessions_lambda" {
  count       = local.phase2_enabled ? 1 : 0
  type        = "zip"
  source_file = var.sessions_lambda_zip_path
  output_path = "${path.module}/.build/sessions.zip"
}

data "archive_file" "chat_lambda" {
  count       = local.phase2_enabled ? 1 : 0
  type        = "zip"
  source_file = var.chat_lambda_zip_path
  output_path = "${path.module}/.build/chat.zip"
}

data "archive_file" "chat_stream_lambda" {
  count       = local.phase2_enabled ? 1 : 0
  type        = "zip"
  source_file = var.chat_stream_lambda_zip_path
  output_path = "${path.module}/.build/chatStream.zip"
}

data "archive_file" "workflow_runner_lambda" {
  count       = local.phase2_enabled && var.workflow_runner_lambda_zip_path != "" ? 1 : 0
  type        = "zip"
  source_file = var.workflow_runner_lambda_zip_path
  output_path = "${path.module}/.build/workflowRunner.zip"
}

resource "aws_lambda_function" "sessions" {
  count         = local.phase2_enabled ? 1 : 0
  function_name = "${var.name_prefix}-sessions"
  role          = var.lambda_execution_role_arn
  handler       = "sessions.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  filename      = data.archive_file.sessions_lambda[0].output_path
  source_code_hash = data.archive_file.sessions_lambda[0].output_base64sha256
  timeout       = 30
  memory_size   = 512

  environment {
    variables = local.lambda_env_common
  }

  tracing_config { mode = "Active" }
  tags = var.tags
}

resource "aws_lambda_function" "chat" {
  count         = local.phase2_enabled ? 1 : 0
  function_name = "${var.name_prefix}-chat"
  role          = var.lambda_execution_role_arn
  handler       = "chat.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  filename      = data.archive_file.chat_lambda[0].output_path
  source_code_hash = data.archive_file.chat_lambda[0].output_base64sha256
  timeout       = 60
  memory_size   = 1024

  environment {
    variables = local.lambda_env_common
  }

  tracing_config { mode = "Active" }
  tags = var.tags
}

resource "aws_lambda_function" "chat_stream" {
  count         = local.phase2_enabled ? 1 : 0
  function_name = "${var.name_prefix}-chat-stream"
  role          = var.lambda_execution_role_arn
  handler       = "chatStream.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  filename      = data.archive_file.chat_stream_lambda[0].output_path
  source_code_hash = data.archive_file.chat_stream_lambda[0].output_base64sha256
  timeout       = 60
  memory_size   = 1024

  environment {
    variables = local.lambda_env_common
  }

  tracing_config { mode = "Active" }
  tags = var.tags
}

resource "aws_lambda_function" "workflow_runner" {
  count         = local.phase2_enabled && var.workflow_runner_lambda_zip_path != "" ? 1 : 0
  function_name = "${var.name_prefix}-workflow-runner"
  role          = var.lambda_execution_role_arn
  handler       = "workflowRunner.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  filename      = data.archive_file.workflow_runner_lambda[0].output_path
  source_code_hash = data.archive_file.workflow_runner_lambda[0].output_base64sha256
  timeout       = 120
  memory_size   = 1024

  environment {
    variables = local.lambda_env_common
  }

  tracing_config { mode = "Active" }
  tags = var.tags
}

resource "aws_apigatewayv2_integration" "sessions" {
  count                  = local.phase2_enabled ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.sessions[0].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "chat" {
  count                  = local.phase2_enabled ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.chat[0].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "chat_stream" {
  count                  = local.phase2_enabled ? 1 : 0
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.chat_stream[0].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "sessions_post" {
  count              = local.phase2_enabled ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "POST /v1/sessions"
  target             = "integrations/${aws_apigatewayv2_integration.sessions[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "sessions_get" {
  count              = local.phase2_enabled ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "GET /v1/sessions/{sessionId}"
  target             = "integrations/${aws_apigatewayv2_integration.sessions[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "chat_post" {
  count              = local.phase2_enabled ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "POST /v1/sessions/{sessionId}/messages"
  target             = "integrations/${aws_apigatewayv2_integration.chat[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_route" "chat_stream_post" {
  count              = local.phase2_enabled ? 1 : 0
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "POST /v1/sessions/{sessionId}/messages/stream"
  target             = "integrations/${aws_apigatewayv2_integration.chat_stream[0].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "sessions" {
  count         = local.phase2_enabled ? 1 : 0
  statement_id  = "AllowAPIGatewayInvokeSessions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sessions[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "chat" {
  count         = local.phase2_enabled ? 1 : 0
  statement_id  = "AllowAPIGatewayInvokeChat"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "chat_stream" {
  count         = local.phase2_enabled ? 1 : 0
  statement_id  = "AllowAPIGatewayInvokeChatStream"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat_stream[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "workflow_runner_sfn" {
  count         = local.phase2_enabled && length(aws_lambda_function.workflow_runner) > 0 ? 1 : 0
  statement_id  = "AllowStepFunctionsInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.workflow_runner[0].function_name
  principal     = "states.amazonaws.com"
  source_arn    = var.agent_state_machine_arn != "" ? "${var.agent_state_machine_arn}:*" : "*"
}

resource "aws_cloudwatch_log_group" "sessions_lambda" {
  count             = local.phase2_enabled ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.sessions[0].function_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "chat_lambda" {
  count             = local.phase2_enabled ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.chat[0].function_name}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "chat_stream_lambda" {
  count             = local.phase2_enabled ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.chat_stream[0].function_name}"
  retention_in_days = 14
  tags              = var.tags
}
