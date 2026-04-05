###############################################################################
# DB Subnet Group — place RDS in private subnets
###############################################################################

resource "aws_db_subnet_group" "main" {
  name        = "${var.project_name}-${var.environment}-db-subnet-group"
  description = "Subnet group for Complif RDS instance"
  subnet_ids  = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

###############################################################################
# Parameter Group for PostgreSQL 15
###############################################################################

resource "aws_db_parameter_group" "postgres15" {
  name        = "${var.project_name}-${var.environment}-pg15"
  family      = "postgres15"
  description = "Custom parameter group for Complif PostgreSQL 15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-pg15"
  }
}

###############################################################################
# RDS PostgreSQL 15 Instance
###############################################################################

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-postgres"

  engine         = "postgres"
  engine_version = "15"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres15.name

  # Availability and backup
  multi_az               = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Protection
  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment == "prod" ? false : true
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-${var.environment}-final-snapshot" : null

  # Performance Insights (free tier for t3.micro)
  performance_insights_enabled = false

  # Monitoring
  monitoring_interval = 0

  publicly_accessible = false

  tags = {
    Name = "${var.project_name}-${var.environment}-postgres"
  }
}
