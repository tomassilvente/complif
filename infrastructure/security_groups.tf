###############################################################################
# ALB Security Group — accepts HTTP/HTTPS from the internet
###############################################################################

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Allow HTTP and HTTPS from anywhere"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  }
}

###############################################################################
# Backend Security Group — accepts port 3001 from ALB only
###############################################################################

resource "aws_security_group" "backend" {
  name        = "${var.project_name}-${var.environment}-backend-sg"
  description = "Allow port 3001 from ALB security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description             = "Backend API from ALB"
    from_port               = 3001
    to_port                 = 3001
    protocol                = "tcp"
    security_groups         = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-backend-sg"
  }
}

###############################################################################
# RDS Security Group — accepts port 5432 from backend only
###############################################################################

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Allow PostgreSQL port 5432 from backend security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description             = "PostgreSQL from backend"
    from_port               = 5432
    to_port                 = 5432
    protocol                = "tcp"
    security_groups         = [aws_security_group.backend.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-sg"
  }
}

###############################################################################
# Validation Service Security Group — accepts port 3002 from backend only
###############################################################################

resource "aws_security_group" "validation" {
  name        = "${var.project_name}-${var.environment}-validation-sg"
  description = "Allow port 3002 from backend security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description             = "Validation service from backend"
    from_port               = 3002
    to_port                 = 3002
    protocol                = "tcp"
    security_groups         = [aws_security_group.backend.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-validation-sg"
  }
}
