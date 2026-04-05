###############################################################################
# ECS Cluster
###############################################################################

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cluster"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

###############################################################################
# CloudWatch Log Groups
###############################################################################

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-${var.environment}/backend"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-backend-logs"
  }
}

resource "aws_cloudwatch_log_group" "validation" {
  name              = "/ecs/${var.project_name}-${var.environment}/validation-service"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-${var.environment}-validation-logs"
  }
}

###############################################################################
# IAM — ECS Task Execution Role
# (used by ECS agent to pull images and write logs)
###############################################################################

data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "${var.project_name}-${var.environment}-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

###############################################################################
# IAM — ECS Task Role
# (used by the running container — grants S3 access)
###############################################################################

resource "aws_iam_role" "ecs_task" {
  name               = "${var.project_name}-${var.environment}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-task-role"
  }
}

data "aws_iam_policy_document" "ecs_task_s3" {
  statement {
    sid    = "S3DocumentAccess"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.documents.arn,
      "${aws_s3_bucket.documents.arn}/*",
    ]
  }
}

resource "aws_iam_policy" "ecs_task_s3" {
  name        = "${var.project_name}-${var.environment}-ecs-task-s3-policy"
  description = "Allows ECS task to access the documents S3 bucket"
  policy      = data.aws_iam_policy_document.ecs_task_s3.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_s3" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.ecs_task_s3.arn
}

###############################################################################
# Task Definition — Backend
###############################################################################

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-${var.environment}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.backend_image
      essential = true

      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "PORT", value = "3001" },
        { name = "CORS_ORIGIN", value = "https://${var.project_name}.example.com" },
        { name = "VALIDATION_SERVICE_URL", value = "http://localhost:3002" },
        { name = "UPLOAD_DIR", value = "/app/uploads" },
        { name = "JWT_EXPIRATION", value = "15m" },
        { name = "JWT_REFRESH_EXPIRATION", value = "7d" },
        { name = "S3_BUCKET", value = aws_s3_bucket.documents.bucket },
        { name = "AWS_REGION", value = var.aws_region },
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_ssm_parameter.database_url.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-backend-task"
  }
}

###############################################################################
# Task Definition — Validation Service
###############################################################################

resource "aws_ecs_task_definition" "validation" {
  family                   = "${var.project_name}-${var.environment}-validation"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "validation-service"
      image     = var.validation_image
      essential = true

      portMappings = [
        {
          containerPort = 3002
          hostPort      = 3002
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "PORT", value = "3002" },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.validation.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://localhost:3002/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-validation-task"
  }
}

###############################################################################
# SSM Parameters — secrets injected into containers
###############################################################################

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/${var.environment}/DATABASE_URL"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${var.db_name}"

  tags = {
    Name = "${var.project_name}-${var.environment}-database-url"
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project_name}/${var.environment}/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret

  tags = {
    Name = "${var.project_name}-${var.environment}-jwt-secret"
  }
}

# Allow ECS execution role to read SSM parameters
data "aws_iam_policy_document" "ecs_ssm" {
  statement {
    sid    = "ReadSSMParameters"
    effect = "Allow"

    actions = [
      "ssm:GetParameters",
      "ssm:GetParameter",
    ]

    resources = [
      aws_ssm_parameter.database_url.arn,
      aws_ssm_parameter.jwt_secret.arn,
    ]
  }

  statement {
    sid    = "DecryptSSMKMS"
    effect = "Allow"

    actions = ["kms:Decrypt"]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "ecs_ssm" {
  name        = "${var.project_name}-${var.environment}-ecs-ssm-policy"
  description = "Allows ECS execution role to read SSM SecureString parameters"
  policy      = data.aws_iam_policy_document.ecs_ssm.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_ssm" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = aws_iam_policy.ecs_ssm.arn
}

###############################################################################
# ECS Service — Backend
###############################################################################

resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-${var.environment}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  # Uncomment when ALB is configured
  # load_balancer {
  #   target_group_arn = aws_lb_target_group.backend.arn
  #   container_name   = "backend"
  #   container_port   = 3001
  # }

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-backend-service"
  }
}

###############################################################################
# ECS Service — Validation Service
###############################################################################

resource "aws_ecs_service" "validation" {
  name            = "${var.project_name}-${var.environment}-validation"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.validation.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_groups  = [aws_security_group.validation.id]
    assign_public_ip = false
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  lifecycle {
    ignore_changes = [desired_count, task_definition]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-validation-service"
  }
}
