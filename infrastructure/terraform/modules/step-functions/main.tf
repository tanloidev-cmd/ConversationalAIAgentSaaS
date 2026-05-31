data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  state_machine_name = "${var.name_prefix}-agent-workflow"
}

resource "aws_iam_role" "sfn" {
  name = "${var.name_prefix}-sfn-agent"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "states.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = var.tags
}

resource "aws_iam_role_policy" "sfn_invoke_lambda" {
  name = "${var.name_prefix}-sfn-invoke"
  role = aws_iam_role.sfn.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["lambda:InvokeFunction"]
      Resource = [var.workflow_runner_lambda_arn]
    }]
  })
}

resource "aws_sfn_state_machine" "agent" {
  name     = local.state_machine_name
  role_arn = aws_iam_role.sfn.arn
  type     = "STANDARD"

  definition = jsonencode({
    Comment = "Minimal agent workflow for Phase 2"
    StartAt = "ClassifyIntent"
    States = {
      ClassifyIntent = {
        Type    = "Pass"
        Result  = { tier = "reasoning" }
        Next    = "RunAgent"
      }
      RunAgent = {
        Type     = "Task"
        Resource = var.workflow_runner_lambda_arn
        Retry = [{
          ErrorEquals     = ["States.TaskFailed"]
          IntervalSeconds = 2
          MaxAttempts     = 2
          BackoffRate     = 2
        }]
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "Failed"
        }]
        Next = "Success"
      }
      Success = { Type = "Succeed" }
      Failed  = { Type = "Fail" }
    }
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "lambda_sfn_start" {
  count = var.lambda_execution_role_name != "" ? 1 : 0
  name  = "${var.name_prefix}-lambda-sfn-start"
  role  = var.lambda_execution_role_name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["states:StartExecution"]
      Resource = [aws_sfn_state_machine.agent.arn]
    }]
  })
}
