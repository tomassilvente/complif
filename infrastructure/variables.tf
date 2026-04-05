variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name of the project; used as a prefix for resource names"
  type        = string
  default     = "complif"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod"
  }
}

variable "db_username" {
  description = "Master username for the RDS PostgreSQL instance"
  type        = string
  default     = "complif"

  sensitive = true
}

variable "db_password" {
  description = "Master password for the RDS PostgreSQL instance"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the initial PostgreSQL database"
  type        = string
  default     = "complif_db"
}

variable "backend_image" {
  description = "Full ECR image URI for the backend service (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/complif-backend:latest)"
  type        = string
  default     = "placeholder/complif-backend:latest"
}

variable "validation_image" {
  description = "Full ECR image URI for the validation-service (e.g. 123456789.dkr.ecr.us-east-1.amazonaws.com/complif-validation:latest)"
  type        = string
  default     = "placeholder/complif-validation:latest"
}

variable "jwt_secret" {
  description = "Secret key used to sign JWT tokens"
  type        = string
  sensitive   = true
}
