locals {
  use_secrets_manager = var.secrets_backend == "secrets_manager"
  use_ssm             = var.secrets_backend == "ssm"
  use_cmk             = local.use_secrets_manager && var.use_customer_managed_kms
}

resource "aws_kms_key" "main" {
  count = local.use_cmk ? 1 : 0

  description             = "${var.name_prefix} CMK"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = var.tags
}

resource "aws_kms_alias" "main" {
  count = local.use_cmk ? 1 : 0

  name          = "alias/${var.name_prefix}"
  target_key_id = aws_kms_key.main[0].key_id
}

resource "aws_secretsmanager_secret" "sentry_dsn" {
  count = local.use_secrets_manager ? 1 : 0

  name       = "${var.environment}/sentry-dsn"
  kms_key_id = local.use_cmk ? aws_kms_key.main[0].id : null
  tags       = var.tags
}

resource "aws_secretsmanager_secret" "app_config" {
  count = local.use_secrets_manager ? 1 : 0

  name       = "${var.environment}/app-config"
  kms_key_id = local.use_cmk ? aws_kms_key.main[0].id : null
  tags       = var.tags
}

resource "aws_secretsmanager_secret_version" "app_config" {
  count = local.use_secrets_manager ? 1 : 0

  secret_id = aws_secretsmanager_secret.app_config[0].id
  secret_string = jsonencode({
    environment = var.environment
    version     = "0.1.0"
  })
}

resource "aws_ssm_parameter" "sentry_dsn" {
  count = local.use_ssm ? 1 : 0

  name  = "/${var.environment}/sentry-dsn"
  type  = "SecureString"
  value = "UNSET"
  tags  = var.tags

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "app_config" {
  count = local.use_ssm ? 1 : 0

  name = "/${var.environment}/app-config"
  type = "SecureString"
  value = jsonencode({
    environment = var.environment
    version     = "0.1.0"
  })
  tags = var.tags
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execution" {
  name               = "${var.name_prefix}-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "lambda_execution" {
  statement {
    sid    = "Logs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    sid    = "XRay"
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
    ]
    resources = ["*"]
  }

  dynamic "statement" {
    for_each = local.use_secrets_manager ? [1] : []
    content {
      sid    = "SecretsRead"
      effect = "Allow"
      actions = [
        "secretsmanager:GetSecretValue",
      ]
      resources = [
        aws_secretsmanager_secret.sentry_dsn[0].arn,
        aws_secretsmanager_secret.app_config[0].arn,
      ]
    }
  }

  dynamic "statement" {
    for_each = local.use_ssm ? [1] : []
    content {
      sid    = "SsmParametersRead"
      effect = "Allow"
      actions = [
        "ssm:GetParameter",
        "ssm:GetParameters",
      ]
      resources = [
        aws_ssm_parameter.sentry_dsn[0].arn,
        aws_ssm_parameter.app_config[0].arn,
      ]
    }
  }

  dynamic "statement" {
    for_each = local.use_cmk ? [1] : []
    content {
      sid    = "KmsDecryptSecrets"
      effect = "Allow"
      actions = [
        "kms:Decrypt",
      ]
      resources = [aws_kms_key.main[0].arn]
    }
  }
}

resource "aws_iam_role_policy" "lambda_execution" {
  name   = "${var.name_prefix}-lambda-exec"
  role   = aws_iam_role.lambda_execution.id
  policy = data.aws_iam_policy_document.lambda_execution.json
}

data "aws_iam_policy_document" "github_oidc_assume" {
  count = var.github_repository != "" ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github[0].arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:*"]
    }
  }
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.github_repository != "" ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03fa403975a05a069eb1d4c8afd"]
}

resource "aws_iam_role" "github_actions_deploy" {
  count = var.github_repository != "" ? 1 : 0

  name               = "${var.name_prefix}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_assume[0].json
  tags               = var.tags
}

data "aws_iam_policy_document" "github_deploy" {
  count = var.github_repository != "" ? 1 : 0

  statement {
    sid    = "TerraformState"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "DeployServices"
    effect    = "Allow"
    actions   = ["*"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  count = var.github_repository != "" ? 1 : 0

  name   = "${var.name_prefix}-github-deploy"
  role   = aws_iam_role.github_actions_deploy[0].id
  policy = data.aws_iam_policy_document.github_deploy[0].json
}
